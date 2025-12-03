# StudentDrive - Educational Resource Platform

### Overview
StudentDrive is a comprehensive educational resource management platform designed to connect students and institutions, facilitating learning through various content types like course materials, quizzes, and personalized learning paths. It aims to provide a robust environment for educational content delivery and management. The platform also features a Multi-Tenant School Management System (SMS) for individual schools to manage academic operations with subdomain-based isolation, offering customizable branding and isolated data for each school.

### User Preferences
I prefer iterative development and welcome questions for clarification. Please ensure detailed explanations for complex changes. Do not make changes to the `shared/` folder unless absolutely necessary and after explicit confirmation.

### System Architecture
The project employs a full-stack architecture. The frontend uses React, TypeScript, Vite, and TailwindCSS, with Radix UI for components. The backend is built with Express.js and TypeScript. A PostgreSQL database, managed by Drizzle ORM, serves as the data store. Authentication is handled by Passport.js, and Multer manages file uploads. The application serves both API and frontend from a single Express server.

**Multi-Tenant School Management System (SMS):**
- **Core Tables:** `schools`, `school_users`, `parent_student_links`, `subscription_plans`.
- **Academic Structure:** `academic_terms`, `school_classes`, `school_subjects`, `class_subjects`, `teacher_assignments`, `class_enrollments`.
- **Attendance System:** `attendance_records` for daily, subject-wise, and term-based tracking, with a marking UI and reports.
- **Grades & Assessments:** `assessment_types`, `student_grades`, `term_results` including calculated grades and positions.
- **Fees & Payments:** `fee_types`, `class_fees`, `fee_payments` with Paystack integration for payment processing, verification, webhooks, and a parent payment portal.
- **Timetable System:** `timetable_periods`, `timetable_entries` with conflict detection, and dedicated views for teachers and students.
- **Announcements System:** `school_announcements` with class-targeting and role-based visibility, and `school_notifications` for in-app alerts.
- **School Settings:** UI for general info, branding (logo, colors), and integrations (public platform access).
- **Email Notification System:** School-specific templates for alerts and reminders.
- **Parent-Teacher Messaging:** Conversation thread UI with real-time display.
- **Enhanced Analytics Dashboard:** Period-based filtering for enrollment, attendance, fees, and grades.
- **Super Admin Features:**
    - **Live Activity Feed:** `platform_activity_feed` for real-time monitoring of user and school activities.
    - **Impersonation System:** Allows super admins to impersonate school admins for troubleshooting, with logging in `impersonation_logs` and an active banner.
    - **Impersonation Logs Page:** Audit trail of all impersonation sessions.
    - **School Users View:** Manage users within a specific school with role-based filtering and impersonation capabilities.

**UI/UX Decisions:**
- Clean, professional design with card-based sections and clear visual hierarchy.
- Interactive elements like checkbox-based selections and real-time previews.
- Efficient administrative experience with search, filter, and bulk actions for user management.

**Technical Implementations & Features:**
- **User Management:** Role-based access (Student, Institution, Admin, Parent, Teacher, School Student, Super Admin) with email verification, comprehensive admin dashboards, and bulk user actions.
- **Content Management:** Course, material, and quiz management.
- **Institution Review System:** Public directory, star ratings, verified reviews, and slug generation.
- **Data Tracking:** Extensive user statistics and activity logging.
- **Security:** Admin-only API endpoints, authorization checks, and secure session management with PostgreSQL session storage.

**System Design Choices:**
- Monorepo structure for client, server, and shared code.
- Logically grouped API routes.
- Dedicated `uploads/` directory for file storage.

**Navigation Access Control:**
- Role-based navigation (`student`, `institution`, `admin`, `parent`, `teacher`, `school_student`, `super_admin`) with exclusive menu configurations and access control rules.

### Role Relationship Matrix (December 2025)

**Two Authentication Contexts:**
1. **Platform Authentication** (`users` table) - Main platform roles
2. **School Context Authentication** (`school_users` table) - School-specific roles

**Platform Roles (users table):**
| Role | Description | Primary Access |
|------|-------------|----------------|
| `student` | Individual learner | LMS resources, quizzes, library, performance |
| `institution` | School admin | Full school management (SMS features) |
| `admin` | Platform admin | User/content moderation |
| `super_admin` | Super administrator | Platform oversight, impersonation, analytics |

**School Context Roles (school_users table):**
| Role | Description | Access Within School |
|------|-------------|---------------------|
| `school_admin` | School administrator | Full school management |
| `teacher` | Teacher | Attendance, grades, schedule, messaging |
| `parent` | Parent of students | View grades, fees, messaging with teachers |
| `school_student` | School student | Timetable, grades, announcements |

**Role Hierarchy & Dependencies:**
```
super_admin
    └── Platform oversight (all schools, all users)
    
admin
    └── Platform content/user management (no SMS access)
    
institution (maps to school_admin in school context)
    ├── teacher (depends on institution for school data)
    ├── parent (depends on institution for child data)
    └── school_student (depends on institution for enrollment)
    
student
    └── Independent LMS learner (no school context)
```

