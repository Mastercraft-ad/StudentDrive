import type { CSSProperties } from "react";
import { Switch, Route } from "wouter";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { ImpersonationProvider } from "@/contexts/ImpersonationContext";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { useAuth } from "@/hooks/useAuth";
import { useSchoolAuth } from "@/hooks/useSchoolAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/auth/login";
import AdminLogin from "@/pages/auth/admin-login";
import Register from "@/pages/auth/register";
import VerifyEmail from "@/pages/auth/verify-email";
import Onboarding from "@/pages/auth/onboarding";
import StudentDashboard from "@/pages/student/dashboard";
import StudentUploadMaterial from "@/pages/student/upload-material";
import InstitutionDashboard from "@/pages/institution/dashboard";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminInstitutions from "@/pages/admin/institutions";
import AdminCourses from "@/pages/admin/courses";
import AdminContentModeration from "@/pages/admin/content-moderation";
import SuperAdminDashboard from "@/pages/super-admin/dashboard";
import SuperAdminUsers from "@/pages/super-admin/users";
import SuperAdminSchools from "@/pages/super-admin/schools";
import SuperAdminSchoolUsers from "@/pages/super-admin/school-users";
import SuperAdminActivityFeed from "@/pages/super-admin/activity-feed";
import SuperAdminActiveSessions from "@/pages/super-admin/active-sessions";
import SuperAdminSecurityEvents from "@/pages/super-admin/security-events";
import SuperAdminImpersonationLogs from "@/pages/super-admin/impersonation-logs";
import SuperAdminSubscriptions from "@/pages/super-admin/subscriptions";
import SuperAdminSubscriptionPlans from "@/pages/super-admin/subscription-plans";
import SuperAdminAnalytics from "@/pages/super-admin/analytics";
import SuperAdminSettings from "@/pages/super-admin/settings";
import Resources from "@/pages/resources";
import MaterialDetail from "@/pages/material-detail";
import SchoolDashboard from "@/pages/school/dashboard";
import SchoolClasses from "@/pages/school/classes";
import SchoolSubjects from "@/pages/school/subjects";
import SchoolTerms from "@/pages/school/terms";
import SchoolAttendance from "@/pages/school/attendance";
import SchoolAttendanceReports from "@/pages/school/attendance-reports";
import SchoolGrades from "@/pages/school/grades";
import SchoolGradesResults from "@/pages/school/grades-results";
import SchoolReportCards from "@/pages/school/report-cards";
import SchoolFees from "@/pages/school/fees";
import SchoolTimetable from "@/pages/school/timetable";
import SchoolAnnouncements from "@/pages/school/announcements";
import SchoolResources from "@/pages/school/resources";
import SchoolStudents from "@/pages/school/students";
import SchoolTeachers from "@/pages/school/teachers";
import SchoolParents from "@/pages/school/parents";
import SchoolParentStudentLinks from "@/pages/school/parent-student-links";
import ParentDashboard from "@/pages/school/parent-dashboard";
import ParentGrades from "@/pages/school/parent-grades";
import ParentFees from "@/pages/school/parent-fees";
import PaymentCallback from "@/pages/school/payment-callback";
import PaymentReceipt from "@/pages/school/payment-receipt";
import TeacherSchedule from "@/pages/school/teacher-schedule";
import StudentTimetable from "@/pages/school/student-timetable";
import MyLibrary from "@/pages/my-library";
import Bookmarks from "@/pages/bookmarks";
import Quizzes from "@/pages/quizzes";
import QuizTake from "@/pages/quiz-take";
import Performance from "@/pages/performance";
import Settings from "@/pages/settings";
import BadgesPage from "@/pages/student/badges";
import StudyGroupsPage from "@/pages/student/study-groups";
import SpacedRepetitionReviewPage from "@/pages/student/review";
import InstitutionsDirectory from "@/pages/institutions-directory";
import InstitutionDetail from "@/pages/institution-detail";
import SchoolLogin from "@/pages/school/login";
import SchoolRegister from "@/pages/school/register";
import SchoolSubscription from "@/pages/school/subscription";
import SubscriptionCallback from "@/pages/school/subscription-callback";
import SchoolSettings from "@/pages/school/settings";
import SchoolMessaging from "@/pages/school/messaging";
import SchoolAnalytics from "@/pages/school/analytics";

