/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as attachments from "../attachments.js";
import type * as categories from "../categories.js";
import type * as certificates from "../certificates.js";
import type * as comments from "../comments.js";
import type * as courses from "../courses.js";
import type * as enrollments from "../enrollments.js";
import type * as files from "../files.js";
import type * as forum from "../forum.js";
import type * as gamification from "../gamification.js";
import type * as leaderboard from "../leaderboard.js";
import type * as notifications from "../notifications.js";
import type * as organizations from "../organizations.js";
import type * as payments from "../payments.js";
import type * as quizzes from "../quizzes.js";
import type * as reports from "../reports.js";
import type * as search from "../search.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  attachments: typeof attachments;
  categories: typeof categories;
  certificates: typeof certificates;
  comments: typeof comments;
  courses: typeof courses;
  enrollments: typeof enrollments;
  files: typeof files;
  forum: typeof forum;
  gamification: typeof gamification;
  leaderboard: typeof leaderboard;
  notifications: typeof notifications;
  organizations: typeof organizations;
  payments: typeof payments;
  quizzes: typeof quizzes;
  reports: typeof reports;
  search: typeof search;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