**Feature Accessibility by Role:**
| Feature | student | institution | admin | super_admin | teacher | parent | school_student |
|---------|---------|-------------|-------|-------------|---------|--------|----------------|
| LMS Resources | ✓ | - | - | - | - | - | - |
| Quizzes | ✓ | - | - | - | - | - | - |
| School Dashboard | - | ✓ | - | ✓ | ✓ | ✓ | ✓ |
| Attendance | - | ✓ | - | - | ✓ | View | View |
| Grades | - | ✓ | - | - | ✓ | View | View |
| Fees Management | - | ✓ | - | - | - | Pay | - |
| Timetable | - | ✓ | - | - | View | - | View |
| User Management | - | - | ✓ | ✓ | - | - | - |
| Impersonation | - | - | - | ✓ | - | - | - |
| Platform Analytics | - | - | - | ✓ | - | - | - |

**Routing Guard Implementation:**
- Platform roles use `useAuth` hook with `isStudent`, `isInstitution`, `isAdmin`, `isSuperAdmin`
- School context roles authenticate via `school-middleware.ts` with `requireSchoolRole()`
- Navigation menus dynamically render based on `user.role` from current auth context

### External Dependencies
- **Database**: PostgreSQL (via Neon)
- **ORM**: Drizzle ORM
- **Authentication**: Passport.js
- **File Upload**: Multer
- **UI Components**: Radix UI
- **Payment Gateway**: Paystack

---

## System Health & Security Audit (December 2, 2025)

### System Health Status

| Component | Status | Details |
|-----------|--------|---------|
| PostgreSQL Database | Healthy | 47 tables, all relations verified |
| Express Server | Running | Port 5000, serving frontend and API |
| Session Store | Active | PostgreSQL-backed, 7-day TTL |
| File Uploads | Configured | Validated types, size limits enforced |
| Workflow | Running | npm run dev with hot reload |

### Database Tables (47 Total)

**LMS Platform (Learning Management System):**
- `users`, `courses`, `materials`, `quizzes`, `quiz_questions`, `quiz_attempts`
- `bookmarks`, `notifications`, `user_activity_logs`, `user_statistics`
- `institutions`, `institution_reviews`, `programmes`
- `material_ratings`, `material_reports`, `material_reviews`

**SMS Platform (School Management System):**
- `schools`, `school_users`, `school_classes`, `school_subjects`, `class_subjects`
- `academic_terms`, `attendance_records`, `student_grades`, `term_results`
- `teacher_assignments`, `class_enrollments`, `assessment_types`
- `fee_types`, `class_fees`, `fee_payments`
- `timetable_periods`, `timetable_entries`
- `school_announcements`, `school_notifications`, `school_materials`
- `school_conversations`, `school_messages`, `parent_student_links`
- `subscription_plans`, `subscription_payments`

**Learning Enhancement (Gamification & Personalization):**
- `user_gamification` - XP, level, streaks, quiz stats per user
- `badges` - Achievement badge definitions (20 badges seeded)
- `user_badges` - Earned badges tracking with notification status
- `user_streaks` - Daily study streak tracking
- `daily_study_logs` - Daily activity metrics (quizzes, reviews, XP)
- `xp_transactions` - XP earning history with source tracking
- `spaced_repetition_cards` - Flashcards with SM-2 algorithm scheduling
- `learning_recommendations` - Personalized content recommendations

**Security & Monitoring:**
- `sessions` - PostgreSQL session storage
- `security_events` - Security event logging
- `user_active_sessions` - Session tracking
- `platform_activity_feed` - Real-time activity monitoring
- `impersonation_logs` - Super admin impersonation audit trail

### Learning Enhancement Features (December 2025)

**Gamification System:**
- XP Awards: Quiz completion (20-50 XP based on score), flashcard reviews (2-5 XP), perfect scores (+25 XP), badge earning (varies)
- Leveling: Exponential XP curve (100 base XP * 1.5^level for next level)
- Streaks: Daily study tracking with automatic streak updates
- Leaderboards: Weekly, monthly, and all-time rankings with user rank display

**Badge System (20 Achievement Badges):**
| Category | Badges | Unlock Conditions |
|----------|--------|-------------------|
| Quiz | First Steps, Enthusiast, Master, Legend | 1, 10, 50, 100 quizzes completed |
| Perfect | Perfect Start, Perfectionist, Flawless | 1, 5, 20 perfect scores |
| Streak | Committed, Dedicated, Unstoppable, Habit Master | 3, 7, 14, 30 day streaks |
| Learning | Curious Mind, Knowledge Seeker, Scholar | 10, 50, 100 materials viewed |
| Reviews | Memory Training, Memory Master | 10, 100 flashcard reviews |
| Level | Rising Star, Achiever, Champion, Elite | Level 5, 10, 25, 50 |

**Spaced Repetition (SM-2 Algorithm):**
- Automatic flashcard generation from wrong quiz answers
- Quality ratings: 0-5 scale (0=forgot, 3=hard, 4=good, 5=easy)
- Interval scheduling: 1, 6, days then multiplied by ease factor
- Ease factor adjustment based on answer quality
- Cards organized by course and topic

