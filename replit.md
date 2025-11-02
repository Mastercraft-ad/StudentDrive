# StudentDrive - Educational Resource Platform

## Project Overview
StudentDrive is a comprehensive educational resource management platform that connects students, instructors, and institutions. It features course materials, quizzes, blog posts, and personalized learning paths.

## Tech Stack
- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL (via Neon)
- **ORM**: Drizzle ORM
- **Authentication**: Passport.js (local strategy)
- **File Upload**: Multer
- **UI Components**: Radix UI

## Project Structure
```
├── client/          # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utility libraries
│   └── index.html
├── server/          # Express backend
│   ├── index.ts     # Main server entry
│   ├── routes.ts    # API routes
│   ├── auth.ts      # Authentication logic
│   ├── db.ts        # Database connection
│   ├── storage.ts   # Data access layer
│   └── vite.ts      # Vite dev server setup
├── shared/          # Shared types and schemas
│   └── schema.ts    # Drizzle schema definitions
├── scripts/         # Utility scripts
└── uploads/         # File upload directory
```

## Setup Instructions

### 1. Database Setup
You need to create a PostgreSQL database:
1. Click on the "Tools" sidebar in Replit
2. Select "Postgres" and create a new database
3. The DATABASE_URL will be automatically set as an environment variable

### 2. Environment Variables
Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string (auto-set by Replit)
- `SESSION_SECRET` - Secret for session encryption (optional, has default)
- `PORT` - Server port (defaults to 5000)
- `NODE_ENV` - Set to "development" for dev mode

### 3. Database Migration
After creating the database, push the schema:
```bash
npm run db:push
```

### 4. Create Admin User
Create an admin user to access the platform:
```bash
ADMIN_PASSWORD=your-secure-password npm run create-admin
```

### 5. Run Development Server
```bash
npm run dev
```

## Features
- User authentication with email verification
- Role-based access (Student, Instructor, Institution, Admin)
- Course and material management
- Quiz creation and taking
- **Professional WordPress-Style Blog Editor** (Enhanced November 1, 2025)
  - Clean, professional interface exactly matching WordPress design
  - **Enhanced Formatting Toolbar** with complete WordPress feature set:
    - Undo/Redo functionality with keyboard shortcuts
    - Paragraph/Heading dropdown (H1-H6 support)
    - Bold, Italic, Underline, Strikethrough text formatting
    - Bullet and numbered lists
    - Block quotes and inline code
    - Text alignment (left, center, right, justify)
    - Link and image insertion
    - Table creation with markdown support
    - Horizontal rule insertion
    - Clear formatting tool
  - **Advanced Media Management**:
    - Add Media button for inserting unlimited images
    - Image upload or URL insertion options
    - Alt text support for accessibility and SEO
    - Caption support with italic styling
    - Live image preview before insertion
    - Drag-and-drop file validation (JPEG, PNG, GIF, WebP - max 5MB)
  - Image insertion at cursor position in content
  - Visual and Code editing modes with tabs
  - Real-time word count and estimated read time
  - Live preview functionality with markdown rendering
  - Full SEO metadata (meta description, keywords, Open Graph, Twitter Cards)
  - Custom author information (authorName and authorBio overrides)
  - Dynamic meta tags for social media sharing
  - Author bio display on blog detail pages
  - Categories and tags management
  - Featured image support
- Material reviews and ratings
- Bookmarking system
- File uploads for materials and blog images
- **Admin User Statistics & Activity Tracking** (Added November 1, 2025)
  - User statistics tracking (logins, materials, quizzes, blog posts, bookmarks, time spent)
  - Activity logging system for all user actions
  - Admin dashboard with user statistics overview
  - View detailed statistics and activity logs for individual users
  - Bulk user management (select multiple users, bulk delete, bulk role changes, bulk verify)
  - Real-time activity monitoring with timestamps and metadata

