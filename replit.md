# StudentDrive - Educational Resource Platform

### Overview
StudentDrive is a comprehensive educational resource management platform designed to connect students and institutions. Its primary purpose is to facilitate learning through course materials, quizzes, blog posts, and personalized learning paths. The project aims to provide a robust, feature-rich environment for educational content delivery and management.

The platform also includes a **Multi-Tenant School Management System (SMS)** allowing individual schools to manage their academic operations through subdomain-based isolation.

### User Preferences
I prefer iterative development and welcome questions for clarification. Please ensure detailed explanations for complex changes. Do not make changes to the `shared/` folder unless absolutely necessary and after explicit confirmation.

### System Architecture
The project utilizes a full-stack architecture with a React, TypeScript, Vite, and TailwindCSS frontend, an Express.js and TypeScript backend, and a PostgreSQL database managed by Drizzle ORM. Authentication is handled via Passport.js, and file uploads use Multer. Radix UI is used for UI components. The application serves both the API and the frontend from a single Express server on port 5000.

## Multi-Tenant School Management System (Updated: November 2025)

### Overview
A comprehensive school management system with subdomain-based multi-tenancy. Each school gets its own subdomain (e.g., `schoolname.studentdrive.com`) with isolated data and customizable branding.

### Database Schema (All tables in shared/schema.ts)

**Core School Tables:**
- `schools` - School profiles with subscription status, branding
- `school_users` - Users within schools (admin, teacher, student, parent)
- `parent_student_links` - Parent-child relationships
- `subscription_plans` - School subscription tiers

**Academic Structure Tables:**
- `academic_terms` - Term/semester definitions with date ranges
- `school_classes` - Class definitions (JSS1, SS2, Grade 5, etc.)
- `school_subjects` - Subject catalog with codes and credits
- `class_subjects` - Links subjects to specific classes
- `teacher_assignments` - Teacher-class-subject assignments
- `class_enrollments` - Student enrollment in classes

**Attendance System (Phase 4 - Completed November 2025):**
- `attendance_records` - Daily attendance with status (present/absent/late/excused)
  - Subject-wise attendance tracking via optional `subjectId` field
  - Term-based attendance organization via `termId` field
- Attendance marking UI with subject toggle, term selection, and bulk actions
- Attendance reports page with daily/weekly/monthly/term views and student breakdowns
- Parent portal integration for viewing child attendance summaries

**Grades & Assessments:**
- `assessment_types` - CA, Exam, Assignment definitions with weights
- `student_grades` - Individual assessment scores
- `term_results` - Calculated term results with grades and positions

**Fees & Payments (Phase 6 - Completed November 2025):**
- `fee_types` - Fee categories (tuition, exam, lab fees)
- `class_fees` - Fee assignments to classes
- `fee_payments` - Payment records with Paystack integration
  - Fields for Paystack: `paystackReference`, `paystackAccessCode`, `paymentReference`
  - Status tracking: pending, completed, failed
- **Paystack Integration** (server/paystack.ts)
  - Payment initialization with server-side amount calculation
  - Verification with amount validation
  - Webhook handling with signature validation
  - Secure callback URL generation
- **Parent Payment Portal** (client/src/pages/school/parent-fees.tsx)
  - View outstanding fees by child
  - Pay Now button with Paystack checkout
  - Payment history with status tracking
- **Payment Callback & Receipt** (payment-callback.tsx, payment-receipt.tsx)
  - Automatic payment verification after Paystack redirect
  - Receipt display with print/PDF capability
- **Payment Reminders** 
  - Overdue payment tracking
  - Individual and bulk reminder sending
  - Integration with school notifications system

**Timetable System (Phase 7 - Completed November 2025):**
- `timetable_periods` - Time slot definitions (name, start/end times, break periods)
- `timetable_entries` - Weekly schedule entries with teacher assignments
- **Backend Features:**
  - Conflict detection prevents double-booking teachers at same day/period/term
  - `checkTeacherConflict` storage method with excludeEntryId for updates
  - Detailed conflict error messages with teacher name
- **Teacher Schedule Page** (client/src/pages/school/teacher-schedule.tsx)
  - Weekly grid view showing assigned classes/subjects
  - Term filtering with current term auto-selection
  - Period/subject/class statistics cards
- **Student Timetable Page** (client/src/pages/school/student-timetable.tsx)
  - Weekly grid showing class timetable with subjects and teachers
  - Room information display
  - Term-based filtering with proper query caching
- **Navigation Config Updates:**
  - Added `teacher` role menu with "My Schedule" link
  - Added `school_student` role menu with "My Timetable" link
  - Updated `parent` role to include "Fees" link

