import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router';
import { Header } from '../components/Header';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import {
  ChevronRight,
  ChevronLeft,
  Search,
  X,
  SlidersHorizontal,
  Grid3x3,
  List,
  Loader2,
  Sparkles,
  Filter,
  Laptop2,
  Star,
  ShieldCheck,
} from 'lucide-react';
import api, { ENDPOINTS } from '../config/apiConfig';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ProductItem {
  id: number;
  name: string;
  brandName: string | null;
  brandId: number | null;
  price: number;
  originalPrice: number | null;
  image: string | null;
  cpu: string | null;
  ram: string | null;
  storage: string | null;
  display: string | null;
  gpu: string | null;
  avgRating: number | null;
  reviewCount: number;
}

interface BrandOption {
  id: number;
  name: string;
  slug: string;
  logoUrl: string;
}

interface SearchPageResponse {
  products: ProductItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  availableRams: string[];
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const MAX_PRICE = 80_000_000;
const DEFAULT_PRICE_RANGE: [number, number] = [0, MAX_PRICE];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function buildSearchParams(
  q: string,
  brandIds: number[],
  priceRange: [number, number],
  rams: string[],
  page: number,
  sort: string,
) {
  const params: Record<string, string> = {
    page: String(page),
    sort,
  };

  if (q) params.q = q;
  if (brandIds.length) params.brandIds = brandIds.join(',');
  if (priceRange[0] > 0) params.minPrice = String(priceRange[0]);
  if (priceRange[1] < MAX_PRICE) params.maxPrice = String(priceRange[1]);
  if (rams.length) params.rams = rams.join(',');

  return params;
}

const formatPrice = (price: number) =>
  price.toLocaleString('vi-VN') + '₫';

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';

  // ── View state ────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('popular');
  const [showFilters, setShowFilters] = useState(true);
  const [page, setPage] = useState(0);

  // ── Filter state ──────────────────────────────────────────
  const [selectedBrandIds, setSelectedBrandIds] = useState<number[]>([]);
  const [priceRange, setPriceRange] =
    useState<[number, number]>(DEFAULT_PRICE_RANGE);
  const [selectedRams, setSelectedRams] = useState<string[]>([]);

  // ── Data state ────────────────────────────────────────────
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [searchResult, setSearchResult] =
    useState<SearchPageResponse | null>(null);

