import {
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  DatabaseBackup,
  LayoutDashboard,
  MessagesSquare,
  Target,
  User,
  Users,
} from 'lucide-react';

export const adminNav = [
  { to: '/tpo/dashboard', label: 'Placement Intelligence Center', icon: LayoutDashboard },
  { to: '/tpo/ingest', label: 'AI Data Ingestion', icon: DatabaseBackup },
  { to: '/tpo/students', label: 'Student Intelligence', icon: Users },
  { to: '/tpo/drives', label: 'Hiring Pipeline', icon: BriefcaseBusiness },
  { to: '/tpo/prediction', label: 'Placement Predictor AI', icon: BrainCircuit },
  { to: '/tpo/reports', label: 'Intelligence Reports', icon: BarChart3 },
];

export const studentNav = [
  { to: '/student/dashboard', label: 'Career Command Center', icon: LayoutDashboard },
  { to: '/student/opportunities', label: 'Opportunity Hub', icon: Target },
  { to: '/student/mock-interview', label: 'AI Interview Arena', icon: MessagesSquare },
  { to: '/student/profile', label: 'Profile Intelligence', icon: User },
];

export function getNavItemsForRole(role) {
  return role === 'admin' ? adminNav : studentNav;
}
