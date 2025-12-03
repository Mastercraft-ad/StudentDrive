# StudentDrive - Educational Resource Platform

### Overview
StudentDrive is a comprehensive educational resource management platform connecting students and institutions. It facilitates learning through various content types like course materials, quizzes, and personalized learning paths. The platform also includes a Multi-Tenant School Management System (SMS) for schools to manage academic operations with subdomain-based isolation, customizable branding, and isolated data. The project aims to provide a robust environment for content delivery, management, and school administration.

### User Preferences
I prefer iterative development and welcome questions for clarification. Please ensure detailed explanations for complex changes. Do not make changes to the `shared/` folder unless absolutely necessary and after explicit confirmation.

### System Architecture
The project utilizes a full-stack architecture. The frontend is built with React, TypeScript, Vite, TailwindCSS, and Radix UI. The backend uses Express.js and TypeScript. Data is stored in a PostgreSQL database managed by Drizzle ORM. Authentication is handled by Passport.js, and Multer manages file uploads. Both API and frontend are served from a single Express server within a monorepo structure.

**UI/UX Decisions:**
A clean, professional design with card-based sections and clear visual hierarchy is employed. It features interactive elements, search, filter, and bulk actions for an efficient administrative experience.

**Technical Implementations & Features:**
- **User Management:** Role-based access (Student, Institution, Admin, Parent, Teacher, School Student, Super Admin) with email verification and comprehensive dashboards.
- **Content Management:** Tools for managing courses, learning materials, and quizzes.
- **Institution Review System:** Public directory, star ratings, and verified reviews.
- **Data Tracking:** Extensive user statistics and activity logging.
- **Security:** Admin-only API endpoints, robust authorization checks, and secure PostgreSQL-backed session management.
- **Multi-Tenant SMS:** Core features include academic structure (terms, classes, subjects), attendance, grades, fees with Paystack integration, timetable, announcements, and parent-teacher messaging. Each school has isolated data and customizable settings.
- **Gamification & Personalization:** XP awards, leveling, daily streaks, achievement badges, leaderboards, and a Spaced Repetition System (SM-2 algorithm) for flashcards. Adaptive recommendations identify weak areas and suggest relevant content.
- **Super Admin Features:** Live activity feed, impersonation system for troubleshooting, and detailed impersonation logs.
- **Navigation Access Control:** Role-based dynamic navigation menus and routing guards based on user roles and authentication context.

**System Design Choices:**
- Monorepo for client, server, and shared code.
- Logically grouped API routes.
- Dedicated `uploads/` directory for file storage.
- Two distinct authentication contexts: Platform Authentication (`users` table) and School Context Authentication (`school_users` table), enabling a hierarchical role structure.

### External Dependencies
- **Database**: PostgreSQL (via Neon)
- **ORM**: Drizzle ORM
- **Authentication**: Passport.js
- **File Upload**: Multer
- **UI Components**: Radix UI
- **Payment Gateway**: Paystack