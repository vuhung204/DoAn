import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Header } from '../components/Header';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  ChevronRight,
  Truck,
  CreditCard,
  Shield,
  Headphones,
  Loader2,
  TrendingUp,
  Star,
  Gamepad2,
  Briefcase,
  Palette,
  Feather,
  Apple,
} from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Footer } from '../components/Footer';
import ProductChatBot from '../components/ProductChatBot';

import {
  fetchHomePageData,
  toProductCardProps,
  type HomePageData,
  type CategoryItem,
} from '../api/homeService';

// ───────────────── CATEGORY IMAGES ─────────────────
const CATEGORY_IMAGES: Record<string, string> = {
  'laptop-gaming':
    'https://images.unsplash.com/photo-1632603093711-0d93a0bcc6cc?w=600',
  'laptop-van-phong':
    'https://images.unsplash.com/photo-1759668358660-0d06064f0f84?w=600',
  'laptop-do-hoa':
    'https://images.unsplash.com/photo-1641430034785-47f6f91ab6cf?w=600',
  'laptop-mong-nhe':
    'https://images.unsplash.com/photo-1754928864131-21917af96dfd?w=600',
};

const DEFAULT_CATEGORY_IMAGE =
  'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600';

// ───────────────── PRODUCT SKELETON ─────────────────
function ProductSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm animate-pulse">
      <div className="p-6">
        <div className="h-52 w-full rounded-2xl bg-gray-200" />
      </div>
      <div className="space-y-3 p-5 pt-0">
        <div className="h-4 w-1/3 rounded bg-gray-200" />
        <div className="h-5 w-full rounded bg-gray-200" />
        <div className="h-5 w-2/3 rounded bg-gray-200" />
        <div className="flex gap-2 pt-2">
          <div className="h-6 w-16 rounded-xl bg-gray-200" />
          <div className="h-6 w-16 rounded-xl bg-gray-200" />
        </div>
        <div className="h-8 w-1/2 rounded bg-gray-200 mt-4" />
        <div className="h-10 w-full rounded-2xl bg-gray-200 mt-4" />
      </div>
    </div>
  );
}

// ───────────────── SECTION HEADER VARIANTS ─────────────────
interface SectionHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  linkTo?: string;
  accentClass?: string;
}

function SectionHeader({
  icon,
  title,
  subtitle,
  linkTo = '/products',
  accentClass = 'from-red-500 to-red-600',
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-10">
      <div className="flex items-center gap-4">
        {icon && (
          <div
            className={`
              size-12 rounded-2xl bg-gradient-to-br ${accentClass}
              flex items-center justify-center shadow-lg flex-shrink-0
            `}
          >
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-gray-500 text-sm">{subtitle}</p>
          )}
        </div>
      </div>

      <Link
        to={linkTo}
        className="
          hidden md:flex items-center gap-2 rounded-2xl border border-gray-200
          bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm
          hover:border-red-300 hover:text-red-600 hover:shadow-lg
          transition-all duration-300
        "
      >
        Xem tất cả
        <ChevronRight className="size-4" />
      </Link>
    </div>
  );
}

// ───────────────── PRODUCT SECTION ─────────────────
interface ProductSectionProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  products: ReturnType<typeof toProductCardProps>[];
  loading: boolean;
  bgClass?: string;
  linkTo?: string;
  accentClass?: string;
  cols?: 4 | 5;
}

function ProductSection({
  icon,
  title,
  subtitle,
  products,
  loading,
  bgClass = '',
  linkTo,
  accentClass,
  cols = 5,
}: ProductSectionProps) {
  const gridCols =
    cols === 4
      ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
      : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-5';

  return (
    <section className={`py-16 md:py-20 ${bgClass}`}>
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <SectionHeader
          icon={icon}
          title={title}
          subtitle={subtitle}
          linkTo={linkTo}
          accentClass={accentClass}
        />

        <div className={`grid ${gridCols} gap-6`}>
          {loading
            ? Array.from({ length: cols }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))
            : products
                .slice(0, cols === 4 ? 8 : 10)
                .map((p) => <ProductCard key={p.id} {...p} />)}
        </div>
      </div>
    </section>
  );
}

// ───────────────── BEST SELLER BADGE ─────────────────
function BestSellerCard({
  rank,
  product,
}: {
  rank: number;
  product: ReturnType<typeof toProductCardProps>;
}) {
  const rankColors: Record<number, string> = {
    1: 'from-yellow-400 to-orange-400',
    2: 'from-gray-300 to-gray-400',
    3: 'from-amber-600 to-amber-700',
  };

  return (
    <div className="relative">
      {rank <= 3 && (
        <div
          className={`
            absolute -top-3 -left-3 z-30 size-9 rounded-full
            bg-gradient-to-br ${rankColors[rank]}
            flex items-center justify-center
            text-white font-black text-sm shadow-lg
          `}
        >
          #{rank}
        </div>
      )}
      <ProductCard {...product} />
    </div>
  );
}

