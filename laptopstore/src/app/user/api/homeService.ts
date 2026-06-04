import api from './api';

// ─── Types khớp với BE DTOs ───────────────────────────────────────────────────

export interface FeaturedProduct {
  id: number;
  name: string;
  slug: string;
  brandName: string;
  categoryName: string;
  categorySlug: string;
  basePrice: number;
  salePrice: number | null;
  imageUrl: string | null;
  cpu: string | null;
  ram: string | null;
  storage: string | null;
  display: string | null;
  gpu: string | null;
  avgRating: number;
  reviewCount: number;
  totalStock: number;
}

export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
  productCount: number;
}

export interface BrandItem {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  productCount: number;
}

export interface HomePageData {
  /** Sản phẩm nổi bật */
  featuredProducts: FeaturedProduct[];
  /** 🔥 Bán chạy nhất */
  bestSellingProducts: FeaturedProduct[];
  /** ⭐ Đánh giá cao nhất */
  topRatedProducts: FeaturedProduct[];
  /** 🎮 Gaming */
  gamingProducts: FeaturedProduct[];
  /** 💼 Văn phòng */
  officeProducts: FeaturedProduct[];
  /** 🎨 Đồ họa */
  graphicsProducts: FeaturedProduct[];
  /** ✨ Ultrabook */
  ultrabookProducts: FeaturedProduct[];
  /** 🍎 MacBook */
  macbookProducts: FeaturedProduct[];

  categories: CategoryItem[];
  brands: BrandItem[];
  totalProducts: number;
}

// ─── API call ─────────────────────────────────────────────────────────────────

export async function fetchHomePageData(): Promise<HomePageData> {
  const res = await api.get<HomePageData>('/home');
  return res.data;
}

// ─── Helper: chuyển FeaturedProduct → format ProductCard ─────────────────────

export function toProductCardProps(p: FeaturedProduct) {
  const price = p.salePrice ?? p.basePrice;
  const originalPrice = p.salePrice ? p.basePrice : undefined;

  const FALLBACK_IMAGE = `https://placehold.co/400x300/e5e7eb/6b7280?text=${encodeURIComponent(p.brandName)}`;

  return {
    id: p.id,
    name: p.name,
    brand: p.brandName,
    price,
    originalPrice,
    rating: parseFloat((p.avgRating || 0).toFixed(1)),
    reviews: p.reviewCount || 0,
    image: p.imageUrl || FALLBACK_IMAGE,
    specs: {
      cpu: p.cpu || 'N/A',
      ram: p.ram || 'N/A',
      storage: p.storage || 'N/A',
      display: p.display || 'N/A',
    },
  };
}