## API Routes
- `/api/auth/*` - Authentication endpoints
- `/api/users/*` - User management
- `/api/courses/*` - Course operations
- `/api/materials/*` - Material management
- `/api/quizzes/*` - Quiz operations
- `/api/blog/*` - Blog post management
- `/api/institutions/*` - Institution management
- `/api/admin/*` - Admin-only endpoints
  - `/api/admin/users/:id` - Get user details
  - `/api/admin/users/:id` - Update user information
  - `/api/admin/users/:id` - Delete user account
  - `/api/admin/users/:id/reset-password` - Reset user password
  - `/api/admin/users/:id/statistics` - Get user statistics
  - `/api/admin/users/:id/activity` - Get user activity logs
  - `/api/admin/bulk-delete-users` - Bulk delete users
  - `/api/admin/bulk-update-users` - Bulk update users (role, verification, onboarding)

## Current Status (Updated November 1, 2025 - Setup Complete ✅)
- ✅ GitHub project imported successfully
- ✅ Dependencies installed (npm install completed)
- ✅ Vite configuration includes `allowedHosts: true` for Replit proxy support
- ✅ Development server running on port 5000 via workflow
- ✅ Deployment configuration set up (autoscale with npm run build and npm start)
- ✅ Application frontend accessible and rendering correctly
- ✅ .gitignore file created for Node.js/TypeScript project
- ✅ **DATABASE CONNECTED**: PostgreSQL database provisioned and connected
- ✅ **SCHEMA PUSHED**: Database schema pushed successfully with `npm run db:push`
- ⏳ **NEXT STEP**: Create admin user with `ADMIN_PASSWORD=your-password npm run create-admin`

## Replit Environment Setup
- **Database**: ✅ PostgreSQL database provisioned and connected (DATABASE_URL configured)
- **Port Configuration**: Server runs on port 5000 (both frontend and backend served together)
- **Host Configuration**: Vite configured with `allowedHosts: true` for Replit proxy support
- **Workflow**: Development server runs via `npm run dev` workflow (currently running)
- **Deployment**: Configured for autoscale deployment with build step (npm run build → npm start)
- **Frontend**: React app served via Vite dev server in development mode ✅
- **Backend**: Express.js server with API routes and authentication ✅

## Important Notes
- The application runs a full-stack setup where Express serves both the API (backend) and Vite-processed frontend on port 5000
- Vite is configured to allow all hosts, which is required for Replit's proxy environment
- The database connection uses Neon serverless PostgreSQL with WebSocket support
- File uploads are stored in the `uploads/` directory
- Session management uses PostgreSQL for session storage
- Authentication cookies are configured to work in both development (insecure) and production (secure) environments

## Recent Updates

### November 1, 2025 (Night) - User Statistics & Bulk Management Features
- **Database Schema Extensions**
  - Added `userActivityLogs` table to track all user actions with timestamps and metadata
  - Added `userStatistics` table to track user metrics (logins, materials, quizzes, blog posts, etc.)
  - Created activity logger helper (`server/activity-logger.ts`) with dual-mode statistics updates

- **Statistics Update System**
  - Mode-based statistics updates: `increment` (default) for event tracking, `set` for absolute values
  - Increment mode: Adds values to existing counters (e.g., loginCount += 1)
  - Set mode: Replaces values with authoritative totals for admin corrections
  - Proper null handling for all fields (averageQuizScore, totalTimeSpent, etc.)

- **Backend API Endpoints**
  - `GET /api/admin/users/:id/statistics` - Retrieve user statistics
  - `GET /api/admin/users/:id/activity` - Get user activity logs (50 most recent, DESC order)
  - `POST /api/admin/bulk-delete-users` - Delete multiple users at once
  - `PATCH /api/admin/bulk-update-users` - Bulk update user roles, verification, and onboarding status

- **Frontend Enhancements**
  - Bulk selection with checkboxes on user management page
  - Bulk operations toolbar (delete, verify, role changes) with confirmation dialogs
  - Statistics viewer dialog showing all user metrics in organized cards
  - Activity log viewer with chronological display (most recent first)
  - Loading states for statistics and activity data
  - Empty state messaging with appropriate icons
  - Select all/none functionality with count display

- **Security & Validation**
  - Admin-only endpoints with proper authorization checks
  - Prevents admins from deleting themselves
  - Email uniqueness validation on bulk updates
  - Confirmation dialogs for destructive actions
  - Real-time query invalidation after mutations