// ───────────────── TOP RATED CARD ─────────────────
function TopRatedCard({
  product,
  originalRating,
}: {
  product: ReturnType<typeof toProductCardProps>;
  originalRating: number;
}) {
  return (
    <div className="relative">
      {originalRating > 0 && (
        <div className="absolute -top-3 right-3 z-30 flex items-center gap-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
          <Star className="size-3 fill-yellow-900" />
          {originalRating.toFixed(1)}
        </div>
      )}
      <ProductCard {...product} />
    </div>
  );
}

// ───────────────── MACBOOK BANNER ─────────────────
function MacBookBanner() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-[36px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-2xl">
          <div className="grid lg:grid-cols-2 gap-10 items-center p-8 lg:p-14">
            <div className="text-white">
              <Badge className="mb-6 rounded-full bg-white/10 px-4 py-2 backdrop-blur-md text-white">
                🍎 Apple Silicon
              </Badge>
              <h2 className="text-4xl lg:text-5xl font-black leading-tight">
                MacBook
                <span className="block text-gray-300">Hiệu Năng Vượt Trội</span>
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Chip M3 mạnh mẽ, pin lên đến 22 giờ, màn Liquid Retina XDR.
                Trải nghiệm macOS mượt mà và bảo mật tuyệt đối.
              </p>
              <div className="mt-8">
                <Link to="/products?brand=apple">
                  <Button
                    size="lg"
                    className="h-14 rounded-2xl bg-white px-8 text-gray-900 font-bold hover:bg-gray-100"
                  >
                    Khám phá MacBook
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1400&q=80"
                alt="MacBook Banner"
                className="h-[380px] w-full rounded-[28px] object-cover shadow-2xl"
              />
              <div className="absolute top-6 right-6 rounded-2xl bg-white/10 backdrop-blur-xl px-5 py-3 text-white">
                <p className="text-xs text-gray-300">Chip mới nhất</p>
                <p className="text-xl font-black">Apple M3</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ───────────────── GAMING BANNER ─────────────────
function GamingBanner() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-[36px] bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950 shadow-2xl">
          <div className="grid lg:grid-cols-2 gap-10 items-center p-8 lg:p-14">
            <div className="text-white">
              <Badge className="mb-6 rounded-full bg-white/10 px-4 py-2 backdrop-blur-md">
                🎮 Gaming Collection
              </Badge>
              <h2 className="text-4xl lg:text-6xl font-black leading-tight">
                Laptop Gaming
                <span className="block text-blue-300">Hiệu Năng Đỉnh Cao</span>
              </h2>
              <p className="mt-6 text-lg leading-8 text-blue-100">
                RTX 4080 - Intel Core i9 - Màn hình 240Hz.
                Trải nghiệm gaming mượt mà với hiệu năng mạnh mẽ nhất.
              </p>
              <div className="mt-8">
                <Link to="/products?category=laptop-gaming">
                  <Button
                    size="lg"
                    className="h-14 rounded-2xl bg-white px-8 text-blue-900 font-bold hover:bg-gray-100"
                  >
                    Khám phá ngay
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1641430034785-47f6f91ab6cf?w=1400&q=80"
                alt="Gaming Banner"
                className="h-[420px] w-full rounded-[28px] object-cover shadow-2xl"
              />
              <div className="absolute top-6 right-6 rounded-2xl bg-red-500 px-5 py-3 text-sm font-black text-white shadow-xl">
                Giảm đến 30%
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ───────────────── MAIN PAGE ─────────────────
export default function HomePage() {
  const [data, setData] = useState<HomePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchHomePageData()
      .then((d) => {
        if (!cancelled) { setData(d); setError(null); }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Homepage API error:', err);
          setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const displayCategories: CategoryItem[] = data
    ? data.categories.filter((c) => c.slug !== 'laptop')
    : [];

  const featuredProps       = (data?.featuredProducts   ?? []).map(toProductCardProps);
  const bestSellingProps    = (data?.bestSellingProducts ?? []).map(toProductCardProps);
  const topRatedProps       = (data?.topRatedProducts   ?? []).map(toProductCardProps);
  const gamingProps         = (data?.gamingProducts     ?? []).map(toProductCardProps);
  const officeProps         = (data?.officeProducts     ?? []).map(toProductCardProps);
  const graphicsProps       = (data?.graphicsProducts   ?? []).map(toProductCardProps);
  const ultrabookProps      = (data?.ultrabookProducts  ?? []).map(toProductCardProps);
  const macbookProps        = (data?.macbookProducts    ?? []).map(toProductCardProps);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
      <Header />

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 text-red-700 text-sm text-center py-3 px-4">
          {error}
          <button
            className="ml-4 underline hover:no-underline"
            onClick={() => window.location.reload()}
          >
            Tải lại
          </button>
        </div>
      )}

      {/* ───── HERO ───── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-red-600 via-red-700 to-red-900">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-red-400/20 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-orange-400/20 blur-3xl rounded-full" />
        <div className="absolute inset-0 opacity-[0.05]">
          <div className="h-full w-full bg-[linear-gradient(to_right,#ffffff22_1px,transparent_1px),linear-gradient(to_bottom,#ffffff22_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 lg:px-6 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 py-2 text-sm font-medium text-white mb-6">
                🔥 Khuyến mãi laptop gaming cực sốc
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] text-white">
                Laptop
                <span className="block text-red-200">Chính Hãng</span>
                <span className="block">Giá Tốt Nhất</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg md:text-xl leading-8 text-red-100">
                Gaming • Văn phòng • Đồ họa • Ultrabook.
                Hàng chính hãng 100%, hỗ trợ trả góp 0%, giao nhanh toàn quốc.
              </p>
              <div className="mt-8 flex flex-wrap gap-8">
                <div>
                  <p className="text-3xl font-black text-white">
                    {data?.totalProducts.toLocaleString('vi-VN') || '1000+'}
                  </p>
                  <p className="text-sm text-red-200">Sản phẩm</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-white">100%</p>
                  <p className="text-sm text-red-200">Chính hãng</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-white">0%</p>
                  <p className="text-sm text-red-200">Trả góp</p>
                </div>
              </div>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link to="/products">
                  <Button size="lg" className="h-14 rounded-2xl bg-white px-8 text-red-700 font-bold shadow-2xl hover:bg-gray-100 hover:scale-[1.02] transition-all duration-300">
                    Mua ngay
                  </Button>
                </Link>
                <Link to="/products">
                  <Button size="lg" variant="outline" className="h-14 rounded-2xl border-white/30 bg-white/10 backdrop-blur-md px-8 text-white hover:bg-white/20 transition-all duration-300">
                    Xem sản phẩm
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -top-6 -left-6 z-20 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl p-5 text-white shadow-2xl">
                <p className="text-sm text-red-100">Giảm giá đến</p>
                <p className="text-4xl font-black">40%</p>
              </div>
              <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1400&q=80"
                  alt="Laptop Banner"
                  className="w-full h-[400px] md:h-[520px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              </div>
              <div className="absolute -bottom-6 right-0 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl px-6 py-5 text-white shadow-2xl">
                <div className="flex items-center gap-6">
                  <div><p className="text-xs text-red-100">RTX</p><p className="text-xl font-black">4080</p></div>
                  <div><p className="text-xs text-red-100">Intel</p><p className="text-xl font-black">Core i9</p></div>
                  <div><p className="text-xs text-red-100">Display</p><p className="text-xl font-black">240Hz</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── FEATURES ───── */}
      <section className="relative py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Truck,       title: 'Miễn phí vận chuyển', sub: 'Đơn hàng từ 5 triệu' },
              { icon: CreditCard,  title: 'Trả góp 0%',          sub: 'Lãi suất ưu đãi'     },
              { icon: Shield,      title: 'Bảo hành chính hãng', sub: 'Toàn quốc'            },
              { icon: Headphones,  title: 'Hỗ trợ 24/7',         sub: 'Tư vấn miễn phí'     },
            ].map(({ icon: Icon, title, sub }) => (
              <div
                key={title}
                className="group rounded-3xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="size-14 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center shadow-sm mb-4">
                  <Icon className="size-6 text-red-600" />
                </div>
                <h3 className="font-bold text-gray-900">{title}</h3>
                <p className="mt-1 text-sm text-gray-500">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── 🔥 BÁN CHẠY NHẤT ───── */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <SectionHeader
            icon={<TrendingUp className="size-6 text-white" />}
            title="🔥 Bán chạy nhất"
            subtitle="Sản phẩm được khách hàng tin chọn nhiều nhất"
            linkTo="/products?sort=best_selling"
            accentClass="from-orange-400 to-red-500"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
              : bestSellingProps.slice(0, 8).map((p, idx) => (
                  <BestSellerCard key={p.id} rank={idx + 1} product={p} />
                ))}
          </div>
        </div>
      </section>

      {/* ───── ⭐ ĐÁNH GIÁ CAO NHẤT ───── */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-yellow-50 to-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <SectionHeader
            icon={<Star className="size-6 text-white fill-white" />}
            title="⭐ Đánh giá cao nhất"
            subtitle="Được khách hàng yêu thích và đánh giá 5 sao"
            linkTo="/products?sort=top_rated"
            accentClass="from-yellow-400 to-orange-400"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
              : topRatedProps.slice(0, 8).map((p, idx) => (
                  <TopRatedCard
                    key={p.id}
                    product={p}
                    originalRating={data?.topRatedProducts[idx]?.avgRating ?? p.rating ?? 0}
                  />
                ))}
          </div>
        </div>
      </section>

      {/* ───── SẢN PHẨM NỔI BẬT ───── */}
      <ProductSection
        title="Sản phẩm nổi bật"
        subtitle="Sản phẩm được quan tâm nhiều nhất"
        products={featuredProps}
        loading={loading}
        bgClass="bg-gradient-to-b from-white to-gray-50"
      />

      {/* ───── GAMING BANNER + SECTION ───── */}
      <GamingBanner />

      <ProductSection
        icon={<Gamepad2 className="size-6 text-white" />}
        title="🎮 Laptop Gaming"
        subtitle="Hiệu năng đỉnh cao cho mọi trận chiến"
        products={gamingProps}
        loading={loading}
        bgClass="bg-gradient-to-b from-gray-50 to-white"
        linkTo="/products?category=laptop-gaming"
        accentClass="from-blue-600 to-purple-600"
      />

      {/* ───── VĂN PHÒNG ───── */}
      <ProductSection
        icon={<Briefcase className="size-6 text-white" />}
        title="💼 Laptop Văn Phòng"
        subtitle="Bền bỉ, mỏng nhẹ, hiệu quả mọi lúc mọi nơi"
        products={officeProps}
        loading={loading}
        bgClass="bg-gradient-to-b from-white to-gray-50"
        linkTo="/products?category=laptop-van-phong"
        accentClass="from-sky-500 to-blue-600"
      />

      {/* ───── ĐỒ HỌA ───── */}
      <ProductSection
        icon={<Palette className="size-6 text-white" />}
        title="🎨 Laptop Đồ Họa"
        subtitle="Màn hình chuẩn màu, GPU mạnh cho sáng tạo không giới hạn"
        products={graphicsProps}
        loading={loading}
        bgClass="bg-gradient-to-b from-purple-50 to-white"
        linkTo="/products?category=laptop-do-hoa"
        accentClass="from-purple-500 to-pink-500"
        cols={4}
      />

      {/* ───── MACBOOK BANNER + SECTION ───── */}
      <MacBookBanner />

      <ProductSection
        icon={<Apple className="size-6 text-white" />}
        title="🍎 MacBook"
        subtitle="Chip Apple Silicon M3 — hiệu năng và pin vượt trội"
        products={macbookProps}
        loading={loading}
        bgClass="bg-gradient-to-b from-gray-50 to-white"
        linkTo="/products?brand=apple"
        accentClass="from-gray-600 to-gray-800"
        cols={4}
      />

      {/* ───── ULTRABOOK ───── */}
      <ProductSection
        icon={<Feather className="size-6 text-white" />}
        title="✨ Laptop Mỏng Nhẹ / Ultrabook"
        subtitle="Siêu mỏng, siêu nhẹ — bạn đồng hành lý tưởng khi di chuyển"
        products={ultrabookProps}
        loading={loading}
        bgClass="bg-gradient-to-b from-white to-gray-50"
        linkTo="/products?category=laptop-mong-nhe"
        accentClass="from-teal-500 to-cyan-500"
      />

      {/* ───── BRANDS ───── */}
      {!loading && data && data.brands.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900">
                Thương hiệu nổi bật
              </h2>
              <p className="mt-3 text-gray-500">
                Những thương hiệu laptop được yêu thích nhất hiện nay
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-5">
              {data.brands.map((brand) => (
                <Link
                  key={brand.id}
                  to={`/products?brand=${brand.slug}`}
                  className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm hover:-translate-y-1 hover:border-red-300 hover:shadow-xl transition-all duration-300"
                >
                  {brand.logoUrl ? (
                    <img src={brand.logoUrl} alt={brand.name} className="h-7 object-contain" />
                  ) : (
                    <span className="font-bold text-gray-800">{brand.name}</span>
                  )}
                  <span className="text-sm text-gray-400">({brand.productCount})</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───── LOADING OVERLAY ───── */}
      {loading && (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-xl z-50 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-3 rounded-3xl border border-white/20 bg-white/90 px-6 py-5 shadow-2xl">
            <Loader2 className="size-6 text-red-600 animate-spin" />
            <span className="font-medium text-gray-700">Đang tải dữ liệu...</span>
          </div>
        </div>
      )}

      <Footer />

      {/* ───── AI CHATBOT ───── */}
      <ProductChatBot />
    </div>
  );
}