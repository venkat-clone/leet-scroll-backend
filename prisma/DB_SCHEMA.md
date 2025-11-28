# Database Schema Documentation

This document describes the database architecture for the **LeetScroll** platform. It focuses on **why** each model exists, what features it enables, and how models relate to each other.

---

## Core Models & Features

### 👤 **User**
**Purpose**: Central entity representing platform users.

**Key Features Enabled**:
- Authentication & authorization (email/password, role-based access)
- Score tracking for gamification
- Dual streak systems:
  - **Daily Activity Streak**: Encourages consistent platform engagement
  - **Correct Answer Streak**: Rewards learning momentum
- Personal profile and statistics

**Relationships**:
- One-to-many: submissions, likes, comments, bookmarks, reports, notifications
- One-to-one: preferences (optional, created on first customization)

---

### 📝 **Question**
**Purpose**: Stores coding challenges and interview questions.

**Key Features Enabled**:
- Multiple-choice questions with JSON-based options
- Rich content (description, code snippets, explanations)
- Difficulty levels for progressive learning
- Categorization via `category` field and many-to-many `topics`
- Flexible tagging system for searchability

**Relationships**:
- One-to-many: submissions, likes, comments, bookmarks, reports
- Many-to-many: topics (enables topic-based filtering)

**Why JSON for options?**: Allows flexible option structures (text, code blocks, images) without schema changes.

---

### ✅ **Submission**
**Purpose**: Records every user answer attempt.

**Key Features Enabled**:
- Progress tracking (questions attempted, success rate)
- Leaderboard calculations
- Streak computation (daily and correct answer streaks)
- Historical performance analysis

**Relationships**:
- Many-to-one: user, question

**Scaling Note**: This table grows fastest. Consider time-based partitioning (monthly) for performance.

---

### ❤️ **Like**
**Purpose**: Tracks user engagement with questions.

**Key Features Enabled**:
- Question popularity metrics
- User feed personalization (promote liked topics)
- Social proof for question quality

**Relationships**:
- Many-to-one: user, question
- Composite unique index on `(userId, questionId)` prevents duplicate likes

---

### 💬 **Comment**
**Purpose**: Enables discussion and knowledge sharing.

**Key Features Enabled**:
- Community-driven explanations
- Doubt resolution
- Alternative solution discussions
- Notification triggers (when question author gets comments)

**Relationships**:
- Many-to-one: user, question

**Future Enhancement**: Add nested replies (self-referential `parentId`)

---

### 🔖 **Bookmark**
**Purpose**: Allows users to save questions for later review.

**Key Features Enabled**:
- "Save for later" functionality
- Custom study lists
- Quick access to frequently reviewed questions

**Relationships**:
- Many-to-one: user, question
- Indexed by `userId` for fast "my bookmarks" queries

---

### 🏷️ **Topic**
**Purpose**: Organizes questions into learning domains.

**Key Features Enabled**:
- Topic-based filtering and navigation
- Progress tracking by topic (e.g., "80% complete in Dynamic Programming")
- Personalized recommendations based on user's preferred topics
- Topic difficulty progression

**Relationships**:
- Many-to-many: questions (a question can belong to multiple topics)
- Many-to-many: userPreferences (users select multiple preferred topics)

**Why separate from tags?**: Topics are structured, curated categories (e.g., "Arrays", "Graphs"). Tags are flexible, user-generated metadata.

---

### ⚙️ **UserPreference**
**Purpose**: Stores user customization settings.

**Key Features Enabled**:
- Theme selection (light/dark/system)
- Default code language for snippets
- **Preferred Topics**: Many-to-many relation enabling:
  - Personalized question feed
  - Smart filtering shortcuts
  - Topic-based notifications

**Relationships**:
- One-to-one: user (created lazily on first preference change)
- Many-to-many: topics (user can select multiple interests)

**Why optional?**: Not all users customize; saves DB space for defaults.

---

### 🚨 **Report**
**Purpose**: Quality control through user-submitted issue reports.

**Key Features Enabled**:
- Report incorrect answers
- Flag typos or unclear explanations
- Suggest question improvements
- Admin review workflow (PENDING → REVIEWED → RESOLVED/DISMISSED)

**Relationships**:
- Many-to-one: user (reporter), question

**Scaling Note**: Index by `status` for admin dashboard queries.

---

### 🔔 **Notification**
**Purpose**: Real-time user engagement and updates.