function Router({
  showLanding,
  showOnboarding,
}: {
  showLanding?: boolean;
  showOnboarding?: boolean;
}) {
  const { isStudent, isInstitution, isAdmin, isSuperAdmin } = useAuth();

  // Show onboarding for verified users who haven't completed onboarding
  if (showOnboarding) {
    return (
      <Switch>
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/" component={Onboarding} />
        <Route component={Onboarding} />
      </Switch>
    );
  }

  // Show auth pages for unauthenticated users
  if (showLanding) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/verify-email" component={VerifyEmail} />
        <Route path="/school/login" component={SchoolLogin} />
        <Route path="/school/register" component={SchoolRegister} />
        <Route path="/auth/admin" component={AdminLogin} />
        <Route component={Login} />
      </Switch>
    );
  }

  // Authenticated routes based on role
  return (
    <Switch>
      {/* Student Routes */}
      {isStudent && (
        <>
          <Route path="/" component={StudentDashboard} />
          <Route path="/resources" component={Resources} />
          <Route path="/material/:id" component={MaterialDetail} />
          <Route path="/my-library" component={MyLibrary} />
          <Route path="/student/upload" component={StudentUploadMaterial} />
          <Route path="/quizzes" component={Quizzes} />
          <Route path="/quiz/:id" component={QuizTake} />
          <Route path="/performance" component={Performance} />
          <Route path="/bookmarks" component={Bookmarks} />
          <Route path="/badges" component={BadgesPage} />
          <Route path="/study-groups" component={StudyGroupsPage} />
          <Route path="/review" component={SpacedRepetitionReviewPage} />
          <Route path="/institutions" component={InstitutionsDirectory} />
          <Route path="/institutions/:slug" component={InstitutionDetail} />
          <Route path="/settings" component={Settings} />
        </>
      )}

      {/* Institution Routes */}
      {isInstitution && (
        <>
          <Route path="/" component={SchoolDashboard} />
          <Route path="/institution" component={InstitutionDashboard} />
          <Route
            path="/institution/students"
            component={InstitutionDashboard}
          />
          <Route path="/institution/courses" component={Resources} />
          <Route path="/material/:id" component={MaterialDetail} />
          <Route path="/institution/analytics" component={Performance} />
          <Route path="/institutions" component={InstitutionsDirectory} />
          <Route path="/institutions/:slug" component={InstitutionDetail} />
          <Route path="/institution/settings" component={Settings} />
          <Route path="/settings" component={Settings} />
          {/* School Management Routes */}
          <Route path="/school" component={SchoolDashboard} />
          <Route path="/school/dashboard" component={SchoolDashboard} />
          <Route path="/school/classes" component={SchoolClasses} />
          <Route path="/school/subjects" component={SchoolSubjects} />
          <Route path="/school/terms" component={SchoolTerms} />
          <Route path="/school/attendance" component={SchoolAttendance} />
          <Route path="/school/attendance/reports" component={SchoolAttendanceReports} />
          <Route path="/school/grades" component={SchoolGrades} />
          <Route path="/school/grades/results" component={SchoolGradesResults} />
          <Route path="/school/grades/report-cards" component={SchoolReportCards} />
          <Route path="/school/fees" component={SchoolFees} />
          <Route path="/school/timetable" component={SchoolTimetable} />
          <Route path="/school/announcements" component={SchoolAnnouncements} />
          <Route path="/school/resources" component={SchoolResources} />
          <Route path="/school/students" component={SchoolStudents} />
          <Route path="/school/teachers" component={SchoolTeachers} />
          <Route path="/school/parents" component={SchoolParents} />
          <Route path="/school/parent-student-links" component={SchoolParentStudentLinks} />
          <Route path="/school/parent-dashboard" component={ParentDashboard} />
          <Route path="/school/parent/grades" component={ParentGrades} />
          <Route path="/school/parent/fees" component={ParentFees} />
          <Route path="/school/payment-callback" component={PaymentCallback} />
          <Route path="/school/receipt/:id" component={PaymentReceipt} />
          {/* Teacher and Student specific routes */}
          <Route path="/school/teacher/schedule" component={TeacherSchedule} />
          <Route path="/school/student/timetable" component={StudentTimetable} />
          <Route path="/school/student-dashboard" component={SchoolDashboard} />
          {/* Subscription Management */}
          <Route path="/school/subscription" component={SchoolSubscription} />
          <Route path="/school/subscription/callback" component={SubscriptionCallback} />
          {/* School Settings */}
          <Route path="/school/settings" component={SchoolSettings} />
          {/* Messaging */}
          <Route path="/school/messages" component={SchoolMessaging} />
          {/* Analytics */}
          <Route path="/school/analytics" component={SchoolAnalytics} />
        </>
      )}

      {/* Admin Routes */}
      {isAdmin && (
        <>
          <Route path="/" component={AdminDashboard} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/users" component={AdminUsers} />
          <Route path="/admin/institutions" component={AdminInstitutions} />
          <Route path="/admin/courses" component={AdminCourses} />
          <Route path="/admin/content" component={AdminContentModeration} />
          <Route path="/material/:id" component={MaterialDetail} />
          <Route path="/institutions" component={InstitutionsDirectory} />
          <Route path="/institutions/:slug" component={InstitutionDetail} />
          <Route path="/admin/analytics" component={Performance} />
          <Route path="/admin/settings" component={Settings} />
          <Route path="/settings" component={Settings} />
        </>
      )}

      {/* Super Admin Routes */}
      {isSuperAdmin && (
        <>
          <Route path="/" component={SuperAdminDashboard} />
          <Route path="/super-admin" component={SuperAdminDashboard} />
          <Route path="/super-admin/activity-feed" component={SuperAdminActivityFeed} />
          <Route path="/super-admin/active-sessions" component={SuperAdminActiveSessions} />
          <Route path="/super-admin/security-events" component={SuperAdminSecurityEvents} />
          <Route path="/super-admin/impersonation-logs" component={SuperAdminImpersonationLogs} />
          <Route path="/super-admin/users" component={SuperAdminUsers} />
          <Route path="/super-admin/schools" component={SuperAdminSchools} />
          <Route path="/super-admin/schools/:schoolId/users" component={SuperAdminSchoolUsers} />
          <Route path="/super-admin/institutions" component={AdminInstitutions} />
          <Route path="/super-admin/subscriptions" component={SuperAdminSubscriptions} />
          <Route path="/super-admin/subscription-plans" component={SuperAdminSubscriptionPlans} />
          <Route path="/super-admin/analytics" component={SuperAdminAnalytics} />
          <Route path="/super-admin/settings" component={SuperAdminSettings} />
          <Route path="/material/:id" component={MaterialDetail} />
          <Route path="/settings" component={Settings} />
        </>
      )}

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function SchoolAppWithSidebar({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };
  
  return (
    <SidebarProvider style={style as CSSProperties}>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto bg-muted/30">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function SchoolApp() {
  const { isAuthenticated, isLoading, isSchoolAdmin, isTeacher, isParent, isStudent, subdomain } = useSchoolAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/school/login" component={SchoolLogin} />
        <Route path="/school/register" component={SchoolRegister} />
        <Route>
          {() => {
            window.location.href = `/school/login${subdomain ? `?subdomain=${subdomain}` : ''}`;
            return null;
          }}
        </Route>
      </Switch>
    );
  }
  
  return (
    <SchoolAppWithSidebar>
      <Switch>
        {/* School Admin Routes */}
        {isSchoolAdmin && (
          <>
            <Route path="/school/dashboard" component={SchoolDashboard} />
            <Route path="/school/classes" component={SchoolClasses} />
            <Route path="/school/subjects" component={SchoolSubjects} />
            <Route path="/school/terms" component={SchoolTerms} />
            <Route path="/school/attendance" component={SchoolAttendance} />
            <Route path="/school/attendance/reports" component={SchoolAttendanceReports} />
            <Route path="/school/grades" component={SchoolGrades} />
            <Route path="/school/grades/results" component={SchoolGradesResults} />
            <Route path="/school/grades/report-cards" component={SchoolReportCards} />
            <Route path="/school/fees" component={SchoolFees} />
            <Route path="/school/timetable" component={SchoolTimetable} />
            <Route path="/school/announcements" component={SchoolAnnouncements} />
            <Route path="/school/resources" component={SchoolResources} />
            <Route path="/school/students" component={SchoolStudents} />
            <Route path="/school/teachers" component={SchoolTeachers} />
            <Route path="/school/parents" component={SchoolParents} />
            <Route path="/school/parent-student-links" component={SchoolParentStudentLinks} />
            <Route path="/school/subscription" component={SchoolSubscription} />
            <Route path="/school/subscription/callback" component={SubscriptionCallback} />
            <Route path="/school/settings" component={SchoolSettings} />
            <Route path="/school/messages" component={SchoolMessaging} />
            <Route path="/school/analytics" component={SchoolAnalytics} />
            <Route path="/" component={SchoolDashboard} />
          </>
        )}
        
        {/* Teacher Routes */}
        {isTeacher && (
          <>
            <Route path="/school/dashboard" component={SchoolDashboard} />
            <Route path="/school/teacher/schedule" component={TeacherSchedule} />
            <Route path="/school/attendance" component={SchoolAttendance} />
            <Route path="/school/grades" component={SchoolGrades} />
            <Route path="/school/announcements" component={SchoolAnnouncements} />
            <Route path="/school/resources" component={SchoolResources} />
            <Route path="/school/messages" component={SchoolMessaging} />
            <Route path="/" component={SchoolDashboard} />
          </>
        )}
        
        {/* Parent Routes */}
        {isParent && (
          <>
            <Route path="/school/parent-dashboard" component={ParentDashboard} />
            <Route path="/school/parent/grades" component={ParentGrades} />
            <Route path="/school/parent/fees" component={ParentFees} />
            <Route path="/school/payment-callback" component={PaymentCallback} />
            <Route path="/school/receipt/:id" component={PaymentReceipt} />
            <Route path="/school/announcements" component={SchoolAnnouncements} />
            <Route path="/school/messages" component={SchoolMessaging} />
            <Route path="/" component={ParentDashboard} />
          </>
        )}
        
        {/* Student Routes */}
        {isStudent && (
          <>
            <Route path="/school/student-dashboard" component={SchoolDashboard} />
            <Route path="/school/student/timetable" component={StudentTimetable} />
            <Route path="/school/announcements" component={SchoolAnnouncements} />
            <Route path="/school/resources" component={SchoolResources} />
            <Route path="/" component={SchoolDashboard} />
          </>
        )}
        
        <Route component={NotFound} />
      </Switch>
    </SchoolAppWithSidebar>
  );
}

function isSchoolContext(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  const subdomainFromQuery = urlParams.get('subdomain') || urlParams.get('__school');
  
  if (subdomainFromQuery) {
    return true;
  }
  
  const pathname = window.location.pathname;
  if (pathname.startsWith('/school/') && !pathname.startsWith('/school/register')) {
    return true;
  }
  
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.includes('studentdrive.com')) {
    const parts = hostname.split('.');
    if (parts.length > 2 && parts[0] !== 'www') {
      return true;
    }
  }
  
  return false;
}

export default function App() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const inSchoolContext = isSchoolContext();

  // Custom sidebar width for better content display
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  // Handle school portal separately
  if (inSchoolContext) {
    return <SchoolApp />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Router showLanding={true} />;
  }

  if (user && !user.onboardingCompleted) {
    return <Router showOnboarding={true} />;
  }

  return (
    <ImpersonationProvider>
      <SidebarProvider style={style as CSSProperties}>
        <AppSidebar />
        <SidebarInset className="flex flex-col h-screen overflow-hidden">
          <ImpersonationBanner />
          <AppHeader />
          <main className="flex-1 overflow-y-auto bg-muted/30">
            <Router />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ImpersonationProvider>
  );
}
