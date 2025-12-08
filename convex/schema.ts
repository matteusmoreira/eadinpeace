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

    // Course Categories (per organization)
    courseCategories: defineTable({
        organizationId: v.id("organizations"),
        name: v.string(),
        description: v.optional(v.string()),
        color: v.optional(v.string()),
        icon: v.optional(v.string()),
        order: v.number(),
        isActive: v.boolean(),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_organization", ["organizationId"]),

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
        // Tipo de aula (opcional para compatibilidade com dados antigos - default: "video")
        type: v.optional(v.union(
            v.literal("video"),
            v.literal("text"),
            v.literal("pdf"),
            v.literal("assignment"),
            v.literal("exam")
        )),
        // Para aulas em vídeo
        videoUrl: v.optional(v.string()),
        videoProvider: v.optional(v.union(v.literal("youtube"), v.literal("bunny"), v.literal("upload"))),
        // Para aulas de texto
        textContent: v.optional(v.string()),
        // Para PDF/arquivos
        fileUrl: v.optional(v.string()),
        fileStorageId: v.optional(v.id("_storage")),
        fileName: v.optional(v.string()),
        // Para trabalhos e provas
        dueDate: v.optional(v.number()),
        maxScore: v.optional(v.number()),
        instructions: v.optional(v.string()),
        // Comum
        duration: v.number(), // in seconds (estimado para texto/pdf)
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
        // Novos campos Masteriyo
        randomizeQuestions: v.optional(v.boolean()),
        randomizeOptions: v.optional(v.boolean()),
        revealMode: v.optional(v.boolean()), // Mostrar respostas após 1 tentativa
        allowStudentFeedback: v.optional(v.boolean()),
        weight: v.optional(v.number()), // Peso para nota final do curso (0-100)
        isPublished: v.boolean(),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_course", ["courseId"])
        .index("by_lesson", ["lessonId"]),

    // Quiz Questions
    quizQuestions: defineTable({
        quizId: v.id("quizzes"),
        questionBankId: v.optional(v.id("questionBank")), // Link para banco de questões
        type: v.union(
            v.literal("true_false"),
            v.literal("single_choice"),
            v.literal("multiple_choice"), // Múltiplas respostas corretas
            v.literal("short_answer"),
            v.literal("text_answer"), // Dissertativa
            v.literal("match_following"), // Associar/Corresponder
            v.literal("sortable"), // Ordenar itens
            v.literal("fill_blanks"), // Preencher lacunas
            v.literal("audio_video") // Questões com mídia
        ),
        question: v.string(),
        // Para single_choice e multiple_choice
        options: v.optional(v.array(v.string())),
        correctAnswer: v.optional(v.string()), // Para single_choice, true_false, short_answer
        correctAnswers: v.optional(v.array(v.string())), // Para multiple_choice
        // Para match_following
        matchPairs: v.optional(v.array(v.object({
            prompt: v.string(),
            promptImage: v.optional(v.string()),
            answer: v.string(),
            answerImage: v.optional(v.string()),
        }))),
        // Para sortable
        correctOrder: v.optional(v.array(v.string())),
        // Para fill_blanks
        blankPositions: v.optional(v.array(v.number())),
        blankAnswers: v.optional(v.array(v.string())),
        // Para audio_video
        mediaUrl: v.optional(v.string()),
        mediaType: v.optional(v.union(v.literal("audio"), v.literal("video"))),
        // Comum
        explanation: v.optional(v.string()),
        points: v.number(),
        order: v.number(),
        requiresManualGrading: v.optional(v.boolean()), // text_answer requer correção manual
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_quiz", ["quizId"])
        .index("by_question_bank", ["questionBankId"]),

    // Quiz Attempts
    quizAttempts: defineTable({
        quizId: v.id("quizzes"),
        userId: v.id("users"),
        score: v.number(), // 0-100
        automaticScore: v.optional(v.number()), // Pontos das questões auto-corrigidas
        manualScore: v.optional(v.number()), // Pontos das questões manuais
        passed: v.boolean(),
        timeSpent: v.number(), // in seconds
        answers: v.array(v.object({
            questionId: v.id("quizQuestions"),
            // Respostas para diferentes tipos
            userAnswer: v.optional(v.string()), // single_choice, true_false, short_answer, text_answer
            userAnswers: v.optional(v.array(v.string())), // multiple_choice
            userMatches: v.optional(v.array(v.object({ // match_following
                prompt: v.string(),
                answer: v.string(),
            }))),
            userOrder: v.optional(v.array(v.string())), // sortable
            userBlanks: v.optional(v.array(v.string())), // fill_blanks
            // Correção
            correctAnswer: v.optional(v.string()),
            correctAnswers: v.optional(v.array(v.string())),
            isCorrect: v.boolean(),
            points: v.number(),
            manualPoints: v.optional(v.number()), // Pontos atribuídos pelo professor
            instructorFeedback: v.optional(v.string()), // Feedback do professor na questão
        })),
        // Status de correção
        gradingStatus: v.optional(v.union(
            v.literal("auto_graded"), // Todas questões automáticas
            v.literal("pending"), // Aguardando correção manual
            v.literal("grading"), // Professor está corrigindo
            v.literal("graded") // Totalmente corrigida
        )),
        gradedBy: v.optional(v.id("users")),
        gradedAt: v.optional(v.number()),
        instructorComments: v.optional(v.string()), // Comentários gerais do professor
        // Feedback do aluno sobre a prova
        studentFeedback: v.optional(v.string()),
        studentRating: v.optional(v.number()), // 1-5 estrelas
        completedAt: v.number(),
    })
        .index("by_quiz", ["quizId"])
        .index("by_user", ["userId"])
        .index("by_quiz_user", ["quizId", "userId"])
        .index("by_grading_status", ["gradingStatus"]),



    // Comments (Módulo 13: Comunicação)
    comments: defineTable({
        lessonId: v.id("lessons"),
        userId: v.id("users"),
        content: v.string(),
        parentId: v.optional(v.id("comments")), // Para respostas
        isResolved: v.boolean(), // Marcado como resolvido pelo professor
        isPinned: v.boolean(), // Fixado no topo
        likes: v.number(),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_lesson", ["lessonId"])
        .index("by_user", ["userId"])
        .index("by_parent", ["parentId"]),

    // Subscription Plans (Módulo 15: Pagamentos)
    subscriptionPlans: defineTable({
        name: v.string(),
        description: v.string(),
        price: v.number(), // Em centavos
        interval: v.union(v.literal("monthly"), v.literal("yearly")),
        maxUsers: v.number(),
        maxCourses: v.number(),
        features: v.array(v.string()),
        isActive: v.boolean(),
        createdAt: v.number(),
        updatedAt: v.number(),
    }),

    // Subscriptions
    subscriptions: defineTable({
        organizationId: v.id("organizations"),
        planId: v.id("subscriptionPlans"),
        status: v.union(
            v.literal("active"),
            v.literal("canceled"),
            v.literal("past_due"),
            v.literal("trialing")
        ),
        currentPeriodStart: v.number(),
        currentPeriodEnd: v.number(),
        cancelAtPeriodEnd: v.boolean(),
        stripeSubscriptionId: v.optional(v.union(v.string(), v.null())),
        stripeCustomerId: v.optional(v.union(v.string(), v.null())),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_organization", ["organizationId"])
        .index("by_status", ["status"]),

    // Transactions
    transactions: defineTable({
        organizationId: v.id("organizations"),
        subscriptionId: v.optional(v.id("subscriptions")),
        amount: v.number(), // Em centavos
        currency: v.string(),
        type: v.union(v.literal("payment"), v.literal("refund")),
        status: v.union(
            v.literal("pending"),
            v.literal("completed"),
            v.literal("failed")
        ),
        description: v.string(),
        stripePaymentIntentId: v.optional(v.string()),
        createdAt: v.number(),
    })
        .index("by_organization", ["organizationId"])
        .index("by_subscription", ["subscriptionId"])
        .index("by_status", ["status"]),

    // ================================
    // NEW FEATURES: Comments, Attachments, Notifications
    // ================================

    // Lesson Comments (Q&A System)
    lessonComments: defineTable({
        lessonId: v.id("lessons"),
        userId: v.id("users"),
        parentId: v.optional(v.id("lessonComments")), // For replies
        content: v.string(),
        isResolved: v.boolean(),
        isPinned: v.boolean(),
        likesCount: v.number(),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_lesson", ["lessonId"])
        .index("by_user", ["userId"])
        .index("by_parent", ["parentId"]),

    // Comment Likes
    commentLikes: defineTable({
        commentId: v.id("lessonComments"),
        userId: v.id("users"),
        createdAt: v.number(),
    })
        .index("by_comment", ["commentId"])
        .index("by_user", ["userId"]),

    // Lesson Attachments/Materials
    lessonAttachments: defineTable({
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
        url: v.string(), // Storage URL or external URL
        storageId: v.optional(v.id("_storage")), // Convex file storage
        size: v.number(), // in bytes
        downloadCount: v.number(),
        createdAt: v.number(),
    })
        .index("by_lesson", ["lessonId"]),

    // Notifications
    notifications: defineTable({
        userId: v.id("users"),
        type: v.union(
            v.literal("course_update"),
            v.literal("new_lesson"),
            v.literal("comment_reply"),
            v.literal("certificate_ready"),
            v.literal("quiz_result"),
            v.literal("enrollment_confirmed"),
            v.literal("announcement"),
            v.literal("reminder"),
            v.literal("achievement")
        ),
        title: v.string(),
        message: v.string(),
        link: v.optional(v.string()), // URL to navigate
        isRead: v.boolean(),
        metadata: v.optional(v.any()), // Additional data (courseId, lessonId, etc)
        createdAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_user_read", ["userId", "isRead"])
        .index("by_type", ["type"]),

    // Announcements (Organization-wide)
    announcements: defineTable({
        organizationId: v.id("organizations"),
        authorId: v.id("users"),
        title: v.string(),
        content: v.string(),
        priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
        targetRoles: v.array(v.string()), // ["student", "professor"] or ["all"]
        isPublished: v.boolean(),
        expiresAt: v.optional(v.number()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_organization", ["organizationId"])
        .index("by_author", ["authorId"]),

    // ================================
    // LEADERBOARD & FORUM
    // ================================

    // User Points (for leaderboard)
    userPoints: defineTable({
        userId: v.id("users"),
        organizationId: v.id("organizations"),
        totalPoints: v.number(),
        coursesCompleted: v.number(),
        lessonsCompleted: v.number(),
        quizzesPassed: v.number(),
        certificatesEarned: v.number(),
        currentStreak: v.number(),
        longestStreak: v.number(),
        lastActivityAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_organization", ["organizationId"])
        .index("by_organization_points", ["organizationId", "totalPoints"]),

    // Point Transactions (history)
    pointTransactions: defineTable({
        userId: v.id("users"),
        points: v.number(), // Can be positive or negative
        type: v.union(
            v.literal("lesson_complete"),
            v.literal("course_complete"),
            v.literal("quiz_pass"),
            v.literal("certificate_earned"),
            v.literal("streak_bonus"),
            v.literal("forum_participation"),
            v.literal("helpful_answer"),
            v.literal("admin_adjustment")
        ),
        description: v.string(),
        metadata: v.optional(v.any()),
        createdAt: v.number(),
    })
        .index("by_user", ["userId"]),

    // Forum Categories
    forumCategories: defineTable({
        organizationId: v.id("organizations"),
        name: v.string(),
        description: v.string(),
        icon: v.optional(v.string()),
        order: v.number(),
        isActive: v.boolean(),
        createdAt: v.number(),
    })
        .index("by_organization", ["organizationId"]),

    // Forum Topics (Threads)
    forumTopics: defineTable({
        categoryId: v.id("forumCategories"),
        organizationId: v.id("organizations"),
        authorId: v.id("users"),
        title: v.string(),
        content: v.string(),
        isPinned: v.boolean(),
        isLocked: v.boolean(),
        isSolved: v.boolean(),
        viewCount: v.number(),
        replyCount: v.number(),
        lastReplyAt: v.optional(v.number()),
        lastReplyBy: v.optional(v.id("users")),
        tags: v.array(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_category", ["categoryId"])
        .index("by_organization", ["organizationId"])
        .index("by_author", ["authorId"]),

    // Forum Replies
    forumReplies: defineTable({
        topicId: v.id("forumTopics"),
        authorId: v.id("users"),
        content: v.string(),
        isAcceptedAnswer: v.boolean(),
        likesCount: v.number(),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_topic", ["topicId"])
        .index("by_author", ["authorId"]),

    // Forum Reply Likes
    forumReplyLikes: defineTable({
        replyId: v.id("forumReplies"),
        userId: v.id("users"),
        createdAt: v.number(),
    })
        .index("by_reply", ["replyId"])
        .index("by_user", ["userId"]),

    // Organization Settings (Video providers, integrations, etc.)
    organizationSettings: defineTable({
        organizationId: v.id("organizations"),
        // Bunny Stream Settings
        bunnyApiKey: v.optional(v.string()),
        bunnyLibraryId: v.optional(v.string()),
        bunnyCdnHostname: v.optional(v.string()),
        bunnyEnabled: v.optional(v.boolean()),
        // Other video provider settings can be added here
        // YouTube API settings
        youtubeApiKey: v.optional(v.string()),
        // General settings
        defaultVideoProvider: v.optional(v.union(
            v.literal("youtube"),
            v.literal("bunny"),
            v.literal("upload")
        )),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_organization", ["organizationId"]),

    // ================================
    // QUIZ ENHANCEMENTS - Masteriyo Features
    // ================================

    // Question Bank (Banco de Questões reutilizáveis)
    questionBank: defineTable({
        organizationId: v.id("organizations"),
        createdBy: v.id("users"),
        type: v.union(
            v.literal("true_false"),
            v.literal("single_choice"),
            v.literal("multiple_choice"),
            v.literal("short_answer"),
            v.literal("text_answer"),
            v.literal("match_following"),
            v.literal("sortable"),
            v.literal("fill_blanks"),
            v.literal("audio_video")
        ),
        question: v.string(),
        // Para single_choice e multiple_choice
        options: v.optional(v.array(v.string())),
        correctAnswer: v.optional(v.string()),
        correctAnswers: v.optional(v.array(v.string())), // Para multiple_choice
        // Para match_following
        matchPairs: v.optional(v.array(v.object({
            prompt: v.string(),
            promptImage: v.optional(v.string()),
            answer: v.string(),
            answerImage: v.optional(v.string()),
        }))),
        // Para sortable
        correctOrder: v.optional(v.array(v.string())),
        // Para fill_blanks
        blankPositions: v.optional(v.array(v.number())),
        blankAnswers: v.optional(v.array(v.string())),
        // Para audio_video
        mediaUrl: v.optional(v.string()),
        mediaType: v.optional(v.union(v.literal("audio"), v.literal("video"))),
        // Comum
        explanation: v.optional(v.string()),
        defaultPoints: v.number(),
        tags: v.array(v.string()), // Para filtrar/categorizar
        difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
        usageCount: v.number(), // Quantas vezes foi usada
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_organization", ["organizationId"])
        .index("by_type", ["type"])
        .index("by_difficulty", ["difficulty"])
        .index("by_created_by", ["createdBy"]),

    // Grading Rubrics (Rubricas de Avaliação)
    gradingRubrics: defineTable({
        organizationId: v.id("organizations"),
        name: v.string(),
        description: v.string(),
        isDefault: v.boolean(),
        criteria: v.array(v.object({
            name: v.string(),
            description: v.string(),
            maxPoints: v.number(),
            levels: v.array(v.object({
                label: v.string(), // "Excelente", "Bom", "Regular", "Insuficiente"
                points: v.number(),
                description: v.string(),
            })),
        })),
        createdBy: v.id("users"),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_organization", ["organizationId"])
        .index("by_default", ["isDefault"]),

    // Course Grades (Notas do Curso com pesos)
    courseGrades: defineTable({
        userId: v.id("users"),
        courseId: v.id("courses"),
        quizScores: v.array(v.object({
            quizId: v.id("quizzes"),
            score: v.number(),
            weight: v.number(),
            weightedScore: v.number(),
        })),
        assignmentScores: v.array(v.object({
            lessonId: v.id("lessons"), // Assignments
            score: v.number(),
            weight: v.number(),
            weightedScore: v.number(),
        })),
        finalGrade: v.number(), // 0-100
        letterGrade: v.optional(v.string()), // A, B, C, D, F
        updatedAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_course", ["courseId"])
        .index("by_user_course", ["userId", "courseId"]),

    // ================================
    // SOCIAL NETWORK FEATURES
    // ================================

    // Posts do Feed Social
    socialPosts: defineTable({
        authorId: v.id("users"),
        organizationId: v.id("organizations"),
        content: v.string(),
        imageUrl: v.optional(v.string()),
        imageStorageId: v.optional(v.id("_storage")),
        videoUrl: v.optional(v.string()), // URL de vídeo (YouTube, Vimeo, etc)
        likesCount: v.number(),
        commentsCount: v.number(),
        sharesCount: v.number(),
        // Privacidade do post
        visibility: v.union(
            v.literal("public"),      // Todos da organização podem ver
            v.literal("followers"),   // Apenas seguidores podem ver
            v.literal("private")      // Apenas o autor pode ver
        ),
        // Compartilhamento
        isShared: v.boolean(),
        originalPostId: v.optional(v.id("socialPosts")),
        shareComment: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_author", ["authorId"])
        .index("by_organization", ["organizationId"])
        .index("by_created", ["organizationId", "createdAt"])
        .index("by_visibility", ["organizationId", "visibility"]),

    // Curtidas em Posts
    postLikes: defineTable({
        postId: v.id("socialPosts"),
        userId: v.id("users"),
        createdAt: v.number(),
    })
        .index("by_post", ["postId"])
        .index("by_user", ["userId"])
        .index("by_post_user", ["postId", "userId"]),

    // Comentários em Posts
    postComments: defineTable({
        postId: v.id("socialPosts"),
        authorId: v.id("users"),
        content: v.string(),
        parentId: v.optional(v.id("postComments")),
        likesCount: v.number(),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_post", ["postId"])
        .index("by_author", ["authorId"])
        .index("by_parent", ["parentId"]),

    // Curtidas em Comentários
    commentLikesOnPosts: defineTable({
        commentId: v.id("postComments"),
        userId: v.id("users"),
        createdAt: v.number(),
    })
        .index("by_comment", ["commentId"])
        .index("by_user", ["userId"])
        .index("by_comment_user", ["commentId", "userId"]),

    // Sistema de Seguidores
    userFollows: defineTable({
        followerId: v.id("users"),
        followingId: v.id("users"),
        createdAt: v.number(),
    })
        .index("by_follower", ["followerId"])
        .index("by_following", ["followingId"])
        .index("by_pair", ["followerId", "followingId"]),

    // Conversas Privadas
    conversations: defineTable({
        organizationId: v.id("organizations"),
        participantIds: v.array(v.id("users")),
        lastMessageAt: v.number(),
        lastMessagePreview: v.optional(v.string()),
        lastMessageSenderId: v.optional(v.id("users")),
        createdAt: v.number(),
    })
        .index("by_organization", ["organizationId"])
        .index("by_last_message", ["lastMessageAt"]),

    // Mensagens Diretas
    directMessages: defineTable({
        conversationId: v.id("conversations"),
        senderId: v.id("users"),
        content: v.string(),
        isRead: v.boolean(),
        readAt: v.optional(v.number()),
        createdAt: v.number(),
    })
        .index("by_conversation", ["conversationId"])
        .index("by_sender", ["senderId"])
        .index("by_conversation_created", ["conversationId", "createdAt"]),
});
