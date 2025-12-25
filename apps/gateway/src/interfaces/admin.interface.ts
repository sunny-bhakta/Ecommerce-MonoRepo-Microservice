export interface AdminAction {
  id: string;
  targetType: string;
  targetId: string;
  actionType: string;
  status: string;
  note?: string;
  resolutionNote?: string;
  createdAt: string;
  updatedAt: string;
}