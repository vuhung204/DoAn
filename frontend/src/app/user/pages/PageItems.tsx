import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';

import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Heart,
  ShoppingCart,
  Loader2,
  Star,
  Sparkles,
  BadgePercent,
  Eye,
  X,
} from 'lucide-react';

import api, { ENDPOINTS } from '../config/apiConfig';
import { notifyCartUpdated } from '../context/AuthContext';

// ============================================================
// Types
// ============================================================
interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  basePrice: number;
  salePrice: number | null;
  brandName: string;
  categoryName: string;
  primaryImage: string;
  cpu: string;
  ram: string;
  storage: string;
  display: string;
  avgRating: number;
  reviewCount: number;
}

interface Brand {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
  parentId: number | null;
  children?: Category[];
}

interface PageResponse {
  content: Product[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ============================================================
// Price ranges
// ============================================================
const PRICE_RANGES = [
  { label: 'Dưới 10 triệu', min: 0, max: 10_000_000 },
  { label: '10 - 20 triệu', min: 10_000_000, max: 20_000_000 },
  { label: '20 - 30 triệu', min: 20_000_000, max: 30_000_000 },
  { label: '30 - 50 triệu', min: 30_000_000, max: 50_000_000 },
  { label: 'Trên 50 triệu', min: 50_000_000, max: 999_999_999 },
];

// ============================================================
// Helpers
// ============================================================
function flattenCategories(cats: Category[]): Category[] {
  const result: Category[] = [];

  function walk(list: Category[]) {
    for (const c of list) {
      result.push(c);
      if (c.children?.length) walk(c.children);
    }
  }

  walk(cats);

  return result;
}

// ============================================================
// Main
// ============================================================
export default function PageItems() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ==========================================================
  // States
  // ==========================================================
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);

  const [selectedBrandIds, setSelectedBrandIds] = useState<number[]>(() => {
    const b = searchParams.get('brandId');
    return b ? [Number(b)] : [];
  });

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(() => {
    const c = searchParams.get('categoryId');
    return c ? Number(c) : null;
  });

  const [selectedPriceRange, setSelectedPriceRange] =
    useState<number | null>(null);

  const [keyword, setKeyword] = useState<string>(
    () => searchParams.get('keyword') ?? ''
  );

  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(0);

