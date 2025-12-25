export interface Review {
  id: string;
  userId: string;
  targetId: string;
  targetType: 'product' | 'vendor';
  rating: number;
  comment?: string;
  status: 'pending' | 'approved' | 'rejected';
  flagged: boolean;
  flagReason?: string;
  moderatorNote?: string;
  createdAt: string;
  updatedAt: string;
}