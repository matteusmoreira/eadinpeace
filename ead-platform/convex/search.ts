import { v } from "convex/values";
import { query } from "./_generated/server";

// Global search across courses, lessons, and forum
export const globalSearch = query({
    args: {
        organizationId: v.id("organizations"),
        query: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        if (!args.query || args.query.length < 2) {
            return { courses: [], lessons: [], topics: [] };
        }

        const searchTerms = args.query.toLowerCase().split(" ");
        const limit = args.limit || 10;

        // Search courses
        const allCourses = await ctx.db
            .query("courses")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        const courses = allCourses
            .filter((course) => {
                if (!course.isPublished) return false;
                const searchText = `${course.title} ${course.description} ${course.category}`.toLowerCase();
                return searchTerms.some((term) => searchText.includes(term));
            })
            .slice(0, limit)
            .map((course) => ({
                _id: course._id,
                type: "course" as const,
                title: course.title,
                description: course.description.substring(0, 100) + "...",
                thumbnail: course.thumbnail,
                category: course.category,
                level: course.level,
                url: `/student/courses/${course._id}`,
            }));

        // Search lessons
        const allLessons = await ctx.db
            .query("lessons")
            .withIndex("by_course")
            .collect();

        // Filter by organization through courses
        const courseIds = allCourses.filter(c => c.isPublished).map(c => c._id.toString());

        const lessons = await Promise.all(
            allLessons
                .filter((lesson) => {
                    if (!lesson.isPublished) return false;
                    if (!courseIds.includes(lesson.courseId.toString())) return false;
                    const searchText = `${lesson.title} ${lesson.description || ""}`.toLowerCase();
                    return searchTerms.some((term) => searchText.includes(term));
                })
                .slice(0, limit)
                .map(async (lesson) => {
                    const course = await ctx.db.get(lesson.courseId);
                    return {
                        _id: lesson._id,
                        type: "lesson" as const,
                        title: lesson.title,
                        description: lesson.description?.substring(0, 100) || "",
                        courseName: course?.title || "",
                        courseId: lesson.courseId,
                        duration: lesson.duration,
                        url: `/student/courses/${lesson.courseId}/learn`,
                    };
                })
        );

        // Search forum topics
        const allTopics = await ctx.db
            .query("forumTopics")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        const topics = await Promise.all(
            allTopics
                .filter((topic) => {
                    const searchText = `${topic.title} ${topic.content} ${topic.tags.join(" ")}`.toLowerCase();
                    return searchTerms.some((term) => searchText.includes(term));
                })
                .slice(0, limit)
                .map(async (topic) => {
                    const author = await ctx.db.get(topic.authorId);
                    return {
                        _id: topic._id,
                        type: "topic" as const,
                        title: topic.title,
                        description: topic.content.substring(0, 100) + "...",
                        author: author ? `${author.firstName} ${author.lastName}` : "",
                        replyCount: topic.replyCount,
                        isSolved: topic.isSolved,
                        url: `/student/community/topic/${topic._id}`,
                    };
                })
        );

        return {
            courses,
            lessons,
            topics,
            totalResults: courses.length + lessons.length + topics.length,
        };
    },
});

// Quick search (just courses and lessons for autocomplete)
export const quickSearch = query({
    args: {
        organizationId: v.id("organizations"),
        query: v.string(),
    },
    handler: async (ctx, args) => {
        if (!args.query || args.query.length < 2) {
            return [];
        }

        const searchTerm = args.query.toLowerCase();
        const results: any[] = [];

        // Search courses
        const courses = await ctx.db
            .query("courses")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        for (const course of courses) {
            if (!course.isPublished) continue;
            if (course.title.toLowerCase().includes(searchTerm)) {
                results.push({
                    _id: course._id,
                    type: "course",
                    title: course.title,
                    url: `/student/courses/${course._id}`,
                });
            }
            if (results.length >= 5) break;
        }

        // Search lessons
        const courseIds = courses.filter(c => c.isPublished).map(c => c._id);

        for (const courseId of courseIds) {
            const lessons = await ctx.db
                .query("lessons")
                .withIndex("by_course", (q) => q.eq("courseId", courseId))
                .collect();

            for (const lesson of lessons) {
                if (!lesson.isPublished) continue;
                if (lesson.title.toLowerCase().includes(searchTerm)) {
                    const course = courses.find(c => c._id === lesson.courseId);
                    results.push({
                        _id: lesson._id,
                        type: "lesson",
                        title: lesson.title,
                        subtitle: course?.title,
                        url: `/student/courses/${lesson.courseId}/learn`,
                    });
                }
                if (results.length >= 8) break;
            }
            if (results.length >= 8) break;
        }

        return results.slice(0, 8);
    },
});

// Search courses only
export const searchCourses = query({
    args: {
        organizationId: v.id("organizations"),
        query: v.optional(v.string()),
        category: v.optional(v.string()),
        level: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let courses = await ctx.db
            .query("courses")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        // Filter by published
        courses = courses.filter(c => c.isPublished);

        // Filter by search query
        if (args.query && args.query.length >= 2) {
            const searchTerm = args.query.toLowerCase();
            courses = courses.filter((course) => {
                const searchText = `${course.title} ${course.description}`.toLowerCase();
                return searchText.includes(searchTerm);
            });
        }

        // Filter by category
        if (args.category) {
            courses = courses.filter(c => c.category === args.category);
        }

        // Filter by level
        if (args.level) {
            courses = courses.filter(c => c.level === args.level);
        }

        // Enrich with instructor data and stats
        const enriched = await Promise.all(
            courses.map(async (course) => {
                const instructor = await ctx.db.get(course.instructorId);
                const lessons = await ctx.db
                    .query("lessons")
                    .withIndex("by_course", (q) => q.eq("courseId", course._id))
                    .collect();
                const enrollments = await ctx.db
                    .query("enrollments")
                    .withIndex("by_course", (q) => q.eq("courseId", course._id))
                    .collect();

                return {
                    ...course,
                    instructor: instructor ? {
                        _id: instructor._id,
                        name: `${instructor.firstName} ${instructor.lastName}`,
                        imageUrl: instructor.imageUrl,
                    } : null,
                    lessonCount: lessons.filter(l => l.isPublished).length,
                    studentCount: enrollments.length,
                };
            })
        );

        return enriched;
    },
});

// Get all categories (for filter)
export const getCategories = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        const courses = await ctx.db
            .query("courses")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        const categories = [...new Set(courses.filter(c => c.isPublished).map(c => c.category))];

        return categories.map(category => ({
            name: category,
            count: courses.filter(c => c.category === category && c.isPublished).length,
        }));
    },
});
