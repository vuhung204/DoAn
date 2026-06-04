import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';

import { Header } from '../components/Header';
import { ProductCard } from '../components/ProductCard';

import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';

import {
  ShoppingCart,
  Heart,
  Share2,
  Star,
  Truck,
  Shield,
  RotateCcw,
  CheckCircle,
  ChevronRight,
  Minus,
  Plus,
  Phone,
  Mail,
  MapPin,
  Clock,
  AlertCircle,
  Loader2,
  PackageCheck,
  Sparkles,
} from 'lucide-react';

import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import api from '../config/apiConfig';
import { useAddToCart } from '../hook/useAddToCart';

const API_URL =
  (import.meta as any).env?.VITE_API_URL || 'http://localhost:9765';

interface ProductDetailResponse {
  id: number;
  name: string;
  slug: string;
  sku: string;
  basePrice: number;
  salePrice: number | null;
  description: string;
  brandName: string;
  categoryName: string;
  images: string[];
  cpu: string | null;
  ram: string | null;
  storage: string | null;
  display: string | null;
  gpu: string | null;
  os: string | null;
  weightKg: number | null;
  batteryWh: number | null;
  ports: string | null;
  color: string | null;
  avgRating: number;
  reviewCount: number;
  stockQuantity: number;
  inStock: boolean;
}

// Khớp với ReviewResponse.java
interface ReviewResponse {
  id: number;
  userFullName: string;
  userAvatar: string | null;
  rating: number;
  comment: string;
  createdAt: string;
  isVerified: boolean;
}

// Khớp với ProductReviewSummary.java
interface ProductReviewSummary {
  averageRating: number;
  totalReviews: number;
  reviews: {
    content: ReviewResponse[];
    totalPages: number;
    totalElements: number;
    number: number;
  };
}

