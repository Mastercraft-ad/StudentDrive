# StudentDrive - Educational Resource Platform

### Overview
StudentDrive is a comprehensive educational resource management platform designed to connect students, instructors, and institutions. Its primary purpose is to facilitate learning through course materials, quizzes, blog posts, and personalized learning paths. The project aims to provide a robust, feature-rich environment for educational content delivery and management.

### User Preferences
I prefer iterative development and welcome questions for clarification. Please ensure detailed explanations for complex changes. Do not make changes to the `shared/` folder unless absolutely necessary and after explicit confirmation.

### System Architecture
The project utilizes a full-stack architecture with a React, TypeScript, Vite, and TailwindCSS frontend, an Express.js and TypeScript backend, and a PostgreSQL database managed by Drizzle ORM. Authentication is handled via Passport.js, and file uploads use Multer. Radix UI is used for UI components. The application serves both the API and the frontend from a single Express server on port 5000.

**UI/UX Decisions:**
- The platform incorporates a clean, professional design, particularly evident in the WordPress-style blog editor and redesigned sidebars, favoring card-based sections and clear visual hierarchy.
- User management features include search, filter, and bulk actions for an efficient administrative experience.
- Interactive elements like checkbox-based category selection and real-time previews are integrated for enhanced usability.

**Technical Implementations & Features:**
- **User Management**: Role-based access (Student, Instructor, Institution, Admin) with email verification. Comprehensive admin dashboard including user statistics tracking (logins, materials, quizzes, blog posts, bookmarks, time spent) and activity logging. Bulk user management for deletion, role changes, and verification.
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

### External Dependencies
- **Database**: PostgreSQL (via Neon)
- **ORM**: Drizzle ORM
- **Authentication**: Passport.js
- **File Upload**: Multer
- **UI Components**: Radix UI