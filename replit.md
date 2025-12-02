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
- WordPress-style blog editor with advanced formatting, media management, and SEO features.
- Interactive elements like checkbox-based selections and real-time previews.
- Efficient administrative experience with search, filter, and bulk actions for user management.

**Technical Implementations & Features:**
- **User Management:** Role-based access (Student, Institution, Admin, Parent, Teacher, School Student, Super Admin) with email verification, comprehensive admin dashboards, and bulk user actions.
- **Content Management:** Course, material, quiz, and blog system management.
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
| `admin` | Platform admin | User/content moderation, blog management |
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
| Blog Management | - | - | ✓ | ✓ | - | - | - |
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