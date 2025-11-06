import {
  Home,
  BookOpen,
  FileText,
  ClipboardList,
  TrendingUp,
  Users,
  Settings,
  BarChart3,
  Shield,
  Library,
  Upload,
  Newspaper,
  FolderTree,
  Tag,
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
  instructor: {
    primary: {
      label: "Main",
      items: [
        { title: "Dashboard", url: "/instructor", icon: Home },
        { title: "My Courses", url: "/instructor/courses", icon: BookOpen },
        { title: "Materials", url: "/instructor/materials", icon: FileText },
        { title: "Quizzes", url: "/instructor/quizzes", icon: ClipboardList },
      ],
    },
    secondary: {
      label: "Analytics",
      items: [
        { title: "Analytics", url: "/instructor/analytics", icon: BarChart3 },
      ],
    },
    footer: [
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
  institution: {
    primary: {
      label: "Main",
      items: [
        { title: "Dashboard", url: "/institution", icon: Home },
        { title: "Students", url: "/institution/students", icon: Users },
        { title: "Instructors", url: "/institution/instructors", icon: Users },
        { title: "Courses", url: "/institution/courses", icon: BookOpen },
      ],
    },
    secondary: {
      label: "Management",
      items: [
        { title: "Analytics", url: "/institution/analytics", icon: BarChart3 },
        { title: "Settings", url: "/institution/settings", icon: Settings },
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
        {
          title: "Blog",
          url: "/admin/blog",
          icon: Newspaper,
          children: [
            { title: "Posts", url: "/admin/blog/posts", icon: Newspaper },
            { title: "Categories", url: "/admin/blog/categories", icon: FolderTree },
            { title: "Tags", url: "/admin/blog/tags", icon: Tag },
          ],
        },
        { title: "Settings", url: "/admin/settings", icon: Settings },
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
