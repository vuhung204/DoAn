// src/components/ReviewStats.tsx
import { useEffect, useState } from 'react';
import { Star, CheckCircle, Clock, EyeOff, Loader2 } from 'lucide-react';
import { fetchReviewStats, type ReviewStatsDto } from '../api/reviewsApi';

const ICON_MAP: Record<string, any> = {
  'icon-total':    Star,
  'icon-approved': CheckCircle,
  'icon-pending':  Clock,
  'icon-hidden':   EyeOff,
};

const ICON_COLOR_MAP: Record<string, string> = {
  'icon-total':    'bg-blue-100 text-blue-600',
  'icon-approved': 'bg-green-100 text-green-600',
  'icon-pending':  'bg-orange-100 text-orange-600',
  'icon-hidden':   'bg-purple-100 text-purple-600',
};

export function ReviewStats() {
  const [stats,   setStats]   = useState<ReviewStatsDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviewStats().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-center h-20">
            <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon      = ICON_MAP[stat.iconClass]    ?? Star;
        const iconColor = ICON_COLOR_MAP[stat.iconClass] ?? 'bg-gray-100 text-gray-600';
        return (
          <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-0.5">{stat.label}</div>
              <div className="text-xl font-black text-gray-900">{stat.value}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}