**Key Features Enabled**:
- **Engagement Notifications**: Likes, comments on user activity
- **Streak Alerts**: "You're on a 7-day streak!"
- **Content Updates**: New questions in preferred topics
- **Achievements**: Milestones (100 correct answers, etc.)
- **Admin Messages**: Report status updates, system announcements

**Relationships**:
- Many-to-one: user
- Indexed by `(userId, isRead)` for "unread notifications" query
- Indexed by `createdAt` for chronological feed

**Types**:
- `LIKE`, `COMMENT`: Social engagement
- `STREAK_MILESTONE`: Gamification
- `NEW_QUESTION`: Content discovery
- `REPORT_UPDATE`: Admin communication
- `ACHIEVEMENT`: User milestones
- `SYSTEM`: Platform-wide announcements

**Why `actionUrl`?**: Enables deep-linking (e.g., notification → specific question)

---

## Enums

### **Role**
- `USER`: Standard access
- `ADMIN`: Content management, user moderation, report handling

### **Difficulty**
- `EASY`, `MEDIUM`, `HARD`: Progressive challenge levels

### **ReportStatus**
- `PENDING`: Awaiting admin review
- `REVIEWED`: Admin has seen it
- `RESOLVED`: Issue fixed
- `DISMISSED`: Not actionable

### **NotificationType**
- See Notification model above for type-specific use cases

---

## Scaling Architecture

### Indexes
| Model | Index | Purpose |
|-------|-------|---------|
| Like, Bookmark | `@@unique([userId, questionId])` | Prevent duplicates, fast lookups |
| Submission | `(userId)`, `(questionId)` | User history, question analytics |
| Notification | `(userId, isRead)` | Unread count queries |
| Notification | `(createdAt)` | Chronological feed pagination |

### Connection Pooling
- Use **PgBouncer** or **Neon Serverless Pooling**
- Critical for Next.js serverless functions (many concurrent connections)

### Read Replicas
- Route read-heavy queries to replicas:
  - Question lists
  - Leaderboards
  - User profiles (views)
- Write to primary: submissions, likes, comments

### Partitioning Strategy
- **Submission** table: Partition by `createdAt` (monthly)
  - Keeps recent data fast
  - Older partitions can be archived to cold storage
- **Notification** table: Auto-delete after 90 days (or partition + archive)

### Caching Layers
| Data Type | Cache Strategy |
|-----------|----------------|
| Question lists | Redis (TTL: 5 min) |
| Leaderboard top 100 | Redis (TTL: 1 min) |
| User streak data | Redis (update on each submission) |
| Topic metadata | CDN edge cache |

### Future Sharding
- Shard by `userId` if single DB exceeds capacity
- Use consistent hashing for shard assignment
- Keep cross-shard queries minimal (avoid joins across shards)

---

## Feature-to-Model Mapping

| Feature | Models Involved | How They Work Together |
|---------|----------------|------------------------|
| **Daily Streak** | User, Submission | Submission triggers update User.dailyStreakCount if daily |
| **Personalized Feed** | User, UserPreference, Topic, Question | UserPreference.preferredTopics → filter Questions |
| **Leaderboard** | User, Submission | Aggregate Submission.isCorrect → User.score |
| **Notifications** | User, Notification, Like, Comment, Submission | Likes/Comments create Notifications for question owner; Submissions trigger streak milestones |
| **Topic Progress** | User, Topic, Question, Submission | Count Submissions per Topic where isCorrect=true |
| **Quality Control** | Question, Report, User | Users Report issues → Admins review → Question updated |

---

## Data Consistency Rules

1. **Streak Updates**: Atomic with Submission creation (transaction)
2. **Score Calculation**: Real-time update on correct submission
3. **Notification Creation**: Async (use job queue for scale)
4. **Bookmark/Like Uniqueness**: Database-enforced via `@@unique` constraint
5. **Soft Deletes**: None currently; add `deletedAt` if GDPR compliance needed

---

## Migration Best Practices

1. **Version Control**: Keep `schema.prisma` and this doc in sync
2. **Deployment**: Always run `prisma migrate deploy` before app deployment
3. **Rollback Plan**: Test migrations on staging; keep backups before production
4. **Zero Downtime**: Use `ADD COLUMN` with defaults; avoid `DROP COLUMN` on live tables

Keep this document updated with every schema change. It's the **source of truth** for understanding the data model.
