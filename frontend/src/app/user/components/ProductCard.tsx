// src/components/ProductCard.tsx
import {
  ShoppingCart,
  Heart,
  Star,
  Eye,
  Cpu,
  HardDrive,
  MemoryStick,
  Monitor,
  Loader2,
} from 'lucide-react';

import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Link } from 'react-router';
import { useAddToCart } from '../hook/useAddToCart';

interface ProductCardProps {
  id: number;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
  image: string;
  specs: {
    cpu: string;
    ram: string;
    storage: string;
    display: string;
  };
  badge?: string;
}

export function ProductCard({
  id,
  name,
  brand,
  price,
  originalPrice,
  rating,
  reviews,
  image,
  specs,
  badge,
}: ProductCardProps) {
  const { addToCart, loadingId } = useAddToCart();
  const isLoading = loadingId === id;

  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const hasRating = rating != null && reviews != null;

  return (
    <div
      className="
        group relative overflow-hidden rounded-2xl border border-gray-200
        bg-white transition-all duration-300 hover:-translate-y-1
        hover:border-red-200 hover:shadow-xl
      "
    >
      {/* Hover Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-50/0 via-red-50/20 to-red-50/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Top Badges */}
      <div className="absolute left-3 top-3 z-20 flex flex-col gap-1.5">
        {badge && (
          <Badge className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm hover:bg-red-700">
            {badge}
          </Badge>
        )}
        {discount > 0 && (
          <Badge className="rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm hover:bg-green-700">
            -{discount}%
          </Badge>
        )}
      </div>

      {/* Wishlist */}
      <button className="absolute right-3 top-3 z-20 flex size-8 items-center justify-center rounded-full border border-gray-200 bg-white/90 shadow-sm opacity-0 translate-y-1 backdrop-blur transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-red-50">
        <Heart className="size-3.5 text-gray-500 transition-colors hover:text-red-600" />
      </button>

      {/* Image */}
      <Link to={`/product/${id}`}>
        <div className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white px-3 pt-7 pb-3">
          <ImageWithFallback
            src={image}
            alt={name}
            className="h-36 w-full object-contain transition-all duration-500 ease-out group-hover:scale-105 group-hover:-translate-y-1"
          />
        </div>
      </Link>

      {/* Content */}
      <div className="relative p-3.5">
        {/* Brand + Rating */}
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="max-w-[120px] truncate text-[10px] font-bold uppercase tracking-wider text-red-600">
            {brand}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star
              className={`size-3 transition-colors ${
                hasRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              }`}
            />
            {hasRating ? (
              <span className="text-[11px] font-medium text-gray-600">
                {rating!.toFixed(1)}
              </span>
            ) : (
              <span className="text-[10px] text-gray-400">--</span>
            )}
          </div>
        </div>

        {/* Product Name */}
        <Link to={`/product/${id}`}>
          <h3 className="min-h-[40px] line-clamp-2 text-[13px] font-semibold leading-5 text-gray-900 transition-colors duration-300 group-hover:text-red-600">
            {name}
          </h3>
        </Link>

        {/* Specs */}
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {specs.cpu && (
            <div className="flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1.5 text-[10px] text-gray-600 transition-colors duration-200 group-hover:bg-gray-100">
              <Cpu className="size-3 text-red-500 flex-shrink-0" />
              <span className="truncate">{specs.cpu}</span>
            </div>
          )}
          {specs.ram && (
            <div className="flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1.5 text-[10px] text-gray-600 transition-colors duration-200 group-hover:bg-gray-100">
              <MemoryStick className="size-3 text-red-500 flex-shrink-0" />
              <span className="truncate">{specs.ram}</span>
            </div>
          )}
          {specs.storage && (
            <div className="flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1.5 text-[10px] text-gray-600 transition-colors duration-200 group-hover:bg-gray-100">
              <HardDrive className="size-3 text-red-500 flex-shrink-0" />
              <span className="truncate">{specs.storage}</span>
            </div>
          )}
          {specs.display && (
            <div className="flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1.5 text-[10px] text-gray-600 transition-colors duration-200 group-hover:bg-gray-100">
              <Monitor className="size-3 text-red-500 flex-shrink-0" />
              <span className="truncate">{specs.display}</span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="mt-3.5">
          <div className="flex flex-wrap items-end gap-1.5">
            <span className="text-lg font-black tracking-tight text-red-600">
              {price.toLocaleString('vi-VN')}₫
            </span>
            {originalPrice && (
              <span className="mb-0.5 text-[11px] text-gray-400 line-through">
                {originalPrice.toLocaleString('vi-VN')}₫
              </span>
            )}
          </div>
          {discount > 0 && (
            <p className="mt-1 text-[10px] text-green-600">
              Tiết kiệm {(originalPrice! - price).toLocaleString('vi-VN')}₫
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <Button
            className="flex-1 rounded-xl bg-red-600 text-white shadow-sm transition-all duration-300 hover:bg-red-700 hover:shadow-md active:scale-[0.98] disabled:opacity-60"
            size="sm"
            disabled={isLoading}
            onClick={() => addToCart(id, 1)}
          >
            {isLoading ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <ShoppingCart className="mr-1.5 size-3.5" />
            )}
            <span className="text-[12px] font-medium">
              {isLoading ? 'Đang thêm...' : 'Thêm vào giỏ'}
            </span>
          </Button>

          <Link to={`/product/${id}`}>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-gray-200 bg-white transition-all duration-300 hover:border-red-300 hover:bg-red-50 hover:text-red-600 active:scale-[0.97]"
            >
              <Eye className="size-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}