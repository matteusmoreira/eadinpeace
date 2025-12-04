import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // Organizations (Tenants)
    organizations: defineTable({
        name: v.string(),
        slug: v.string(),
        logo: v.optional(v.string()),
        primaryColor: v.optional(v.string()),
        plan: v.union(v.literal("starter"), v.literal("professional"), v.literal("enterprise")),
        maxUsers: v.number(),
        maxCourses: v.number(),
        isActive: v.boolean(),
        clerkOrgId: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_slug", ["slug"])
        .index("by_clerk_org", ["clerkOrgId"]),

    // Users
    users: defineTable({
        clerkId: v.string(),
        email: v.string(),
        firstName: v.string(),
        lastName: v.string(),
        imageUrl: v.optional(v.string()),
        role: v.union(
            v.literal("superadmin"),
            v.literal("admin"),
            v.literal("professor"),
            v.literal("student")
        ),
        organizationId: v.optional(v.id("organizations")),
        isActive: v.boolean(),
        lastLoginAt: v.optional(v.number()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_clerk_id", ["clerkId"])
        .index("by_email", ["email"])
        .index("by_organization", ["organizationId"])
        .index("by_role", ["role"]),

    // Courses
    courses: defineTable({
        title: v.string(),
        slug: v.string(),
        description: v.string(),
        thumbnail: v.optional(v.string()),
        organizationId: v.id("organizations"),
        instructorId: v.id("users"),
        category: v.string(),
        level: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
        duration: v.number(), // in minutes
        isPublished: v.boolean(),
        isFeatured: v.boolean(),
        price: v.optional(v.number()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_organization", ["organizationId"])
        .index("by_instructor", ["instructorId"])
        .index("by_slug", ["slug"])
        .index("by_category", ["category"]),

    // Modules (Course sections)
    modules: defineTable({
        courseId: v.id("courses"),
        title: v.string(),
        description: v.optional(v.string()),
        order: v.number(),
        isPublished: v.boolean(),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_course", ["courseId"]),

    // Lessons
    lessons: defineTable({
        moduleId: v.id("modules"),
        courseId: v.id("courses"),
        title: v.string(),
        description: v.optional(v.string()),
        videoUrl: v.optional(v.string()), // YouTube URL
        videoProvider: v.union(v.literal("youtube"), v.literal("bunny"), v.literal("upload")),
        duration: v.number(), // in seconds
        order: v.number(),
        isPublished: v.boolean(),
        isFree: v.boolean(), // Free preview
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_module", ["moduleId"])
        .index("by_course", ["courseId"]),

    // Enrollments
    enrollments: defineTable({
        userId: v.id("users"),
        courseId: v.id("courses"),
        progress: v.number(), // 0-100
        completedLessons: v.array(v.id("lessons")),
        startedAt: v.number(),
        completedAt: v.optional(v.number()),
        lastAccessedAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_course", ["courseId"])
        .index("by_user_course", ["userId", "courseId"]),

    // Lesson Progress
    lessonProgress: defineTable({
        userId: v.id("users"),
        lessonId: v.id("lessons"),
        courseId: v.id("courses"),
        watchedSeconds: v.number(),
        isCompleted: v.boolean(),
        completedAt: v.optional(v.number()),
        lastWatchedAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_lesson", ["lessonId"])
        .index("by_user_lesson", ["userId", "lessonId"]),

    // Certificates
    certificates: defineTable({
        userId: v.id("users"),
        courseId: v.id("courses"),
        code: v.string(), // Unique verification code
        issuedAt: v.number(),
        pdfUrl: v.optional(v.string()),
    })
        .index("by_user", ["userId"])
        .index("by_course", ["courseId"])
        .index("by_code", ["code"]),

    // Achievements/Badges
    achievements: defineTable({
        name: v.string(),
        description: v.string(),
        icon: v.string(),
        type: v.union(
            v.literal("course_complete"),
            v.literal("streak"),
            v.literal("time_spent"),
            v.literal("first_lesson"),
            v.literal("top_student")
        ),
        requirement: v.number(), // e.g., complete 5 courses, 7 day streak
        points: v.number(),
        createdAt: v.number(),
    }),

    // User Achievements
    userAchievements: defineTable({
        userId: v.id("users"),
        achievementId: v.id("achievements"),
        unlockedAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_achievement", ["achievementId"]),

    // Study Streaks
    studyStreaks: defineTable({
        userId: v.id("users"),
        currentStreak: v.number(),
        longestStreak: v.number(),
        lastStudyDate: v.string(), // YYYY-MM-DD format
        updatedAt: v.number(),
    })
        .index("by_user", ["userId"]),

    // Quizzes
    quizzes: defineTable({
        courseId: v.id("courses"),
        lessonId: v.optional(v.id("lessons")),
        title: v.string(),
        description: v.optional(v.string()),
        passingScore: v.number(), // 0-100
        timeLimit: v.optional(v.number()), // in seconds
        maxAttempts: v.optional(v.number()),
        isPublished: v.boolean(),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_course", ["courseId"])
        .index("by_lesson", ["lessonId"]),

    // Quiz Questions
    quizQuestions: defineTable({
        quizId: v.id("quizzes"),
        type: v.union(
            v.literal("multiple_choice"),
            v.literal("true_false"),
            v.literal("short_answer")
        ),
        question: v.string(),
        options: v.optional(v.array(v.string())),
        correctAnswer: v.string(),
        explanation: v.optional(v.string()),
        points: v.number(),
        order: v.number(),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_quiz", ["quizId"]),

    // Quiz Attempts
    quizAttempts: defineTable({
        quizId: v.id("quizzes"),
        userId: v.id("users"),
        score: v.number(), // 0-100
        passed: v.boolean(),
        timeSpent: v.number(), // in seconds
        answers: v.array(v.object({
            questionId: v.id("quizQuestions"),
            userAnswer: v.string(),
            correctAnswer: v.string(),
            isCorrect: v.boolean(),
            points: v.number(),
        })),
        completedAt: v.number(),
    })
        .index("by_quiz", ["quizId"])
        .index("by_user", ["userId"])
        .index("by_quiz_user", ["quizId", "userId"]),

    // Notifications
    notifications: defineTable({
        userId: v.id("users"),
        title: v.string(),
        message: v.string(),
        type: v.union(
            v.literal("info"),
            v.literal("success"),
            v.literal("warning"),
            v.literal("achievement")
        ),
        isRead: v.boolean(),
        link: v.optional(v.string()),
        createdAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_user_unread", ["userId", "isRead"]),
});
