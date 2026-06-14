import { pgTable, text, timestamp, boolean, integer, real, index } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username"),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  avatar: text("avatar"),
  learningStyle: text("learning_style").default("visual"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
}, (table) => [index("session_userId_idx").on(table.userId)]);

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => [index("account_userId_idx").on(table.userId)]);

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => [index("verification_identifier_idx").on(table.identifier)]);

export const documents = pgTable("documents", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  rawText: text("raw_text").notNull(),
  summary: text("summary"),
  subject: text("subject"),
  totalNodes: integer("total_nodes").default(0),
  masteryScore: real("mastery_score").default(0),
  status: text("status").default("pending"),
  sourceType: text("source_type").default("pdf").notNull(),
  sourceUrl: text("source_url"),
  transcriptText: text("transcript_text"),
  isPublic: boolean("is_public").default(false),
  communityId: text("community_id"), // Will add reference below
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conceptNodes = pgTable("concept_nodes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  documentId: text("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  label: text("label").notNull(),
  explanation: text("explanation").notNull(),
  importance: integer("importance").default(5),
  positionX: real("position_x").notNull(),
  positionY: real("position_y").notNull(),
  positionZ: real("position_z").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conceptEdges = pgTable("concept_edges", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  documentId: text("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  sourceNodeId: text("source_node_id").references(() => conceptNodes.id, { onDelete: "cascade" }).notNull(),
  targetNodeId: text("target_node_id").references(() => conceptNodes.id, { onDelete: "cascade" }).notNull(),
  relationshipLabel: text("relationship_label"),
  strength: real("strength").default(1.0),
});

export const topicNodes = pgTable("topic_nodes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  documentId: text("document_id")
    .references(() => documents.id, { onDelete: "cascade" })
    .notNull(),
  label: text("label").notNull(),
  type: text("type").notNull(),
  explanation: text("explanation").notNull(),
  importance: integer("importance").default(5),
  depth: integer("depth").default(0),
  parentId: text("parent_id"),
  positionX: real("position_x").notNull(),
  positionY: real("position_y").notNull(),
  positionZ: real("position_z").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const topicEdges = pgTable("topic_edges", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  documentId: text("document_id")
    .references(() => documents.id, { onDelete: "cascade" })
    .notNull(),
  sourceNodeId: text("source_node_id")
    .references(() => topicNodes.id, { onDelete: "cascade" })
    .notNull(),
  targetNodeId: text("target_node_id")
    .references(() => topicNodes.id, { onDelete: "cascade" })
    .notNull(),
  label: text("label"),
  edgeType: text("edge_type").default("contains"),
});

export const flashcards = pgTable("flashcards", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  nodeId: text("node_id").references(() => conceptNodes.id, { onDelete: "cascade" }).notNull(),
  documentId: text("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  difficulty: integer("difficulty").default(3),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userProgress = pgTable("user_progress", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  nodeId: text("node_id").references(() => conceptNodes.id, { onDelete: "cascade" }).notNull(),
  documentId: text("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  visitCount: integer("visit_count").default(0),
  timeSpentSeconds: integer("time_spent_seconds").default(0),
  memoryStrength: real("memory_strength").default(0.5),
  interval: integer("interval").default(1),
  easeFactor: real("ease_factor").default(2.5),
  repetitions: integer("repetitions").default(0),
  lastReviewedAt: timestamp("last_reviewed_at"),
  correctAnswers: integer("correct_answers").default(0),
  totalAttempts: integer("total_attempts").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const quizSessions = pgTable("quiz_sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  documentId: text("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  score: integer("score").default(0),
  totalQuestions: integer("total_questions").default(0),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ENHANCED EXTENSIONS

export const studySessions = pgTable("study_sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  documentId: text("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  hostUserId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  sessionCode: text("session_code").notNull().unique(),
  isActive: boolean("is_active").default(true),
  participantCount: integer("participant_count").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

export const atlasHistory = pgTable("atlas_history", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  documentId: text("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  userMessage: text("user_message").notNull(),
  atlasResponse: text("atlas_response").notNull(),
  actionTaken: text("action_taken"),
  createdAt: timestamp("created_at").defaultNow(),
});

// SOCIAL LAYER EXTENSIONS

export const communities = pgTable("communities", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  subject: text("subject"),
  memberCount: integer("member_count").default(0),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communityMembers = pgTable("community_members", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  communityId: text("community_id").references(() => communities.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  role: text("role").default("member"), // member | moderator | admin
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const posts = pgTable("posts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  communityId: text("community_id").references(() => communities.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  documentId: text("document_id").references(() => documents.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  body: text("body"),
  type: text("type").default("universe"), // universe | text | flashcard_set
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  commentCount: integer("comment_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const votes = pgTable("votes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  postId: text("post_id").references(() => posts.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  value: integer("value").notNull(), // 1 or -1
});

export const comments = pgTable("comments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  postId: text("post_id").references(() => posts.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  nodeId: text("node_id").references(() => conceptNodes.id, { onDelete: "set null" }),
  body: text("body").notNull(),
  upvotes: integer("upvotes").default(0),
  parentId: text("parent_id"), // for nested replies
  createdAt: timestamp("created_at").defaultNow(),
});

export const follows = pgTable("follows", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  followerId: text("follower_id").references(() => users.id, { onDelete: "cascade" }),
  followingId: text("following_id").references(() => users.id, { onDelete: "set null" }),
  communityId: text("community_id").references(() => communities.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// GEMINI CACHE — eliminates duplicate API calls (24h TTL)
export const geminiCache = pgTable("gemini_cache", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  promptHash: text("prompt_hash").notNull(),
  response: text("response").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("gemini_cache_hash_idx").on(table.promptHash)]);

