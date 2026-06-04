export interface Product {
  id: number;
  name: string;
  sku: string;
  brand: string;
  category: string;
  originalPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  visible: boolean;
  cpu?: string;
  ram?: string;
  storage?: string;
  screen?: string;
  gpu?: string;
  os?: string;
  weight?: string;
  battery?: string;
  desc?: string;
}
