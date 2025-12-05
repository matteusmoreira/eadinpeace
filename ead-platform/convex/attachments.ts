import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get attachments for a lesson
export const getByLesson = query({
    args: { lessonId: v.id("lessons") },
    handler: async (ctx, args) => {
        const attachments = await ctx.db
            .query("lessonAttachments")
            .withIndex("by_lesson", (q) => q.eq("lessonId", args.lessonId))
            .collect();

        return attachments.sort((a, b) => b.createdAt - a.createdAt);
    },
});

// Add attachment to lesson
export const create = mutation({
    args: {
        lessonId: v.id("lessons"),
        name: v.string(),
        type: v.union(
            v.literal("pdf"),
            v.literal("document"),
            v.literal("spreadsheet"),
            v.literal("image"),
            v.literal("video"),
            v.literal("audio"),
            v.literal("archive"),
            v.literal("other")
        ),
        url: v.string(),
        storageId: v.optional(v.id("_storage")),
        size: v.number(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("lessonAttachments", {
            ...args,
            downloadCount: 0,
            createdAt: Date.now(),
        });
    },
});

// Delete attachment
export const remove = mutation({
    args: { attachmentId: v.id("lessonAttachments") },
    handler: async (ctx, args) => {
        const attachment = await ctx.db.get(args.attachmentId);

        // If stored in Convex storage, delete the file
        if (attachment?.storageId) {
            await ctx.storage.delete(attachment.storageId);
        }

        await ctx.db.delete(args.attachmentId);
    },
});

// Increment download count
export const incrementDownload = mutation({
    args: { attachmentId: v.id("lessonAttachments") },
    handler: async (ctx, args) => {
        const attachment = await ctx.db.get(args.attachmentId);
        if (!attachment) return;

        await ctx.db.patch(args.attachmentId, {
            downloadCount: attachment.downloadCount + 1,
        });
    },
});

// Generate upload URL for file storage
export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

// Get storage URL
export const getStorageUrl = query({
    args: { storageId: v.id("_storage") },
    handler: async (ctx, args) => {
        return await ctx.storage.getUrl(args.storageId);
    },
});

// Get all attachments for a course
export const getByCourse = query({
    args: { courseId: v.id("courses") },
    handler: async (ctx, args) => {
        const lessons = await ctx.db
            .query("lessons")
            .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
            .collect();

        const allAttachments = [];
        for (const lesson of lessons) {
            const attachments = await ctx.db
                .query("lessonAttachments")
                .withIndex("by_lesson", (q) => q.eq("lessonId", lesson._id))
                .collect();

            for (const attachment of attachments) {
                allAttachments.push({
                    ...attachment,
                    lessonTitle: lesson.title,
                });
            }
        }

        return allAttachments;
    },
});

// Helper to detect file type
export const detectFileType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    const typeMap: Record<string, string> = {
        // PDF
        'pdf': 'pdf',
        // Documents
        'doc': 'document',
        'docx': 'document',
        'txt': 'document',
        'rtf': 'document',
        'odt': 'document',
        // Spreadsheets
        'xls': 'spreadsheet',
        'xlsx': 'spreadsheet',
        'csv': 'spreadsheet',
        'ods': 'spreadsheet',
        // Images
        'jpg': 'image',
        'jpeg': 'image',
        'png': 'image',
        'gif': 'image',
        'webp': 'image',
        'svg': 'image',
        // Video
        'mp4': 'video',
        'avi': 'video',
        'mov': 'video',
        'mkv': 'video',
        'webm': 'video',
        // Audio
        'mp3': 'audio',
        'wav': 'audio',
        'ogg': 'audio',
        'flac': 'audio',
        // Archives
        'zip': 'archive',
        'rar': 'archive',
        '7z': 'archive',
        'tar': 'archive',
        'gz': 'archive',
    };

    return typeMap[ext] || 'other';
};
