import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get user notifications
export const getByUser = query({
    args: { userId: v.id("users"), limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const notifications = await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc")
            .take(args.limit || 50);

        return notifications;
    },
});

// Get unread count
export const getUnreadCount = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const notifications = await ctx.db
            .query("notifications")
            .withIndex("by_user_read", (q) => q.eq("userId", args.userId).eq("isRead", false))
            .collect();

        return notifications.length;
    },
});

// Mark as read
export const markAsRead = mutation({
    args: { notificationId: v.id("notifications") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.notificationId, { isRead: true });
    },
});

// Mark all as read
export const markAllAsRead = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const notifications = await ctx.db
            .query("notifications")
            .withIndex("by_user_read", (q) => q.eq("userId", args.userId).eq("isRead", false))
            .collect();

        for (const notification of notifications) {
            await ctx.db.patch(notification._id, { isRead: true });
        }

        return { updated: notifications.length };
    },
});

// Delete notification
export const remove = mutation({
    args: { notificationId: v.id("notifications") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.notificationId);
    },
});

// Clear all notifications
export const clearAll = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const notifications = await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        for (const notification of notifications) {
            await ctx.db.delete(notification._id);
        }

        return { deleted: notifications.length };
    },
});

// Create notification
export const create = mutation({
    args: {
        userId: v.id("users"),
        type: v.union(
            v.literal("course_update"),
            v.literal("new_lesson"),
            v.literal("comment_reply"),
            v.literal("certificate_ready"),
            v.literal("quiz_result"),
            v.literal("enrollment_confirmed"),
            v.literal("announcement"),
            v.literal("reminder")
        ),
        title: v.string(),
        message: v.string(),
        link: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("notifications", {
            ...args,
            isRead: false,
            createdAt: Date.now(),
        });
    },
});

// Send bulk notification (admin)
export const sendBulk = mutation({
    args: {
        userIds: v.array(v.id("users")),
        type: v.union(
            v.literal("course_update"),
            v.literal("new_lesson"),
            v.literal("comment_reply"),
            v.literal("certificate_ready"),
            v.literal("quiz_result"),
            v.literal("enrollment_confirmed"),
            v.literal("announcement"),
            v.literal("reminder")
        ),
        title: v.string(),
        message: v.string(),
        link: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const { userIds, ...notificationData } = args;
        const now = Date.now();

        for (const userId of userIds) {
            await ctx.db.insert("notifications", {
                userId,
                ...notificationData,
                isRead: false,
                createdAt: now,
            });
        }

        return { sent: userIds.length };
    },
});

// Send notification to all students in a course
export const sendToCourseStudents = mutation({
    args: {
        courseId: v.id("courses"),
        type: v.union(
            v.literal("course_update"),
            v.literal("new_lesson"),
            v.literal("announcement"),
            v.literal("reminder")
        ),
        title: v.string(),
        message: v.string(),
        link: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { courseId, ...notificationData } = args;

        // Get all enrollments for the course
        const enrollments = await ctx.db
            .query("enrollments")
            .withIndex("by_course", (q) => q.eq("courseId", courseId))
            .collect();

        const now = Date.now();
        let sentCount = 0;

        for (const enrollment of enrollments) {
            await ctx.db.insert("notifications", {
                userId: enrollment.userId,
                ...notificationData,
                isRead: false,
                metadata: { courseId },
                createdAt: now,
            });
            sentCount++;
        }

        return { sent: sentCount };
    },
});

// ================================
// ANNOUNCEMENTS
// ================================

// Get announcements for organization
export const getAnnouncements = query({
    args: {
        organizationId: v.id("organizations"),
        includeExpired: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        const announcements = await ctx.db
            .query("announcements")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        const filtered = args.includeExpired
            ? announcements
            : announcements.filter(a => a.isPublished && (!a.expiresAt || a.expiresAt > now));

        // Enrich with author info
        const enriched = await Promise.all(
            filtered.map(async (announcement) => {
                const author = await ctx.db.get(announcement.authorId);
                return {
                    ...announcement,
                    author: author ? {
                        _id: author._id,
                        name: `${author.firstName} ${author.lastName}`,
                        imageUrl: author.imageUrl,
                    } : null,
                };
            })
        );

        return enriched.sort((a, b) => {
            // High priority first, then by date
            const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return b.createdAt - a.createdAt;
        });
    },
});

// Search users by name or email (for targeted notifications)
export const searchUsers = query({
    args: {
        organizationId: v.id("organizations"),
        search: v.optional(v.string()),
        role: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let users = await ctx.db
            .query("users")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        // Filter by role if specified
        if (args.role && args.role !== "all") {
            users = users.filter(u => u.role === args.role);
        }

        // Filter by search term (name or email)
        if (args.search && args.search.trim()) {
            const searchLower = args.search.toLowerCase().trim();
            users = users.filter(u =>
                u.firstName.toLowerCase().includes(searchLower) ||
                u.lastName.toLowerCase().includes(searchLower) ||
                u.email.toLowerCase().includes(searchLower) ||
                `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchLower)
            );
        }

        // Limit results
        const limit = args.limit || 20;
        users = users.slice(0, limit);

        return users.map(u => ({
            _id: u._id,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            role: u.role,
            imageUrl: u.imageUrl,
        }));
    },
});

// Create announcement
export const createAnnouncement = mutation({
    args: {
        organizationId: v.id("organizations"),
        authorId: v.id("users"),
        title: v.string(),
        content: v.string(),
        priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
        targetRoles: v.array(v.string()),
        targetUserIds: v.optional(v.array(v.id("users"))), // NEW: specific users
        expiresAt: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        const announcementId = await ctx.db.insert("announcements", {
            organizationId: args.organizationId,
            authorId: args.authorId,
            title: args.title,
            content: args.content,
            priority: args.priority,
            targetRoles: args.targetRoles,
            isPublished: true,
            expiresAt: args.expiresAt,
            createdAt: now,
            updatedAt: now,
        });

        let targetUsers: { _id: any }[] = [];

        // If specific users are provided, use them
        if (args.targetUserIds && args.targetUserIds.length > 0) {
            targetUsers = args.targetUserIds.map(id => ({ _id: id }));
        } else {
            // Otherwise, filter by roles
            const users = await ctx.db
                .query("users")
                .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
                .collect();

            targetUsers = args.targetRoles.includes("all")
                ? users
                : users.filter(u => args.targetRoles.includes(u.role));
        }

        for (const user of targetUsers) {
            await ctx.db.insert("notifications", {
                userId: user._id,
                type: "announcement",
                title: args.title,
                message: args.content.substring(0, 100) + (args.content.length > 100 ? "..." : ""),
                link: "/student",
                isRead: false,
                metadata: { announcementId },
                createdAt: now,
            });
        }

        return { announcementId, notified: targetUsers.length };
    },
});

// Update announcement
export const updateAnnouncement = mutation({
    args: {
        announcementId: v.id("announcements"),
        title: v.optional(v.string()),
        content: v.optional(v.string()),
        priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
        targetRoles: v.optional(v.array(v.string())),
        expiresAt: v.optional(v.number()),
        isPublished: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { announcementId, ...updates } = args;
        await ctx.db.patch(announcementId, {
            ...updates,
            updatedAt: Date.now(),
        });
    },
});

// Delete announcement
export const deleteAnnouncement = mutation({
    args: { announcementId: v.id("announcements") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.announcementId);
    },
});
