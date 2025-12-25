export interface SearchDocument {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  type: 'product' | 'category' | 'general';
  metadata: Record<string, unknown>;
}