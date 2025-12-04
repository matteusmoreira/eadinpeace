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
            .withIndex("by_user_unread", (q) => q.eq("userId", args.userId).eq("isRead", false))
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
            .withIndex("by_user_unread", (q) => q.eq("userId", args.userId).eq("isRead", false))
            .collect();

        for (const notification of notifications) {
            await ctx.db.patch(notification._id, { isRead: true });
        }
    },
});

// Delete notification
export const remove = mutation({
    args: { notificationId: v.id("notifications") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.notificationId);
    },
});

// Create notification
export const create = mutation({
    args: {
        userId: v.id("users"),
        title: v.string(),
        message: v.string(),
        type: v.union(
            v.literal("info"),
            v.literal("success"),
            v.literal("warning"),
            v.literal("achievement")
        ),
        link: v.optional(v.string()),
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
        title: v.string(),
        message: v.string(),
        type: v.union(
            v.literal("info"),
            v.literal("success"),
            v.literal("warning"),
            v.literal("achievement")
        ),
        link: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        for (const userId of args.userIds) {
            await ctx.db.insert("notifications", {
                userId,
                title: args.title,
                message: args.message,
                type: args.type,
                link: args.link,
                isRead: false,
                createdAt: now,
            });
        }
    },
});
