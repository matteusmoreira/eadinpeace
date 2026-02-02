import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate upload URL
export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

// Get file URL from storage ID
export const getFileUrl = query({
    args: { storageId: v.id("_storage") },
    handler: async (ctx, args) => {
        return await ctx.storage.getUrl(args.storageId);
    },
});

// Delete file from storage
export const deleteFile = mutation({
    args: { storageId: v.id("_storage") },
    handler: async (ctx, args) => {
        await ctx.storage.delete(args.storageId);
    },
});

// Upload and store course thumbnail
export const uploadCourseThumbnail = mutation({
    args: {
        courseId: v.id("courses"),
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const url = await ctx.storage.getUrl(args.storageId);

        await ctx.db.patch(args.courseId, {
            thumbnail: url || undefined,
            updatedAt: Date.now(),
        });

        return url;
    },
});

// Upload lesson file (PDF, etc)
export const uploadLessonFile = mutation({
    args: {
        lessonId: v.id("lessons"),
        storageId: v.id("_storage"),
        fileName: v.string(),
    },
    handler: async (ctx, args) => {
        const url = await ctx.storage.getUrl(args.storageId);

        await ctx.db.patch(args.lessonId, {
            fileUrl: url || undefined,
            fileStorageId: args.storageId,
            fileName: args.fileName,
            updatedAt: Date.now(),
        });

        return url;
    },
});

// Upload user avatar/profile picture
export const uploadUserAvatar = mutation({
    args: {
        userId: v.id("users"),
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const url = await ctx.storage.getUrl(args.storageId);

        await ctx.db.patch(args.userId, {
            imageUrl: url || undefined,
            updatedAt: Date.now(),
        });

        return url;
    },
});
