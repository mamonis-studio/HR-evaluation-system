// ===== エンティティ型 =====

export interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  plan: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  isActive: boolean;
}

export interface Position {
  id: number;
  code: number;
  name: string;
  sortOrder: number;
  canViewAll: boolean;
  canEvaluate: boolean;
  canFinalApprove: boolean;
}

export interface Department {
  id: number;
  name: string;
  isActive: boolean;
}

export interface UserInfo {
  id: number;
  name: string;
  email: string;
  positionName: string | null;
  departmentName: string | null;
  canEvaluate: boolean;
  canViewAll: boolean;
  canFinalApprove: boolean;
}

export interface User {
  id: number;
  name: string;
  nameKana: string | null;
  email: string;
  department: Department | null;
  position: Position | null;
  isActive: boolean;
  canEvaluate: boolean;
}

export interface FiscalYear {
  id: number;
  year: number;
  isCurrent: boolean;
  goalSettingOpen: boolean;
  summerSelfOpen: boolean;
  summerEvalOpen: boolean;
  winterSelfOpen: boolean;
  winterEvalOpen: boolean;
}

export interface Goal {
  id: number;
  userId: number;
  fiscalYearId: number;
  goalText: string;
  summerSelfAssessment: string | null;
  winterSelfAssessment: string | null;
  sortOrder: number;
}

export type EvaluationStatus =
  | 'NOT_STARTED'
  | 'SELF_SUBMITTED'
  | 'EVALUATOR_SUBMITTED'
  | 'MANAGER_APPROVED'
  | 'DIRECTOR_EVALUATED'
  | 'FINALIZED';

export type EvaluationPeriod = 'SUMMER' | 'WINTER';

export interface Evaluation {
  id: number;
  userId: number;
  userName?: string;
  fiscalYearId: number;
  fiscalYear?: number;
  period: EvaluationPeriod;
  departmentName?: string;
  positionName?: string;
  status: EvaluationStatus;
  evaluatorId: number | null;
  evaluatorName?: string;
  evaluatorGrade: string | null;
  evaluatorComment: string | null;
  evaluatedAt: string | null;
  managerId: number | null;
  managerName?: string;
  managerGrade: string | null;
  managerComment: string | null;
  managerApprovedAt: string | null;
  directorId: number | null;
  directorGrade: string | null;
  directorComment: string | null;
  directorEvaluatedAt: string | null;
  finalizedAt: string | null;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

// ===== APIレスポンス型 =====

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
}

export interface DashboardCounts {
  pendingEvaluations: number;
  managerPending: number;
  directorPending: number;
  finalizePending: number;
}

// ===== 定数 =====

export const STATUS_LABELS: Record<EvaluationStatus, string> = {
  NOT_STARTED: '未開始',
  SELF_SUBMITTED: '自己評価提出済',
  EVALUATOR_SUBMITTED: '評価者評価済',
  MANAGER_APPROVED: '管理者確認済',
  DIRECTOR_EVALUATED: '役員評価済',
  FINALIZED: '最終確定',
};

export const PERIOD_LABELS: Record<EvaluationPeriod, string> = {
  SUMMER: '夏評価',
  WINTER: '冬評価',
};

export const GRADES = ['SS', 'S', 'A+', 'A', 'B', 'C', 'D'] as const;