const SPEC_LABELS: Record<string, string> = {
  cpu: 'CPU',
  ram: 'RAM',
  storage: 'Ổ cứng',
  display: 'Màn hình',
  gpu: 'GPU',
  os: 'Hệ điều hành',
  weight: 'Trọng lượng',
  battery: 'Pin',
  ports: 'Cổng kết nối',
  color: 'Màu sắc',
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, loadingId } = useAddToCart();

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlist, setIsWishlist] = useState(false);
  const [product, setProduct] = useState<ProductDetailResponse | null>(null);
  const [reviewSummary, setReviewSummary] = useState<ProductReviewSummary | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAddingToCart = product ? loadingId === product.id : false;

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);
    setSelectedImage(0);

    const token =
      localStorage.getItem('authToken') ||
      sessionStorage.getItem('authToken');

    Promise.all([
      fetch(`${API_URL}/api/products/${id}`).then((r) => {
        if (!r.ok) throw new Error('Không tìm thấy sản phẩm');
        return r.json();
      }),
      fetch(`${API_URL}/api/products/${id}/reviews?page=0&size=10`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(`${API_URL}/api/products?size=10&sort=newest`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      token
        ? api
            .get<{ productId: number }[]>('/wishlist')
            .then((res) => res.data)
            .catch(() => [])
        : Promise.resolve([]),
    ])
      .then(([prod, reviews, related, wishlist]) => {
        setProduct(prod);
        setReviewSummary(reviews);

        if (related?.content) {
          setRelatedProducts(
            related.content
              .filter((p: any) => p.id !== Number(id))
              .slice(0, 5)
          );
        }

        if (Array.isArray(wishlist)) {
          setIsWishlist(
            wishlist.some(
              (w: { productId: number }) => w.productId === Number(id)
            )
          );
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // ─── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <Header />
        <div className="flex h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="size-12 animate-spin text-red-600" />
            <p className="text-sm text-gray-500">Đang tải sản phẩm...</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Error state ─────────────────────────────────────────────────────────────
  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <AlertCircle className="mx-auto mb-4 size-16 text-red-400" />
          <h2 className="mb-2 text-3xl font-bold">Không tìm thấy sản phẩm</h2>
          <p className="mb-8 text-gray-500">{error}</p>
          <Button
            className="bg-red-600 hover:bg-red-700"
            onClick={() => navigate('/products')}
          >
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  // ─── Derived values ───────────────────────────────────────────────────────────
  const hasDiscount =
    product.salePrice !== null && product.salePrice < product.basePrice;
  const price = hasDiscount ? product.salePrice! : product.basePrice;
  const discount = hasDiscount
    ? Math.round(
        ((product.basePrice - product.salePrice!) / product.basePrice) * 100
      )
    : 0;

  const specs: Record<string, string> = {};
  if (product.cpu) specs.cpu = product.cpu;
  if (product.ram) specs.ram = product.ram;
  if (product.storage) specs.storage = product.storage;
  if (product.display) specs.display = product.display;
  if (product.gpu) specs.gpu = product.gpu;
  if (product.os) specs.os = product.os;
  if (product.weightKg) specs.weight = `${product.weightKg}kg`;
  if (product.batteryWh) specs.battery = `${product.batteryWh}Wh`;
  if (product.ports) specs.ports = product.ports;
  if (product.color) specs.color = product.color;

  // Lấy dữ liệu từ ProductReviewSummary
  const reviewsList: ReviewResponse[] = Array.isArray(reviewSummary?.reviews?.content)
    ? reviewSummary!.reviews.content
    : [];
  const rating = reviewSummary?.averageRating ?? product.avgRating ?? 0;
  const reviewCount = reviewSummary?.totalReviews ?? product.reviewCount ?? 0;
  const images = product.images.length > 0 ? product.images : [''];

  // ─── Wishlist handler ─────────────────────────────────────────────────────────
  const handleWishlist = async () => {
    const token =
      localStorage.getItem('authToken') ||
      sessionStorage.getItem('authToken');

    if (!token) {
      navigate('/login');
      return;
    }

    try {
      if (isWishlist) {
        await api.delete(`/wishlist/${product.id}`);
      } else {
        await api.post(`/wishlist/${product.id}`);
      }
      setIsWishlist((prev) => !prev);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <Header />

      {/* BREADCRUMB */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-[1700px] px-4 py-4">
          <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="transition-colors hover:text-red-600">
              Trang chủ
            </Link>
            <ChevronRight className="size-4" />
            <Link to="/products" className="transition-colors hover:text-red-600">
              Sản phẩm
            </Link>
            <ChevronRight className="size-4" />
            <span className="line-clamp-1 text-gray-900">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-[1700px] px-4 py-6">
        {/* MAIN GRID */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">

          {/* LEFT — Images */}
          <div className="xl:col-span-5">
            <div className="sticky top-24">
              <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                <div className="relative overflow-hidden bg-gradient-to-b from-red-50 via-white to-white p-8">
                  {hasDiscount && (
                    <Badge className="absolute left-5 top-5 rounded-full bg-red-600 px-4 py-1 text-sm">
                      -{discount}%
                    </Badge>
                  )}
                  <ImageWithFallback
                    src={images[selectedImage]}
                    alt={product.name}
                    className="h-[520px] w-full object-contain transition-transform duration-500 hover:scale-105"
                  />
                </div>

                <div className="grid grid-cols-5 gap-3 p-5 pt-0">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`
                        overflow-hidden rounded-2xl border bg-white p-2
                        transition-all duration-300
                        ${
                          selectedImage === index
                            ? 'border-red-500 ring-2 ring-red-100'
                            : 'border-gray-200 hover:border-red-300'
                        }
                      `}
                    >
                      <ImageWithFallback
                        src={img}
                        alt=""
                        className="h-20 w-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CENTER — Info & Actions */}
          <div className="xl:col-span-4">
            <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
              {/* Brand + SKU */}
              <div className="mb-4 flex items-center gap-3">
                <Badge className="rounded-full bg-red-50 px-3 py-1 text-red-600 hover:bg-red-50">
                  {product.brandName}
                </Badge>
                <span className="text-sm text-gray-400">SKU: {product.sku}</span>
              </div>

              {/* Title */}
              <h1 className="mb-5 text-[30px] font-black leading-tight tracking-tight text-gray-900">
                {product.name}
              </h1>

              {/* Rating + Stock */}
              <div className="mb-6 flex flex-wrap items-center gap-4 border-b border-gray-100 pb-6">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`size-5 ${
                        i < Math.floor(rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 font-semibold">{rating.toFixed(1)}</span>
                </div>
                <span className="text-gray-300">|</span>
                <span className="text-gray-600">{reviewCount} đánh giá</span>
                <span className="text-gray-300">|</span>
                {product.inStock ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="size-4" />
                    <span>Còn {product.stockQuantity} sản phẩm</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="size-4" />
                    <span>Hết hàng</span>
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="mb-6 rounded-3xl bg-gradient-to-r from-red-600 to-red-500 p-6 text-white shadow-lg">
                <div className="flex flex-wrap items-end gap-3">
                  <span className="text-4xl font-black tracking-tight">
                    {price.toLocaleString('vi-VN')}₫
                  </span>
                  {hasDiscount && (
                    <span className="mb-1 text-lg text-red-100 line-through">
                      {product.basePrice.toLocaleString('vi-VN')}₫
                    </span>
                  )}
                </div>
                {hasDiscount && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <Sparkles className="size-4" />
                    <span>
                      Tiết kiệm{' '}
                      {(product.basePrice - product.salePrice!).toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                )}
              </div>

              {/* Specs preview */}
              <div className="mb-6 grid grid-cols-2 gap-3">
                {Object.entries(specs)
                  .slice(0, 6)
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className="rounded-2xl border border-gray-100 bg-gray-50 p-3"
                    >
                      <p className="mb-1 text-xs text-gray-500">{SPEC_LABELS[key]}</p>
                      <p className="line-clamp-2 text-sm font-semibold text-gray-900">
                        {value}
                      </p>
                    </div>
                  ))}
              </div>

              {/* Quantity */}
              <div className="mb-6">
                <p className="mb-3 font-semibold">Số lượng</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center overflow-hidden rounded-2xl border border-gray-200">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="size-4" />
                    </Button>
                    <span className="flex min-w-[60px] items-center justify-center font-bold">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setQuantity(Math.min(product.stockQuantity || 99, quantity + 1))
                      }
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                  <span className="text-sm text-gray-500">
                    {product.stockQuantity} sản phẩm
                  </span>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="space-y-3">
                <Button
                  onClick={() => addToCart(product.id, quantity)}
                  disabled={!product.inStock || isAddingToCart}
                  className="
                    h-14 w-full rounded-2xl bg-red-600 text-base font-bold
                    shadow-lg transition-all duration-300
                    hover:scale-[1.01] hover:bg-red-700
                    disabled:opacity-60
                  "
                >
                  {isAddingToCart ? (
                    <Loader2 className="mr-2 size-5 animate-spin" />
                  ) : (
                    <ShoppingCart className="mr-2 size-5" />
                  )}
                  {isAddingToCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleWishlist}
                    className="h-12 rounded-2xl border-gray-200"
                  >
                    <Heart
                      className={`mr-2 size-4 ${
                        isWishlist ? 'fill-red-500 text-red-500' : ''
                      }`}
                    />
                    Yêu thích
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 rounded-2xl border-gray-200"
                  >
                    <Share2 className="mr-2 size-4" />
                    Chia sẻ
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Services & Contact */}
          <div className="xl:col-span-3">
            <div className="space-y-5">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-5 text-lg font-bold">Dịch vụ & ưu đãi</h3>
                <div className="space-y-4">
                  {[
                    { icon: Truck, title: 'Miễn phí vận chuyển', desc: 'Toàn quốc' },
                    { icon: Shield, title: 'Bảo hành chính hãng', desc: '12 tháng' },
                    { icon: RotateCcw, title: 'Đổi trả dễ dàng', desc: 'Trong 7 ngày' },
                    { icon: PackageCheck, title: 'Hàng chính hãng', desc: '100% nguyên seal' },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="flex items-start gap-4 rounded-2xl bg-gray-50 p-4"
                    >
                      <div className="flex size-11 items-center justify-center rounded-2xl bg-red-100">
                        <item.icon className="size-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 to-red-500 p-6 text-white shadow-xl">
                <h3 className="mb-2 text-xl font-bold">Cần hỗ trợ?</h3>
                <p className="mb-6 text-sm text-red-100">
                  Đội ngũ tư vấn luôn sẵn sàng hỗ trợ bạn
                </p>
                <div className="space-y-4">
                  {[
                    { icon: Phone, text: '1900 xxxx', bold: true },
                    { icon: Mail, text: 'support@laptop.vn' },
                    { icon: MapPin, text: 'Hỗ trợ toàn quốc' },
                    { icon: Clock, text: '08:00 - 22:00' },
                  ].map(({ icon: Icon, text, bold }) => (
                    <div key={text} className="flex items-center gap-3">
                      <Icon className="size-5" />
                      <span className={bold ? 'font-semibold' : ''}>{text}</span>
                    </div>
                  ))}
                </div>
                <Button className="mt-6 h-12 w-full rounded-2xl bg-white font-bold text-red-600 hover:bg-red-50">
                  Gọi ngay
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="mb-8 h-auto rounded-2xl bg-gray-100 p-1">
              <TabsTrigger value="description" className="rounded-xl px-6 py-3">
                Mô tả sản phẩm
              </TabsTrigger>
              <TabsTrigger value="specs" className="rounded-xl px-6 py-3">
                Thông số kỹ thuật
              </TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-xl px-6 py-3">
                Đánh giá ({reviewCount})
              </TabsTrigger>
            </TabsList>

            {/* Description */}
            <TabsContent value="description">
              <div className="max-w-5xl">
                <h2 className="mb-5 text-2xl font-bold">Giới thiệu sản phẩm</h2>
                <div className="space-y-5 leading-8 text-gray-700">
                  {product.description ? (
                    product.description.split('\n\n').map((para, i) => (
                      <p key={i}>{para}</p>
                    ))
                  ) : (
                    <p>Chưa có mô tả.</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Specs */}
            <TabsContent value="specs">
              <div>
                <h2 className="mb-6 text-2xl font-bold">Thông số kỹ thuật</h2>
                <div className="overflow-hidden rounded-3xl border border-gray-200">
                  {Object.entries(specs).map(([key, value], index) => (
                    <div
                      key={key}
                      className={`
                        grid grid-cols-12 border-b px-6 py-5
                        transition-colors hover:bg-red-50/40
                        ${index === Object.entries(specs).length - 1 ? 'border-b-0' : ''}
                      `}
                    >
                      <div className="col-span-4 font-semibold text-gray-600">
                        {SPEC_LABELS[key]}
                      </div>
                      <div className="col-span-8 text-gray-900">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Reviews */}
            <TabsContent value="reviews">
              <div className="mb-8 grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-3 rounded-3xl bg-red-50 p-6 text-center">
                  <div className="text-6xl font-black text-red-600">
                    {rating.toFixed(1)}
                  </div>
                  <div className="mt-3 flex justify-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`size-5 ${
                          i < Math.floor(rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-gray-600">{reviewCount} đánh giá</p>
                </div>

                <div className="lg:col-span-9">
                  <div className="space-y-6">
                    {reviewsList.map((review) => (
                      <div
                        key={review.id}
                        className="rounded-3xl border border-gray-200 p-5 transition-all hover:shadow-md"
                      >
                        <div className="flex gap-4">
                          <ImageWithFallback
                            src={review.userAvatar || ''}
                            alt={review.userFullName}
                            className="size-14 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-3">
                              <h4 className="font-bold">{review.userFullName}</h4>
                              {review.isVerified && (
                                <Badge className="rounded-full bg-green-50 text-green-600 hover:bg-green-50">
                                  <CheckCircle className="mr-1 size-3" />
                                  Đã mua hàng
                                </Badge>
                              )}
                            </div>
                            <div className="mb-3 flex items-center gap-2">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`size-4 ${
                                    i < review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                              <span className="text-sm text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                            <p className="leading-7 text-gray-700">{review.comment}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {reviewsList.length === 0 && (
                      <div className="py-14 text-center text-gray-500">
                        Chưa có đánh giá nào
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* RELATED */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-tight">Sản phẩm tương tự</h2>
                <p className="mt-1 text-gray-500">Gợi ý dành cho bạn</p>
              </div>
              <Link
                to="/products"
                className="flex items-center gap-1 font-semibold text-red-600 transition-colors hover:text-red-700"
              >
                Xem tất cả
                <ChevronRight className="size-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  brand={p.brandName}
                  price={p.salePrice ?? p.basePrice}
                  originalPrice={p.salePrice ? p.basePrice : undefined}
                  rating={p.avgRating}
                  reviews={p.reviewCount}
                  image={p.primaryImage || ''}
                  specs={{
                    cpu: p.cpu || '',
                    ram: p.ram || '',
                    storage: p.storage || '',
                    display: p.display || '',
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}