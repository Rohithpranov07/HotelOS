import type { TaskType } from '../stores/staff.store';

export type StaffRole =
  | 'manager'
  | 'front_desk'
  | 'housekeeping'
  | 'room_service'
  | 'concierge'
  | 'staff';

const ALL_TYPES: TaskType[] = [
  'food',
  'beverage',
  'housekeeping',
  'laundry',
  'maintenance',
  'concierge',
];

const ROLE_TASK_TYPES: Record<StaffRole, TaskType[]> = {
  manager: ALL_TYPES,
  front_desk: ALL_TYPES,
  housekeeping: ['housekeeping', 'laundry', 'maintenance'],
  room_service: ['food', 'beverage'],
  concierge: ['concierge', 'maintenance'],
  staff: ALL_TYPES,
};

const ROLE_LABEL: Record<StaffRole, string> = {
  manager: 'Duty Manager',
  front_desk: 'Front Desk',
  housekeeping: 'Housekeeping',
  room_service: 'Room Service',
  concierge: 'Concierge',
  staff: 'Team Member',
};

export function normalizeRole(role: string | null | undefined): StaffRole {
  const r = (role ?? 'staff').toLowerCase();
  if (r === 'manager' || r === 'front_desk' || r === 'housekeeping' || r === 'room_service' || r === 'concierge') {
    return r;
  }
  return 'staff';
}

export function allowedTaskTypes(role: string | null | undefined): TaskType[] {
  return ROLE_TASK_TYPES[normalizeRole(role)];
}

export function canSeeAlerts(role: string | null | undefined): boolean {
  return normalizeRole(role) === 'manager';
}

export function canSeeAllTasks(role: string | null | undefined): boolean {
  const r = normalizeRole(role);
  return r === 'manager' || r === 'front_desk';
}

export function roleLabel(role: string | null | undefined): string {
  return ROLE_LABEL[normalizeRole(role)];
}
