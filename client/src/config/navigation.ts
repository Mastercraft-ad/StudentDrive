import {
  Home,
  BookOpen,
  FileText,
  ClipboardList,
  TrendingUp,
  Users,
  Users2,
  Settings,
  BarChart3,
  Shield,
  Library,
  Upload,
  GraduationCap,
  Calendar,
  UserCheck,
  DollarSign,
  Clock,
  Bell,
  FolderOpen,
  FileSpreadsheet,
  Calculator,
  CreditCard,
  MessageSquare,
  Building2,
  School,
  Layers,
  Activity,
  Crown,
  Monitor,
  ShieldAlert,
  Link2,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  children?: NavItem[];
}

export interface MenuSection {
  label?: string;
  items: NavItem[];
}

export interface RoleMenuConfig {
  primary: MenuSection;
  secondary?: MenuSection;
  footer?: NavItem[];
}

export interface MenuConfig {
  [role: string]: RoleMenuConfig;
}

export const menuConfig: MenuConfig = {
  student: {
    primary: {
      label: "Main",
      items: [
        { title: "Dashboard", url: "/", icon: Home },
        { title: "Resources", url: "/resources", icon: BookOpen },
        { title: "My Library", url: "/my-library", icon: Library },
        { title: "Quizzes", url: "/quizzes", icon: ClipboardList },
      ],
    },
    secondary: {
      label: "Tools",
      items: [
        { title: "Upload Material", url: "/student/upload", icon: Upload },
        { title: "Performance", url: "/performance", icon: TrendingUp },
        { title: "Bookmarks", url: "/bookmarks", icon: FileText },
      ],
    },
    footer: [
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
  institution: {
    primary: {
      label: "School Management",
      items: [
        { title: "Dashboard", url: "/", icon: Home },
        { title: "Students", url: "/school/students", icon: GraduationCap },
        { title: "Teachers", url: "/school/teachers", icon: Users },
        { title: "Parents", url: "/school/parents", icon: Users2 },
        { title: "Family Links", url: "/school/parent-student-links", icon: Link2 },
        { title: "Classes", url: "/school/classes", icon: BookOpen },
        { title: "Subjects", url: "/school/subjects", icon: FileText },
        { title: "Terms", url: "/school/terms", icon: Calendar },
      ],
    },
    secondary: {
      label: "Academic & Finance",
      items: [
        { 
          title: "Attendance", 
          url: "#", 
          icon: UserCheck,
          children: [
            { title: "Mark Attendance", url: "/school/attendance", icon: UserCheck },
            { title: "Reports", url: "/school/attendance/reports", icon: BarChart3 },
          ],
        },
        { 
          title: "Grades", 
          url: "#", 
          icon: TrendingUp,
          children: [
            { title: "Enter Grades", url: "/school/grades", icon: TrendingUp },
            { title: "Term Results", url: "/school/grades/results", icon: Calculator },
            { title: "Report Cards", url: "/school/grades/report-cards", icon: FileSpreadsheet },
          ],
        },
        { title: "Fees", url: "/school/fees", icon: DollarSign },
        { title: "Timetable", url: "/school/timetable", icon: Clock },
        { title: "Announcements", url: "/school/announcements", icon: Bell },
        { title: "Resources", url: "/school/resources", icon: FolderOpen },
        { title: "Analytics", url: "/school/analytics", icon: BarChart3 },
        { title: "Subscription", url: "/school/subscription", icon: CreditCard },
        { title: "School Settings", url: "/school/settings", icon: Settings },
      ],
    },
    footer: [],
  },
  admin: {
    primary: {
      label: "Main",
      items: [
        { title: "Dashboard", url: "/admin", icon: Home },
        { title: "Users", url: "/admin/users", icon: Users },
        { title: "Institutions", url: "/admin/institutions", icon: Shield },
        { title: "Content", url: "/admin/content", icon: FileText },
      ],
    },
    secondary: {
      label: "Management",
      items: [
        { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
        { title: "Settings", url: "/admin/settings", icon: Settings },
      ],
    },
    footer: [],
  },
  parent: {
    primary: {
      label: "Parent Portal",
      items: [
        { title: "Dashboard", url: "/school/parent-dashboard", icon: Home },
        { title: "Grades", url: "/school/parent/grades", icon: TrendingUp },
        { title: "Fees", url: "/school/parent/fees", icon: DollarSign },
        { title: "Messages", url: "/school/messages", icon: MessageSquare },
      ],
    },
    secondary: {
      label: "Information",
      items: [
        { title: "Announcements", url: "/school/announcements", icon: Bell },
        { title: "Settings", url: "/settings", icon: Settings },
      ],
    },
    footer: [],
  },
  teacher: {
    primary: {
      label: "Teacher Portal",
      items: [
        { title: "Dashboard", url: "/school/dashboard", icon: Home },
        { title: "My Schedule", url: "/school/teacher/schedule", icon: Clock },
        { title: "Attendance", url: "/school/attendance", icon: UserCheck },
        { title: "Grades", url: "/school/grades", icon: TrendingUp },
        { title: "Messages", url: "/school/messages", icon: MessageSquare },
      ],
    },
    secondary: {
      label: "Resources",
      items: [
        { title: "Announcements", url: "/school/announcements", icon: Bell },
        { title: "Resources", url: "/school/resources", icon: FolderOpen },
        { title: "Settings", url: "/settings", icon: Settings },
      ],
    },
    footer: [],
  },
  school_student: {
    primary: {
      label: "Student Portal",
      items: [
        { title: "Dashboard", url: "/school/student-dashboard", icon: Home },
        { title: "My Timetable", url: "/school/student/timetable", icon: Clock },
        { title: "My Grades", url: "/school/student/grades", icon: TrendingUp },
      ],
    },
    secondary: {
      label: "Information",
      items: [
        { title: "Announcements", url: "/school/announcements", icon: Bell },
        { title: "Resources", url: "/school/resources", icon: FolderOpen },
        { title: "Settings", url: "/settings", icon: Settings },
      ],
    },
    footer: [],
  },
  super_admin: {
    primary: {
      label: "Super Admin",
      items: [
        { title: "Dashboard", url: "/super-admin", icon: Crown },
        { title: "Live Activity", url: "/super-admin/activity-feed", icon: Activity },
        { title: "Active Sessions", url: "/super-admin/active-sessions", icon: Monitor },
        { title: "Security Events", url: "/super-admin/security-events", icon: ShieldAlert },
        { title: "Impersonation Logs", url: "/super-admin/impersonation-logs", icon: Shield },
        { title: "Platform Analytics", url: "/super-admin/analytics", icon: BarChart3 },
      ],
    },
    secondary: {
      label: "Platform Management",
      items: [
        { title: "All Users", url: "/super-admin/users", icon: Users },
        { title: "Institutions", url: "/super-admin/institutions", icon: Building2 },
      ],
    },
    footer: [
      { 
        title: "SMS Management", 
        url: "#", 
        icon: School,
        children: [
          { title: "All Schools", url: "/super-admin/schools", icon: School },
          { title: "Subscriptions", url: "/super-admin/subscriptions", icon: CreditCard },
          { title: "Subscription Plans", url: "/super-admin/subscription-plans", icon: Layers },
        ],
      },
      { title: "System Settings", url: "/super-admin/settings", icon: Settings },
    ],
  },
  school_admin: {
    primary: {
      label: "School Management",
      items: [
        { title: "Dashboard", url: "/school/dashboard", icon: Home },
        { title: "Students", url: "/school/students", icon: GraduationCap },
        { title: "Teachers", url: "/school/teachers", icon: Users },
        { title: "Parents", url: "/school/parents", icon: Users2 },
        { title: "Family Links", url: "/school/parent-student-links", icon: Link2 },
        { title: "Classes", url: "/school/classes", icon: BookOpen },
        { title: "Subjects", url: "/school/subjects", icon: FileText },
        { title: "Terms", url: "/school/terms", icon: Calendar },
      ],
    },
    secondary: {
      label: "Academic & Finance",
      items: [
        { 
          title: "Attendance", 
          url: "#", 
          icon: UserCheck,
          children: [
            { title: "Mark Attendance", url: "/school/attendance", icon: UserCheck },
            { title: "Reports", url: "/school/attendance/reports", icon: BarChart3 },
          ],
        },
        { 
          title: "Grades", 
          url: "#", 
          icon: TrendingUp,
          children: [
            { title: "Enter Grades", url: "/school/grades", icon: TrendingUp },
            { title: "Term Results", url: "/school/grades/results", icon: Calculator },
            { title: "Report Cards", url: "/school/grades/report-cards", icon: FileSpreadsheet },
          ],
        },
        { title: "Fees", url: "/school/fees", icon: DollarSign },
        { title: "Timetable", url: "/school/timetable", icon: Clock },
        { title: "Announcements", url: "/school/announcements", icon: Bell },
        { title: "Resources", url: "/school/resources", icon: FolderOpen },
        { title: "Analytics", url: "/school/analytics", icon: BarChart3 },
        { title: "Subscription", url: "/school/subscription", icon: CreditCard },
        { title: "School Settings", url: "/school/settings", icon: Settings },
      ],
    },
    footer: [],
  },
};

export function isPathActive(itemPath: string, currentPath: string): boolean {
  return currentPath === itemPath;
}

export function isPathWithin(basePath: string, currentPath: string): boolean {
  return currentPath.startsWith(basePath);
}
