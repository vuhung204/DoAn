import { Category } from '../types/category';

export const initialCategories: Category[] = [
  {
    id: 1,
    name: 'Laptop',
    slug: 'laptop',
    parentId: null,
    order: 1,
    visible: true,
    productCount: 6,
  },
  {
    id: 2,
    name: 'Laptop Gaming',
    slug: 'laptop-gaming',
    parentId: 1,
    order: 1,
    visible: true,
    productCount: 2,
  },
  {
    id: 3,
    name: 'Gaming Tầm Trung',
    slug: 'gaming-tam-trung',
    parentId: 2,
    order: 1,
    visible: true,
    productCount: 1,
  },
  {
    id: 4,
    name: 'Gaming Cao Cấp',
    slug: 'gaming-cao-cap',
    parentId: 2,
    order: 2,
    visible: true,
    productCount: 1,
  },
  {
    id: 5,
    name: 'Laptop Văn Phòng',
    slug: 'laptop-van-phong',
    parentId: 1,
    order: 2,
    visible: true,
    productCount: 1,
  },
  {
    id: 6,
    name: 'Ultrabook / Mỏng nhẹ',
    slug: 'ultrabook-mong-nhe',
    parentId: 1,
    order: 3,
    visible: true,
    productCount: 2,
  },
  {
    id: 7,
    name: 'Laptop Đồ Họa',
    slug: 'laptop-do-hoa',
    parentId: 1,
    order: 4,
    visible: false,
    productCount: 1,
  },
];

export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