  const [loadingSearch, setLoadingSearch] = useState(true);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);

  // ── Debounce price ────────────────────────────────────────
  const priceRangeDebounceRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const [debouncedPriceRange, setDebouncedPriceRange] =
    useState<[number, number]>(DEFAULT_PRICE_RANGE);

  // ──────────────────────────────────────────────────────────
  // Load brands
  // ──────────────────────────────────────────────────────────

  useEffect(() => {
    api
      .get<BrandOption[]>(ENDPOINTS.CATALOG.BRANDS)
      .then((res) => setBrands(res.data))
      .catch(() => {})
      .finally(() => setLoadingBrands(false));
  }, []);

  // ──────────────────────────────────────────────────────────
  // Debounce slider
  // ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (priceRangeDebounceRef.current) {
      clearTimeout(priceRangeDebounceRef.current);
    }

    priceRangeDebounceRef.current = setTimeout(() => {
      setDebouncedPriceRange(priceRange);
    }, 400);

    return () => {
      if (priceRangeDebounceRef.current) {
        clearTimeout(priceRangeDebounceRef.current);
      }
    };
  }, [priceRange]);

  // ──────────────────────────────────────────────────────────
  // Fetch products
  // ──────────────────────────────────────────────────────────

  const fetchProducts = useCallback(async () => {
    setLoadingSearch(true);
    setSearchError(null);

    try {
      const params = buildSearchParams(
        query,
        selectedBrandIds,
        debouncedPriceRange,
        selectedRams,
        page,
        sortBy,
      );

      const res = await api.get<SearchPageResponse>(
        ENDPOINTS.CATALOG.SEARCH,
        { params }
      );

      setSearchResult(res.data);
    } catch (err: any) {
      setSearchError(
        err.response?.data?.message ??
          'Không thể tải dữ liệu. Vui lòng thử lại.'
      );
    } finally {
      setLoadingSearch(false);
    }
  }, [
    query,
    selectedBrandIds,
    debouncedPriceRange,
    selectedRams,
    page,
    sortBy,
  ]);

  useEffect(() => {
    setPage(0);
  }, [
    query,
    selectedBrandIds,
    debouncedPriceRange,
    selectedRams,
    sortBy,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ──────────────────────────────────────────────────────────
  // Filter handlers
  // ──────────────────────────────────────────────────────────

  const toggleBrand = (id: number) =>
    setSelectedBrandIds((prev) =>
      prev.includes(id)
        ? prev.filter((b) => b !== id)
        : [...prev, id]
    );

  const toggleRam = (ram: string) =>
    setSelectedRams((prev) =>
      prev.includes(ram)
        ? prev.filter((r) => r !== ram)
        : [...prev, ram]
    );

  const clearFilters = () => {
    setSelectedBrandIds([]);
    setPriceRange(DEFAULT_PRICE_RANGE);
    setSelectedRams([]);
  };

  const hasActiveFilters =
    selectedBrandIds.length > 0 ||
    selectedRams.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < MAX_PRICE;

  const ramOptions = searchResult?.availableRams?.length
    ? searchResult.availableRams
    : ['4GB', '8GB', '16GB', '32GB', '64GB'];

  // ──────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-red-600 via-rose-600 to-orange-500">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-white blur-3xl" />
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-pink-300 blur-3xl" />
        </div>

        <div className="container relative mx-auto px-4 py-10">
          {/* Breadcrumb */}
          <div className="mb-5 flex items-center gap-2 text-sm text-white/80">
            <Link
              to="/"
              className="transition hover:text-white"
            >
              Trang chủ
            </Link>

            <ChevronRight className="size-4" />

            <span className="text-white">Tìm kiếm</span>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur">
                <Sparkles className="size-4" />
                Công nghệ mới nhất 2026
              </div>

              <h1 className="mb-3 text-3xl font-black tracking-tight text-white md:text-5xl">
                {query
                  ? `Kết quả cho "${query}"`
                  : 'Khám phá sản phẩm'}
              </h1>

              <p className="max-w-2xl text-white/85">
                Tìm kiếm laptop, gaming, ultrabook và workstation
                với giao diện hiện đại và trải nghiệm mượt mà hơn.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-center backdrop-blur">
                <Laptop2 className="mx-auto mb-2 size-5 text-white" />
                <p className="text-xl font-bold text-white">
                  {searchResult?.totalElements ?? 0}
                </p>
                <p className="text-xs text-white/70">
                  Sản phẩm
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-center backdrop-blur">
                <Star className="mx-auto mb-2 size-5 text-white" />
                <p className="text-xl font-bold text-white">
                  4.9
                </p>
                <p className="text-xs text-white/70">
                  Đánh giá
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-center backdrop-blur">
                <ShieldCheck className="mx-auto mb-2 size-5 text-white" />
                <p className="text-xl font-bold text-white">
                  100%
                </p>
                <p className="text-xs text-white/70">
                  Chính hãng
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main */}
      <div className="container mx-auto px-4 py-8">
        {/* Error */}
        {searchError && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 shadow-sm">
            <X className="size-5 flex-shrink-0" />

            <span>{searchError}</span>

            <Button
              variant="outline"
              size="sm"
              className="ml-auto rounded-xl"
              onClick={fetchProducts}
            >
              Thử lại
            </Button>
          </div>
        )}

        {/* Active filters */}
        {hasActiveFilters && (
          <div className="mb-6 rounded-3xl border border-white bg-white/90 p-5 shadow-sm backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-red-600" />
                <h3 className="font-bold">
                  Bộ lọc đang áp dụng
                </h3>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl"
                onClick={clearFilters}
              >
                <X className="mr-1 size-4" />
                Xóa tất cả
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedBrandIds.map((id) => {
                const brand = brands.find((b) => b.id === id);

                return (
                  <Badge
                    key={id}
                    className="cursor-pointer rounded-full border-red-200 bg-red-50 px-4 py-1.5 text-red-700 hover:bg-red-100"
                    onClick={() => toggleBrand(id)}
                  >
                    {brand?.name}
                    <X className="ml-2 size-3" />
                  </Badge>
                );
              })}

              {selectedRams.map((ram) => (
                <Badge
                  key={ram}
                  className="cursor-pointer rounded-full border-blue-200 bg-blue-50 px-4 py-1.5 text-blue-700 hover:bg-blue-100"
                  onClick={() => toggleRam(ram)}
                >
                  RAM {ram}
                  <X className="ml-2 size-3" />
                </Badge>
              ))}

              {(priceRange[0] > 0 ||
                priceRange[1] < MAX_PRICE) && (
                <Badge
                  className="cursor-pointer rounded-full border-emerald-200 bg-emerald-50 px-4 py-1.5 text-emerald-700 hover:bg-emerald-100"
                  onClick={() =>
                    setPriceRange(DEFAULT_PRICE_RANGE)
                  }
                >
                  {formatPrice(priceRange[0])} -{' '}
                  {formatPrice(priceRange[1])}
                  <X className="ml-2 size-3" />
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-7">
          {/* Sidebar */}
          {showFilters && (
            <aside className="w-72 flex-shrink-0">
              <div className="sticky top-24 overflow-hidden rounded-3xl border border-white bg-white shadow-xl shadow-gray-100">
                {/* Header */}
                <div className="border-b bg-gradient-to-r from-gray-50 to-white p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-lg font-black">
                      <SlidersHorizontal className="size-5 text-red-600" />
                      Bộ lọc
                    </h2>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl"
                      onClick={() => setShowFilters(false)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-8 p-6">
                  {/* Brand */}
                  <div>
                    <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-gray-500">
                      Thương hiệu
                    </h3>

                    {loadingBrands ? (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Loader2 className="size-4 animate-spin" />
                        Đang tải...
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {brands.map((brand) => (
                          <label
                            key={brand.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-all hover:border-red-300 hover:bg-red-50 ${
                              selectedBrandIds.includes(brand.id)
                                ? 'border-red-500 bg-red-50'
                                : 'border-gray-100'
                            }`}
                          >
                            <Checkbox
                              checked={selectedBrandIds.includes(
                                brand.id
                              )}
                              onCheckedChange={() =>
                                toggleBrand(brand.id)
                              }
                            />

                            <span className="font-medium">
                              {brand.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div>
                    <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-gray-500">
                      Khoảng giá
                    </h3>

                    <div className="rounded-2xl border bg-gray-50 p-5">
                      <Slider
                        value={priceRange}
                        onValueChange={(v) =>
                          setPriceRange(v as [number, number])
                        }
                        min={0}
                        max={MAX_PRICE}
                        step={1_000_000}
                        className="mb-6"
                      />

                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 rounded-xl bg-white p-3 text-center shadow-sm">
                          <p className="mb-1 text-xs text-gray-500">
                            Từ
                          </p>
                          <p className="font-bold text-red-600">
                            {(priceRange[0] / 1_000_000).toFixed(
                              0
                            )}
                            tr
                          </p>
                        </div>

                        <div className="text-gray-300">—</div>

                        <div className="flex-1 rounded-xl bg-white p-3 text-center shadow-sm">
                          <p className="mb-1 text-xs text-gray-500">
                            Đến
                          </p>
                          <p className="font-bold text-red-600">
                            {(priceRange[1] / 1_000_000).toFixed(
                              0
                            )}
                            tr
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RAM */}
                  <div>
                    <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-gray-500">
                      Dung lượng RAM
                    </h3>

                    <div className="flex flex-wrap gap-2">
                      {ramOptions.map((ram) => (
                        <button
                          key={ram}
                          onClick={() => toggleRam(ram)}
                          className={`rounded-2xl border px-4 py-2 text-sm font-medium transition-all ${
                            selectedRams.includes(ram)
                              ? 'border-red-600 bg-red-600 text-white shadow-lg shadow-red-200'
                              : 'border-gray-200 bg-white hover:border-red-300 hover:bg-red-50'
                          }`}
                        >
                          {ram}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          )}

          {/* Products */}
          <main className="min-w-0 flex-1">
            {/* Toolbar */}
            <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-white bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                {!showFilters && (
                  <Button
                    variant="outline"
                    className="rounded-2xl"
                    onClick={() => setShowFilters(true)}
                  >
                    <SlidersHorizontal className="mr-2 size-4" />
                    Bộ lọc
                  </Button>
                )}

                <div className="rounded-2xl bg-gray-100 px-4 py-2 text-sm text-gray-600">
                  {loadingSearch ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Đang tải...
                    </span>
                  ) : (
                    <>
                      Hiển thị{' '}
                      <span className="font-bold text-gray-900">
                        {searchResult?.products.length ?? 0}
                      </span>{' '}
                      sản phẩm
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium shadow-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-100"
                >
                  <option value="popular">
                    🔥 Phổ biến nhất
                  </option>
                  <option value="price_asc">
                    💰 Giá tăng dần
                  </option>
                  <option value="price_desc">
                    💎 Giá giảm dần
                  </option>
                  <option value="name">
                    🔤 Tên A-Z
                  </option>
                </select>

                {/* View */}
                <div className="flex items-center gap-2 rounded-2xl bg-gray-100 p-1">
                  <Button
                    variant={
                      viewMode === 'grid'
                        ? 'default'
                        : 'ghost'
                    }
                    size="icon"
                    className={`rounded-xl ${
                      viewMode === 'grid'
                        ? 'bg-red-600 hover:bg-red-700'
                        : ''
                    }`}
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3x3 className="size-4" />
                  </Button>

                  <Button
                    variant={
                      viewMode === 'list'
                        ? 'default'
                        : 'ghost'
                    }
                    size="icon"
                    className={`rounded-xl ${
                      viewMode === 'list'
                        ? 'bg-red-600 hover:bg-red-700'
                        : ''
                    }`}
                    onClick={() => setViewMode('list')}
                  >
                    <List className="size-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Loading */}
            {loadingSearch ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[420px] animate-pulse rounded-3xl bg-white"
                  />
                ))}
              </div>
            ) : searchResult &&
              searchResult.products.length > 0 ? (
              <>
                {/* Product Grid */}
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3'
                      : 'space-y-5'
                  }
                >
                  {searchResult.products.map((product) => (
                    <div
                      key={product.id}
                      className="transition-transform duration-300 hover:-translate-y-1"
                    >
                      <ProductCard
                        id={product.id}
                        name={product.name}
                        brand={product.brandName ?? ''}
                        price={product.price}
                        originalPrice={
                          product.originalPrice ?? undefined
                        }
                        rating={
                          product.avgRating ?? undefined
                        }
                        reviews={
                          product.reviewCount ?? undefined
                        }
                        image={product.image ?? ''}
                        specs={{
                          cpu: product.cpu ?? '',
                          ram: product.ram ?? '',
                          storage: product.storage ?? '',
                          display: product.display ?? '',
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {searchResult.totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-2xl"
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>

                    {Array.from(
                      { length: searchResult.totalPages },
                      (_, i) => i
                    )
                      .filter((i) => Math.abs(i - page) <= 2)
                      .map((i) => (
                        <Button
                          key={i}
                          variant={
                            i === page
                              ? 'default'
                              : 'outline'
                          }
                          size="icon"
                          onClick={() => setPage(i)}
                          className={`rounded-2xl ${
                            i === page
                              ? 'bg-red-600 shadow-lg shadow-red-200 hover:bg-red-700'
                              : ''
                          }`}
                        >
                          {i + 1}
                        </Button>
                      ))}

                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-2xl"
                      disabled={
                        page >= searchResult.totalPages - 1
                      }
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              !searchError && (
                <div className="rounded-3xl border border-white bg-white p-16 text-center shadow-sm">
                  <div className="mx-auto mb-6 flex size-24 items-center justify-center rounded-full bg-gray-100">
                    <Search className="size-10 text-gray-400" />
                  </div>

                  <h3 className="mb-3 text-2xl font-black">
                    Không tìm thấy sản phẩm
                  </h3>

                  <p className="mx-auto mb-8 max-w-md text-gray-500">
                    Không có sản phẩm phù hợp với tìm kiếm của
                    bạn. Hãy thử từ khóa khác hoặc thay đổi bộ
                    lọc.
                  </p>

                  {hasActiveFilters && (
                    <Button
                      onClick={clearFilters}
                      className="rounded-2xl bg-red-600 px-6 hover:bg-red-700"
                    >
                      Xóa bộ lọc
                    </Button>
                  )}
                </div>
              )
            )}
          </main>
        </div>
      </div>
    </div>
  );
}