**Adaptive Recommendations:**
- Performance-based: Analyzes quiz scores to identify weak areas (<70% average)
- Content suggestions: Materials and quizzes for improvement
- Due review alerts: Flashcard review reminders
- Priority scoring: Higher priority for lower performance areas

**API Endpoints (Learning Enhancement):**
- `GET /api/gamification/stats` - User XP, level, streak, progress
- `GET /api/gamification/leaderboard` - Weekly/monthly/total rankings
- `GET /api/gamification/xp-history` - XP transaction history
- `GET /api/badges` - All badges with earned status
- `GET /api/badges/earned` - User's earned badges
- `GET /api/badges/unnotified` - Newly earned badges for notifications
- `GET /api/spaced-repetition/cards` - All flashcards
- `GET /api/spaced-repetition/due` - Cards due for review
- `POST /api/spaced-repetition/cards/:id/review` - Submit review with SM-2
- `POST /api/recommendations/generate` - Generate personalized recommendations

### Security Assessment

#### Authentication Security

| Feature | Implementation | Status |
|---------|----------------|--------|
| Password Hashing | bcrypt (10 rounds) | Secure |
| Session Storage | PostgreSQL (connect-pg-simple) | Secure |
| Session TTL | 7 days | Configured |
| Brute Force Protection | 5 attempts/15 minutes lockout | Active |
| Security Event Logging | All auth events logged | Active |
| Device/IP Tracking | User agent + IP logged | Active |

#### Authorization & Access Control

| Feature | Implementation | Status |
|---------|----------------|--------|
| Role-Based Access | 7 distinct roles | Active |
| Middleware Guards | isAuthenticated, requireOnboarding | Active |
| Super Admin Guard | requireSuperAdmin middleware | Active |
| School Context Isolation | requireSchoolContext middleware | Active |
| Session Validation | School ID mismatch detection | Active |

#### Input Validation & Sanitization

| Validation Type | Implementation |
|-----------------|----------------|
| Request Body | Zod schemas for all endpoints |
| File Uploads | Type restriction + size limits |
| Email Verification | Token-based with expiry |
| Password Requirements | 8 character minimum |

#### File Upload Security

| Upload Type | Size Limit | Allowed Types |
|-------------|------------|---------------|
| LMS Materials | 10MB | PDF, DOC, DOCX, PPT, PPTX, TXT, JPG, JPEG, PNG |
| School Materials | 50MB | PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, JPG, PNG, GIF, MP4, MP3, ZIP |

### API Route Summary

| Route Group | Middleware | Features |
|-------------|------------|----------|
| `/api/auth/*` | Public/Authenticated | Registration, login, logout, email verification, password change |
| `/api/materials/*` | isAuthenticated, requireOnboarding | CRUD, filtering, pagination, moderation |
| `/api/quizzes/*` | isAuthenticated, requireOnboarding | Quiz management, attempts, scoring |
| `/api/school/*` | requireSchoolContext, checkTrialStatus | School-specific operations |
| `/api/super-admin/*` | isAuthenticated, requireSuperAdmin | Platform management, analytics, impersonation |

#### Rate Limiting Protection

| Limiter | Window | Max Requests | Purpose |
|---------|--------|--------------|---------|
| General API | 15 min | 100 (prod) / 500 (dev) | Global API protection |
| Authentication | 15 min | 10 (prod) / 50 (dev) | Login/auth endpoints |
| Registration | 1 hour | 5 (prod) / 20 (dev) | New user registration |
| Password Reset | 1 hour | 3 (prod) / 10 (dev) | Password reset requests |
| File Upload | 1 hour | 30 (prod) / 100 (dev) | Upload endpoints |
| Strict API | 1 min | 30 (prod) / 100 (dev) | Sensitive operations |
| Webhooks | 1 min | 100 | Payment webhook endpoints |

**Implementation Notes:**
- Rate limiter executes BEFORE body parsing to prevent large-payload DoS attacks
- Request body size limited to 1MB for JSON and URL-encoded payloads
- Uses express-rate-limit with standard rate limit headers
- IPv6 support enabled with x-forwarded-for header validation disabled

### Known Issues

| Issue | Severity | Location | Description |
|-------|----------|----------|-------------|
| TypeScript Type Mismatch | Low | school-routes.ts:2183 | `expectedAmount` property missing in payment schema |
| Missing Storage Method | Low | school-routes.ts:3182 | `getParentLinkedStudents` not defined in storage |
| Property Type Error | Low | school-routes.ts:3339 | `amountPaid` property type mismatch |
| PostCSS Warning | Info | Build Process | Plugin missing `from` option (cosmetic warning) |

### Recommendations

1. **Type Fixes**: Update storage interface and Drizzle schemas to resolve TypeScript errors
2. **HTTPS**: Ensure production deployment uses HTTPS-only cookies
3. **Audit Logs**: Consider adding audit logging for sensitive operations beyond security events

### Multi-Tenant Architecture

- **Subdomain Isolation**: Each school operates on unique subdomain
- **Separate Session Context**: LMS users and SMS school users have distinct session handling
- **Data Isolation**: All school queries filter by schoolId
- **Role Scoping**: School roles are scoped to their respective school context