**Announcements System (Phase 8 - Completed November 2025):**
- `school_announcements` - School-wide or class-targeted announcements
  - Target audience options: all, students, teachers, parents, specific classes
  - `targetClassIds` text array for class-specific targeting
  - Announcement types: general, event, academic, urgent
- `school_notifications` - User-specific in-app notifications
- **Class-Targeted Announcements:**
  - Multi-class selection UI with checkbox interface
  - Automatic notification fan-out to:
    - Students enrolled in targeted classes
    - Parents of enrolled students (via parent_student_links)
    - Teachers assigned to targeted classes (via teacher_assignments)
  - Role-based announcement filtering in GET endpoint
- **Cross-Role Visibility:**
  - Parents see announcements for their children's classes
  - Teachers see announcements for their assigned classes
  - Students see announcements for their enrolled classes
  - Admins see all announcements

**Phase 12 - Polish & Integration (Completed December 2025):**
- **School Settings UI** (client/src/pages/school/settings.tsx)
  - Three-tab interface: General, Branding, Integrations
  - General tab: School name, contact info, address fields
  - Branding tab: Logo URL, primary/secondary color pickers with live preview
  - Integrations tab: Public platform access toggle for students
- **Email Notification System**
  - School-specific email templates for attendance alerts, grade updates, fee reminders
  - Integration with school notifications system
- **Parent-Teacher Messaging** (client/src/pages/school/messaging.tsx)
  - Full conversation thread UI with real-time message display
  - Navigation integrated for parent and teacher roles
- **Enhanced Analytics Dashboard** (client/src/pages/school/analytics.tsx)
  - Period-based filtering (current term, last term, custom date range)
  - Comprehensive metrics: enrollment trends, attendance rates, fee collection, grade performance
  - Custom queryFn for proper data refetching when period changes
- **Public Platform Integration**
  - `allowPublicPlatformAccess` boolean field in schools table
  - Toggle switch in Integrations tab that persists to database
  - Enables school students to access public StudentDrive features

**API Routes Added in Phase 12:**
- `GET /api/school/me` - Returns school settings including allowPublicPlatformAccess
- `PATCH /api/school/settings` - Updates school settings including integrations
- `GET /api/school/analytics` - Returns dashboard analytics with period parameter support

**Phase 2 Super Admin Features (Added December 2025):**
- **Live Activity Feed** (server/platform-activity-logger.ts, client/src/pages/super-admin/activity-feed.tsx)
  - Real-time monitoring of platform-wide activities
  - Activity types: user_registered, school_registered, payment_received, impersonation events, etc.
  - Platform filtering (LMS/SMS/All), auto-refresh with configurable intervals
  - Activity statistics breakdown by type
  - `platform_activity_feed` table for storing activities
- **Impersonation System** (client/src/contexts/ImpersonationContext.tsx)
  - Super admin can impersonate school admins for troubleshooting
  - ImpersonationContext for session state management
  - ImpersonationBanner component (client/src/components/impersonation-banner.tsx)
    - Persistent amber banner when impersonation is active
    - Shows school name, target user, duration
    - "End Session" button to terminate impersonation
  - All impersonation actions are logged in `impersonation_logs` table
  - Session token generation for secure impersonation
  - Reason tracking for audit purposes
  - Start/end impersonation actions logged to activity feed
- **Impersonation Logs Page** (client/src/pages/super-admin/impersonation-logs.tsx)
  - Complete audit trail of all impersonation sessions
  - Session statistics: total sessions, active now, schools accessed
  - Filtering by school and search functionality
  - Detailed log view with timestamps and technical details
- **School Users View** (client/src/pages/super-admin/school-users.tsx)
  - View all users within a specific school
  - Role-based filtering (admin, teacher, student, parent)
  - Search functionality for user lookup
  - Edit user details with change tracking
  - Impersonate specific users with reason dialog
  - Role statistics display

**API Routes Added for Super Admin Phase 2:**
- `GET /api/super-admin/activity-feed` - Paginated activity feed with filters
- `GET /api/super-admin/activity-feed/stats` - Activity statistics
- `GET /api/super-admin/schools/:schoolId/users` - School users list
- `GET /api/super-admin/schools/:schoolId/users/:userId` - Single user details
- `PATCH /api/super-admin/schools/:schoolId/users/:userId` - Update school user
- `POST /api/super-admin/impersonate/:schoolId` - Start impersonation
- `POST /api/super-admin/impersonate/:schoolId/end` - End impersonation
- `GET /api/super-admin/impersonation/active` - Check active impersonation
- `GET /api/super-admin/impersonation/logs` - Impersonation audit logs

**School Resources:**
- `school_materials` - Private school resource library

### API Routes (server/school-routes.ts)

**Public Endpoints:**
- `POST /api/schools/register` - Register new school with trial
- `GET /api/schools/check-subdomain/:subdomain` - Check availability
- `GET /api/schools/subscription-plans` - List available plans