### November 1, 2025 (Late Evening) - Comprehensive User Management System
- **Full-Featured Admin User Management**
  - **Search & Filter**: Search users by name/email, filter by role (Student, Instructor, Institution, Admin) and status (Verified, Unverified, Active, Inactive)
  - **Edit Users**: Update user details including name, email, role, verification status, and onboarding status
  - **Delete Users**: Remove users with confirmation dialog (prevents self-deletion)
  - **Reset Passwords**: Admin can set new passwords for any user (min 8 characters)
  - **Security**: All endpoints admin-only, prevent self-modification, email uniqueness validation
  - **User Actions Menu**: Dropdown menu for each user with Edit, Reset Password, and Delete options
  - **Confirmation Dialogs**: AlertDialog for deletions, Dialog for edits and password resets
  - **Real-time Updates**: Automatic query invalidation after mutations
  - **Backend API Endpoints**:
    - `GET /api/admin/users/:id` - Get specific user details
    - `PATCH /api/admin/users/:id` - Update user information
    - `DELETE /api/admin/users/:id` - Delete user account
    - `POST /api/admin/users/:id/reset-password` - Reset user password
  - All operations include proper validation, error handling, and security checks

### November 1, 2025 (Evening) - Blog Data Integration
- **Removed Mock Data from Blog Page**
  - Eliminated hardcoded CATEGORIES array (10 mock categories)
  - Connected to real API endpoints (`/api/blog/categories` and `/api/blog/tags`)
  - Categories widget now always visible with "All Categories" button
  - Dynamic category display - only shows categories with posts
  - Improved loading states with distinct messages for posts vs categories
  - Better UX with "No categories yet" message instead of hiding widget
  - All blog data now comes from the database via API endpoints

### November 1, 2025 (Morning) - Blog & Header Improvements
- **WordPress-Style Editor Implementation**
  - Added professional "Add Media" button (styled with brand color #36a477) for inserting multiple images
  - Implemented media dialog with two modes:
    - Upload images from computer (JPEG, PNG, GIF, WebP - max 5MB)
    - Insert images via URL with live preview
  - Images are inserted at cursor position in the content
  - Improved formatting toolbar with better organization:
    - Paragraph/Heading dropdown (Paragraph, H1, H2, H3)
    - Grouped formatting buttons with visual separators
    - Clean, WordPress-like interface
  - Support for unlimited image insertions throughout the post content
  - Maintains all existing features (SEO, categories, tags, featured images, etc.)

- **Professional Blog Layout with Sidebar**
  - Removed intrusive featured posts banner from top of blog page
  - Implemented standard blog layout with main content area and sidebar (aside)
  - **Main Content Area**:
    - Large search bar for finding articles
    - Clean article list with horizontal card layout
    - Featured image, title, excerpt, and metadata displayed prominently
    - Active filters shown with easy removal
    - Hover effects and smooth transitions
  - **Sidebar Widgets**:
    - **Categories Widget**: Interactive category list with post counts
    - **Featured Posts Widget**: Compact featured posts display with thumbnails
    - **Popular Tags Widget**: Tag cloud for easy topic browsing
  - Improved responsive design for all screen sizes
  - Better visual hierarchy and content organization
  - Professional spacing and typography throughout

- **Cleaner Header Design**
  - Removed promotional banner text "Welcome to StudentDrive • Start Your Learning Journey Today!"
  - Streamlined header with cleaner, more professional appearance
  - Better focus on navigation and user actions

### October 31, 2025 - Authentication Fix
- **Session Cookie Configuration**: Updated to conditionally set `secure` flag based on NODE_ENV
  - Development mode: `secure: false` and `sameSite: 'lax'` for Replit's proxy environment
  - Production mode: `secure: true` and `sameSite: 'strict'` for enhanced security
  - Resolves login and registration issues in Replit development environment

## Next Steps for Users
1. Create an admin user to access the platform:
   ```bash
   ADMIN_PASSWORD=your-secure-password npm run create-admin
   ```
2. The application is now running and accessible through the Replit webview
3. Sign in with admin credentials (email: admin@studentdrive.com) to manage content
4. Start creating courses, materials, quizzes, and blog posts
5. When ready to deploy to production, click the "Deploy" button in Replit