  const PAGE_SIZE = 15;

  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());
  const [addingToCart, setAddingToCart] = useState<number | null>(null);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [openSections, setOpenSections] = useState({
    brand: true,
    category: true,
    price: true,
  });

  // ==========================================================
  // Load initial data
  // ==========================================================
  useEffect(() => {
    api.get(ENDPOINTS.CATALOG.BRANDS).then((res) => setBrands(res.data));

    api.get(ENDPOINTS.CATALOG.CATEGORIES).then((res) => {
      setCategories(flattenCategories(res.data));
    });

    const token =
      localStorage.getItem('authToken') ||
      sessionStorage.getItem('authToken');

    if (token) {
      api
        .get<{ productId: number }[]>('/wishlist')
        .then((res) =>
          setWishlistIds(new Set(res.data.map((w) => w.productId)))
        )
        .catch(() => {});
    }
  }, []);

  // ==========================================================
  // Sync URL
  // ==========================================================
  useEffect(() => {
    const categoryId = searchParams.get('categoryId');
    const brandId = searchParams.get('brandId');
    const kw = searchParams.get('keyword');

    setSelectedCategoryId(categoryId ? Number(categoryId) : null);
    setSelectedBrandIds(brandId ? [Number(brandId)] : []);
    setKeyword(kw ?? '');
    setCurrentPage(0);
  }, [searchParams]);

  // ==========================================================
  // Fetch products
  // ==========================================================
  useEffect(() => {
    fetchProducts();
  }, [
    selectedBrandIds,
    selectedCategoryId,
    selectedPriceRange,
    sortBy,
    currentPage,
    keyword,
  ]);

  const fetchProducts = async () => {
    setLoading(true);

    try {
      const priceRange =
        selectedPriceRange !== null
          ? PRICE_RANGES[selectedPriceRange]
          : null;

      const params: Record<string, any> = {
        page: currentPage,
        size: PAGE_SIZE,
        sort: sortBy,
      };

      if (selectedBrandIds.length > 0)
        params.brandId = selectedBrandIds[0];

      if (selectedCategoryId)
        params.categoryId = selectedCategoryId;

      if (keyword.trim())
        params.keyword = keyword.trim();

      if (priceRange) {
        params.minPrice = priceRange.min;
        params.maxPrice = priceRange.max;
      }

      const res = await api.get<PageResponse>(
        ENDPOINTS.CATALOG.PRODUCTS,
        { params }
      );

      setProducts(res.data.content);
      setTotalElements(res.data.totalElements);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // Helpers
  // ==========================================================
  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleBrand = (id: number) => {
    setCurrentPage(0);

    setSelectedBrandIds((prev) =>
      prev.includes(id)
        ? prev.filter((b) => b !== id)
        : [...prev, id]
    );
  };

  const handleCategoryChange = (id: number) => {
    setCurrentPage(0);

    setSelectedCategoryId((prev) =>
      prev === id ? null : id
    );
  };

  const handlePriceRange = (idx: number) => {
    setCurrentPage(0);

    setSelectedPriceRange((prev) =>
      prev === idx ? null : idx
    );
  };

  const handleSort = (value: string) => {
    setCurrentPage(0);
    setSortBy(value);
  };

  const resetFilters = () => {
    setSelectedBrandIds([]);
    setSelectedCategoryId(null);
    setSelectedPriceRange(null);
    setKeyword('');
    setSortBy('newest');
    setCurrentPage(0);
  };

  // ==========================================================
  // Cart
  // ==========================================================
  const handleAddToCart = async (productId: number) => {
    const token =
      localStorage.getItem('authToken') ||
      sessionStorage.getItem('authToken');

    if (!token) {
      navigate('/login');
      return;
    }

    setAddingToCart(productId);

    try {
      const res = await fetch(
        `${(import.meta as any).env?.VITE_API_URL || 'http://localhost:9765'
        }/api/cart`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId,
            quantity: 1,
          }),
        }
      );

      if (res.ok) notifyCartUpdated();
    } catch { }
    finally {
      setAddingToCart(null);
    }
  };

  // ==========================================================
  // Wishlist
  // ==========================================================
  const handleWishlist = async (productId: number) => {
    const token =
      localStorage.getItem('authToken') ||
      sessionStorage.getItem('authToken');

    if (!token) {
      navigate('/login');
      return;
    }

    const inWishlist = wishlistIds.has(productId);

    setWishlistIds((prev) => {
      const next = new Set(prev);

      inWishlist
        ? next.delete(productId)
        : next.add(productId);

      return next;
    });

    try {
      if (inWishlist)
        await api.delete(`/wishlist/${productId}`);
      else
        await api.post(`/wishlist/${productId}`);
    } catch {
      setWishlistIds((prev) => {
        const next = new Set(prev);

        inWishlist
          ? next.add(productId)
          : next.delete(productId);

        return next;
      });
    }
  };

  // ==========================================================
  // Helpers
  // ==========================================================
  const startItem = currentPage * PAGE_SIZE + 1;

  const endItem = Math.min(
    (currentPage + 1) * PAGE_SIZE,
    totalElements
  );

  const selectedCategoryName = selectedCategoryId
    ? categories.find((c) => c.id === selectedCategoryId)?.name
    : null;

  // ==========================================================
  // Render
  // ==========================================================
  return (
    <div className="min-h-screen bg-[#f6f7fb] flex flex-col">
      <Header />

      <div className="flex flex-1">
        {/* ================================================= */}
        {/* Sidebar */}
        {/* ================================================= */}
        <aside
          className="
            hidden
            xl:block
            w-[300px]
            shrink-0
            border-r
            border-gray-200
            bg-white/90
            backdrop-blur
            px-6
            py-6
            sticky
            top-0
            h-screen
            overflow-y-auto
          "
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-black text-xl text-gray-900">
                Bộ lọc
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Tìm laptop phù hợp
              </p>
            </div>

            <button
              onClick={resetFilters}
              className="
                text-xs
                font-semibold
                text-red-600
                hover:text-red-700
              "
            >
              Reset
            </button>
          </div>

          {/* Category */}
          <div className="mb-7">
            <button
              onClick={() => toggleSection('category')}
              className="flex items-center justify-between w-full mb-4"
            >
              <span className="font-bold text-sm">
                Danh mục
              </span>

              {openSections.category
                ? <ChevronUp className="size-4" />
                : <ChevronDown className="size-4" />
              }
            </button>

            {openSections.category && (
              <div className="space-y-3">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="
                      flex
                      items-center
                      gap-3
                    "
                  >
                    <Checkbox
                      id={`cat-${cat.id}`}
                      checked={selectedCategoryId === cat.id}
                      onCheckedChange={() =>
                        handleCategoryChange(cat.id)
                      }
                    />

                    <Label
                      htmlFor={`cat-${cat.id}`}
                      className={`
                        cursor-pointer
                        text-sm
                        transition-colors
                        ${selectedCategoryId === cat.id
                          ? 'text-red-600 font-semibold'
                          : 'text-gray-600 hover:text-red-600'
                        }
                      `}
                    >
                      {cat.name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Brand */}
          <div className="mb-7">
            <button
              onClick={() => toggleSection('brand')}
              className="flex items-center justify-between w-full mb-4"
            >
              <span className="font-bold text-sm">
                Thương hiệu
              </span>

              {openSections.brand
                ? <ChevronUp className="size-4" />
                : <ChevronDown className="size-4" />
              }
            </button>

            {openSections.brand && (
              <div className="space-y-3">
                {brands.map((brand) => (
                  <div
                    key={brand.id}
                    className="flex items-center gap-3"
                  >
                    <Checkbox
                      id={`brand-${brand.id}`}
                      checked={selectedBrandIds.includes(brand.id)}
                      onCheckedChange={() =>
                        toggleBrand(brand.id)
                      }
                    />

                    <Label
                      htmlFor={`brand-${brand.id}`}
                      className="
                        text-sm
                        cursor-pointer
                        text-gray-600
                        hover:text-red-600
                        transition-colors
                      "
                    >
                      {brand.name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Price */}
          <div>
            <button
              onClick={() => toggleSection('price')}
              className="flex items-center justify-between w-full mb-4"
            >
              <span className="font-bold text-sm">
                Khoảng giá
              </span>

              {openSections.price
                ? <ChevronUp className="size-4" />
                : <ChevronDown className="size-4" />
              }
            </button>

            {openSections.price && (
              <div className="space-y-3">
                {PRICE_RANGES.map((range, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3"
                  >
                    <Checkbox
                      id={`price-${idx}`}
                      checked={selectedPriceRange === idx}
                      onCheckedChange={() =>
                        handlePriceRange(idx)
                      }
                    />

                    <Label
                      htmlFor={`price-${idx}`}
                      className="
                        text-sm
                        cursor-pointer
                        text-gray-600
                        hover:text-red-600
                        transition-colors
                      "
                    >
                      {range.label}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ================================================= */}
        {/* Main */}
        {/* ================================================= */}
        <main className="flex-1 px-5 lg:px-8 py-6">
          {/* Top Banner */}
          <div
            className="
              relative
              overflow-hidden
              rounded-3xl
              bg-gradient-to-r
              from-red-600
              via-red-500
              to-orange-500
              p-8
              mb-8
              shadow-xl
            "
          >
            <div className="relative z-10 max-w-2xl">
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  bg-white/15
                  px-4
                  py-1.5
                  text-sm
                  text-white
                  backdrop-blur
                  mb-4
                "
              >
                <Sparkles className="size-4" />
                Công nghệ mới nhất 2026
              </div>

              <h1
                className="
                  text-3xl
                  lg:text-5xl
                  font-black
                  text-white
                  leading-tight
                "
              >
                {selectedCategoryName
                  ? selectedCategoryName
                  : keyword
                    ? `Kết quả: "${keyword}"`
                    : 'Laptop Gaming & Văn Phòng'}
              </h1>

              <p
                className="
                  text-red-50
                  mt-4
                  text-lg
                  leading-relaxed
                "
              >
                Hàng chính hãng • Giá tốt • Bảo hành uy tín
              </p>
            </div>

            <div
              className="
                absolute
                -right-16
                -top-10
                size-72
                rounded-full
                bg-white/10
              "
            />

            <div
              className="
                absolute
                right-10
                bottom-0
                size-40
                rounded-full
                bg-white/10
              "
            />
          </div>

          {/* Toolbar */}
          <div
            className="
              bg-white
              rounded-2xl
              border
              border-gray-200
              p-4
              mb-6
              shadow-sm
            "
          >
            <div
              className="
                flex
                flex-col
                lg:flex-row
                lg:items-center
                lg:justify-between
                gap-4
              "
            >
              <div>
                <h2 className="font-bold text-lg text-gray-900">
                  Danh sách sản phẩm
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {loading
                    ? 'Đang tải sản phẩm...'
                    : `Hiển thị ${totalElements > 0 ? startItem : 0}–${endItem} của ${totalElements} sản phẩm`
                  }
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <Select
                  value={sortBy}
                  onValueChange={handleSort}
                >
                  <SelectTrigger className="w-[190px] h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="newest">
                      Mới nhất
                    </SelectItem>

                    <SelectItem value="popular">
                      Phổ biến nhất
                    </SelectItem>

                    <SelectItem value="price_asc">
                      Giá tăng dần
                    </SelectItem>

                    <SelectItem value="price_desc">
                      Giá giảm dần
                    </SelectItem>
                  </SelectContent>
                </Select>

                <div
                  className="
                    flex
                    items-center
                    gap-1
                    rounded-xl
                    border
                    border-gray-200
                    p-1
                  "
                >
                  <Button
                    size="icon"
                    variant={viewMode === 'grid'
                      ? 'default'
                      : 'ghost'
                    }
                    className={`
                      rounded-lg
                      ${viewMode === 'grid'
                        ? 'bg-red-600 hover:bg-red-700'
                        : ''
                      }
                    `}
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="size-4" />
                  </Button>

                  <Button
                    size="icon"
                    variant={viewMode === 'list'
                      ? 'default'
                      : 'ghost'
                    }
                    className={`
                      rounded-lg
                      ${viewMode === 'list'
                        ? 'bg-red-600 hover:bg-red-700'
                        : ''
                      }
                    `}
                    onClick={() => setViewMode('list')}
                  >
                    <List className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {(selectedCategoryId ||
            selectedBrandIds.length > 0 ||
            selectedPriceRange !== null ||
            keyword) && (
              <div className="flex flex-wrap gap-3 mb-6">
                {keyword && (
                  <button
                    onClick={() => setKeyword('')}
                    className="
                    flex
                    items-center
                    gap-2
                    rounded-full
                    bg-white
                    border
                    border-red-200
                    px-4
                    py-2
                    text-sm
                    font-medium
                    text-red-600
                    hover:bg-red-50
                    transition-colors
                  "
                  >
                    🔍 {keyword}
                    <X className="size-3" />
                  </button>
                )}

                {selectedCategoryId && selectedCategoryName && (
                  <button
                    onClick={() => setSelectedCategoryId(null)}
                    className="
                    flex
                    items-center
                    gap-2
                    rounded-full
                    bg-white
                    border
                    border-red-200
                    px-4
                    py-2
                    text-sm
                    font-medium
                    text-red-600
                    hover:bg-red-50
                    transition-colors
                  "
                  >
                    📂 {selectedCategoryName}
                    <X className="size-3" />
                  </button>
                )}

                {selectedPriceRange !== null && (
                  <button
                    onClick={() => setSelectedPriceRange(null)}
                    className="
                    flex
                    items-center
                    gap-2
                    rounded-full
                    bg-white
                    border
                    border-red-200
                    px-4
                    py-2
                    text-sm
                    font-medium
                    text-red-600
                    hover:bg-red-50
                    transition-colors
                  "
                  >
                    💰 {PRICE_RANGES[selectedPriceRange].label}
                    <X className="size-3" />
                  </button>
                )}
              </div>
            )}

          {/* Loading */}
          {loading && (
            <div
              className="
                grid
                grid-cols-2
                md:grid-cols-3
                xl:grid-cols-5
                gap-5
              "
            >
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div
                  key={i}
                  className="
                    h-[420px]
                    rounded-3xl
                    bg-white
                    animate-pulse
                  "
                />
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && products.length === 0 && (
            <div
              className="
                bg-white
                rounded-3xl
                border
                border-gray-200
                py-24
                text-center
              "
            >
              <div className="text-6xl mb-4">😢</div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Không tìm thấy sản phẩm
              </h3>

              <p className="text-gray-500 mb-6">
                Hãy thử thay đổi bộ lọc tìm kiếm
              </p>

              <Button
                onClick={resetFilters}
                className="bg-red-600 hover:bg-red-700"
              >
                Xóa bộ lọc
              </Button>
            </div>
          )}

          {/* Products */}
          {!loading && products.length > 0 && (
            <div
              className={
                viewMode === 'grid'
                  ? `
                    grid
                    grid-cols-2
                    md:grid-cols-3
                    lg:grid-cols-4
                    2xl:grid-cols-5
                    gap-5
                    mb-10
                  `
                  : 'flex flex-col gap-4 mb-10'
              }
            >
              {products.map((p) => {
                const price = p.salePrice ?? p.basePrice;

                const discount =
                  p.salePrice
                    ? Math.round(
                      ((p.basePrice - p.salePrice) /
                        p.basePrice) *
                      100
                    )
                    : 0;

                const inWishlist =
                  wishlistIds.has(p.id);

                const isAdding =
                  addingToCart === p.id;

                return (
                  <div
                    key={p.id}
                    className="
                      group
                      relative
                      overflow-hidden
                      rounded-3xl
                      border
                      border-gray-200
                      bg-white
                      transition-all
                      duration-500
                      hover:-translate-y-1
                      hover:border-red-200
                      hover:shadow-2xl
                    "
                  >
                    {/* Image */}
                    <div
                      className="
                        relative
                        overflow-hidden
                        bg-gradient-to-b
                        from-gray-50
                        to-white
                      "
                    >
                      <Link to={`/product/${p.id}`}>
                        <img
                          src={
                            p.primaryImage ||
                            'https://placehold.co/600x400'
                          }
                          alt={p.name}
                          className="
                            h-52
                            w-full
                            object-contain
                            p-5
                            transition-transform
                            duration-500
                            group-hover:scale-105
                          "
                        />
                      </Link>

                      {/* Discount */}
                      {discount > 0 && (
                        <div
                          className="
                            absolute
                            left-4
                            top-4
                            rounded-full
                            bg-red-600
                            px-3
                            py-1
                            text-xs
                            font-bold
                            text-white
                            shadow-lg
                          "
                        >
                          -{discount}%
                        </div>
                      )}

                      {/* Wishlist */}
                      <button
                        onClick={() =>
                          handleWishlist(p.id)
                        }
                        className="
                          absolute
                          right-4
                          top-4
                          flex
                          size-10
                          items-center
                          justify-center
                          rounded-full
                          bg-white/90
                          backdrop-blur
                          shadow-md
                          transition-all
                          duration-300
                          hover:scale-110
                        "
                      >
                        <Heart
                          className={`
                            size-4
                            transition-colors
                            ${inWishlist
                              ? 'fill-red-500 text-red-500'
                              : 'text-gray-400'
                            }
                          `}
                        />
                      </button>

                      {/* Quick View */}
                      <Link
                        to={`/product/${p.id}`}
                        className="
                          absolute
                          bottom-4
                          left-1/2
                          flex
                          -translate-x-1/2
                          translate-y-5
                          items-center
                          gap-2
                          rounded-full
                          bg-black/80
                          px-4
                          py-2
                          text-xs
                          font-semibold
                          text-white
                          opacity-0
                          backdrop-blur
                          transition-all
                          duration-300
                          group-hover:translate-y-0
                          group-hover:opacity-100
                        "
                      >
                        <Eye className="size-3.5" />
                        Xem nhanh
                      </Link>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      {/* Brand */}
                      <div className="mb-2 flex items-center justify-between">
                        <span
                          className="
                            text-[11px]
                            font-bold
                            uppercase
                            tracking-wider
                            text-red-600
                          "
                        >
                          {p.brandName}
                        </span>

                        <div className="flex items-center gap-1">
                          <Star
                            className="
                              size-3.5
                              fill-yellow-400
                              text-yellow-400
                            "
                          />

                          <span
                            className="
                              text-xs
                              font-medium
                              text-gray-600
                            "
                          >
                            {p.avgRating?.toFixed(1) || '0.0'}
                          </span>
                        </div>
                      </div>

                      {/* Name */}
                      <Link to={`/product/${p.id}`}>
                        <h3
                          className="
                            min-h-[48px]
                            line-clamp-2
                            text-sm
                            font-bold
                            leading-6
                            text-gray-900
                            transition-colors
                            duration-300
                            group-hover:text-red-600
                          "
                        >
                          {p.name}
                        </h3>
                      </Link>

                      {/* Specs */}
                      <div className="mt-4 space-y-2">
                        {p.cpu && (
                          <div
                            className="
                              rounded-xl
                              bg-gray-50
                              px-3
                              py-2
                              text-[11px]
                              text-gray-600
                              truncate
                            "
                          >
                            CPU: {p.cpu}
                          </div>
                        )}

                        {p.ram && (
                          <div
                            className="
                              rounded-xl
                              bg-gray-50
                              px-3
                              py-2
                              text-[11px]
                              text-gray-600
                              truncate
                            "
                          >
                            RAM: {p.ram}
                          </div>
                        )}
                      </div>

                      {/* Price */}
                      <div className="mt-5">
                        <div className="flex flex-wrap items-end gap-2">
                          <span
                            className="
                              text-2xl
                              font-black
                              tracking-tight
                              text-red-600
                            "
                          >
                            {price.toLocaleString('vi-VN')}₫
                          </span>

                          {p.salePrice && (
                            <span
                              className="
                                mb-1
                                text-xs
                                text-gray-400
                                line-through
                              "
                            >
                              {p.basePrice.toLocaleString(
                                'vi-VN'
                              )}₫
                            </span>
                          )}
                        </div>

                        {discount > 0 && (
                          <p
                            className="
                              mt-1
                              flex
                              items-center
                              gap-1
                              text-[11px]
                              font-medium
                              text-green-600
                            "
                          >
                            <BadgePercent className="size-3" />
                            Tiết kiệm{' '}
                            {(
                              p.basePrice - price
                            ).toLocaleString('vi-VN')}
                            ₫
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-5 flex gap-2">
                        <Button
                          onClick={() =>
                            handleAddToCart(p.id)
                          }
                          disabled={isAdding}
                          className="
                            h-11
                            flex-1
                            rounded-2xl
                            bg-red-600
                            font-semibold
                            text-white
                            shadow-sm
                            transition-all
                            duration-300
                            hover:bg-red-700
                            hover:shadow-lg
                          "
                        >
                          {isAdding ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <>
                              <ShoppingCart className="mr-2 size-4" />
                              Mua ngay
                            </>
                          )}
                        </Button>

                        <Link to={`/product/${p.id}`}>
                          <Button
                            variant="outline"
                            className="
                              h-11
                              rounded-2xl
                              border-gray-200
                              hover:border-red-300
                              hover:bg-red-50
                              hover:text-red-600
                            "
                          >
                            <Eye className="size-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl"
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.max(0, prev - 1)
                  )
                }
                disabled={currentPage === 0}
              >
                <ChevronLeft className="size-4" />
              </Button>

              {Array.from(
                { length: totalPages },
                (_, i) => i
              ).map((page) => (
                <Button
                  key={page}
                  size="icon"
                  variant={
                    currentPage === page
                      ? 'default'
                      : 'outline'
                  }
                  onClick={() =>
                    setCurrentPage(page)
                  }
                  className={`
                    rounded-xl
                    ${currentPage === page
                      ? 'bg-red-600 hover:bg-red-700'
                      : ''
                    }
                  `}
                >
                  {page + 1}
                </Button>
              ))}

              <Button
                variant="outline"
                size="icon"
                className="rounded-xl"
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(
                      totalPages - 1,
                      prev + 1
                    )
                  )
                }
                disabled={
                  currentPage === totalPages - 1
                }
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}