**School Context Endpoints (require subdomain):**
- Academic Terms: CRUD operations at `/api/school/terms/*`
- Classes: CRUD at `/api/school/classes/*`
- Subjects: CRUD at `/api/school/subjects/*`
- Class-Subject Links: `/api/school/classes/:classId/subjects/*`
- Teacher Assignments: `/api/school/assignments/*`
- Student Enrollments: `/api/school/enrollments/*`
- Attendance: `/api/school/attendance/*` with bulk marking support
- Assessment Types: `/api/school/assessment-types/*`
- Grades: `/api/school/grades/*`
- Term Results: `/api/school/results/*`
- Fee Types: `/api/school/fee-types/*`
- Payments: `/api/school/payments/*`
- Timetable: `/api/school/timetable/*` and periods
- Announcements: `/api/school/announcements/*`
- Notifications: `/api/school/notifications/*`
- Materials: `/api/school/materials/*`
- Dashboard Stats: `/api/school/dashboard/stats`

### Storage Interface (server/storage.ts)
Over 70+ methods for comprehensive CRUD operations across all school management tables.

**UI/UX Decisions:**
- The platform incorporates a clean, professional design, particularly evident in the WordPress-style blog editor and redesigned sidebars, favoring card-based sections and clear visual hierarchy.
- User management features include search, filter, and bulk actions for an efficient administrative experience.
- Interactive elements like checkbox-based category selection and real-time previews are integrated for enhanced usability.

**Technical Implementations & Features:**
- **User Management**: Role-based access (Student, Institution, Admin) with email verification. Comprehensive admin dashboard including user statistics tracking (logins, materials, quizzes, blog posts, bookmarks, time spent) and activity logging. Bulk user management for deletion, role changes, and verification.
- **Content Management**: Features include course and material management, quiz creation and taking, and a robust blog system.
- **Advanced Blog Editor**: A professional WordPress-style blog editor with an enhanced formatting toolbar (supporting headings, text formatting, lists, links, images, tables), advanced media management (image uploads/URL insertion, alt text, captions, live preview, drag-and-drop validation), visual and code editing modes, real-time word count, SEO metadata, and custom author information.
- **Institution Review System**: Comprehensive review platform including bulk institution uploads via CSV/JSON, public institution directory with search and filtering, institution detail pages with star ratings (1-5), review submission with verified badges for students/alumni, and automatic average rating calculation. ProfileSlug auto-generation from institution names ensures consistent URL-friendly identifiers.
- **Data Tracking**: Extensive user statistics and activity tracking with dedicated database tables for logs and metrics, supporting both incremental and absolute updates.
- **Security**: Admin-only API endpoints with authorization checks, prevention of self-deletion, and email uniqueness validation.
- **Session Management**: Configured for secure session handling with PostgreSQL session storage, adapting `secure` and `sameSite` cookie flags based on the environment.

**System Design Choices:**
- A monorepo structure separating client, server, and shared code.
- Database schema extensions for user activity logs and statistics.
- API routes are logically grouped by functionality (e.g., `/api/auth/*`, `/api/admin/*`).
- File uploads are managed in a dedicated `uploads/` directory.

### Navigation Access Control Plan (December 2025)

**Role-Based Navigation Structure:**

| Role | Primary Section | Secondary Section | Footer |
|------|-----------------|-------------------|--------|
| `student` | Dashboard, Resources, My Library, Quizzes | Upload, Performance, Bookmarks | Settings |
| `institution` | School Management (Dashboard, Students, Teachers, Parents, Classes, Subjects, Terms) | Academic & Finance (Attendance, Grades, Fees, Timetable, Announcements, Resources, Analytics, Subscription, School Settings) | - |
| `admin` | Dashboard, Users, Institutions, Content | Analytics, Blog (Posts, Categories, Tags), Settings | - |
| `parent` | Dashboard, Grades, Fees, Messages | Announcements, Settings | - |
| `teacher` | Dashboard, My Schedule, Attendance, Grades, Messages | Announcements, Resources, Settings | - |
| `school_student` | Dashboard, My Timetable, My Grades | Announcements, Resources, Settings | - |
| `super_admin` | Dashboard, Live Activity, Active Sessions, Security Events, Impersonation Logs, Platform Analytics | All Users, Institutions, Blog | SMS Management, System Settings |

**Access Control Rules:**
- Each role has exclusive access to its own menu configuration
- No duplicate menu items within a single role
- Admin role is separate from Super Admin role
- Super Admin has full platform oversight including SMS Management

### External Dependencies
- **Database**: PostgreSQL (via Neon)
- **ORM**: Drizzle ORM
- **Authentication**: Passport.js
- **File Upload**: Multer
- **UI Components**: Radix UI