export interface Category {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  order: number;
  visible: boolean;
  productCount: number;
}
