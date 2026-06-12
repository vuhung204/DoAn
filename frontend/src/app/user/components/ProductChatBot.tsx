import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, ShoppingBag, ChevronRight } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface ProductResponse {
  productId: number;
  name: string;
  slug: string;
  sku: string;
  basePrice: number;
  salePrice: number | null;
  description: string | null;
  thumbnailUrl?: string | null;
  brandName?: string | null;
  categoryName?: string | null;
  spec?: {
    cpu?: string;
    ram?: string;
    storage?: string;
    screen?: string;
    gpu?: string;
    os?: string;
    weightKg?: number;
  } | null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: ProductResponse[];
  timestamp: Date;
}

// ── Constants ────────────────────────────────────────────────────────────────

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:9765/api';

const SYSTEM_PROMPT = `Bạn là trợ lý tư vấn laptop cho cửa hàng LaptopShop. Nhiệm vụ của bạn là giúp khách hàng tìm được chiếc laptop phù hợp nhất với nhu cầu và ngân sách của họ.

Danh mục sản phẩm của cửa hàng:
- Laptop Gaming (tầm trung, cao cấp, siêu cao cấp, nhỏ gọn)
- Laptop Văn Phòng (sinh viên, doanh nhân, 2-trong-1)
- Laptop Đồ Hoạ (thiết kế, dựng phim, kỹ thuật CAD)
- Ultrabook / Mỏng Nhẹ (siêu mỏng, OLED)
- MacBook (Air, Pro)
- Laptop Cũ / Refurbished

Thương hiệu có bán: Dell, HP, Asus, Lenovo, Apple, MSI, Acer

Khi khách hàng hỏi, hãy:
1. Hỏi rõ nhu cầu sử dụng, ngân sách và ưu tiên nếu chưa rõ
2. Đề xuất từ khóa tìm kiếm phù hợp dựa trên nhu cầu
3. Giải thích ngắn gọn tại sao sản phẩm phù hợp
4. Trả lời bằng tiếng Việt, thân thiện và ngắn gọn

QUAN TRỌNG: Khi đề xuất sản phẩm, hãy trả về JSON ở cuối phản hồi theo format:
<SEARCH_PARAMS>{"keyword":"...","categoryId":null,"brandId":null,"minPrice":null,"maxPrice":null}</SEARCH_PARAMS>

Các categoryId:
2=Laptop Gaming, 3=Laptop Văn Phòng, 4=Laptop Đồ Hoạ, 5=Ultrabook/Mỏng Nhẹ, 6=MacBook, 7=Laptop Cũ

Ví dụ: khách muốn laptop gaming tầm 25 triệu → trả về:
<SEARCH_PARAMS>{"keyword":"gaming","categoryId":2,"brandId":null,"minPrice":20000000,"maxPrice":30000000}</SEARCH_PARAMS>`;

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price);
}

function parseSearchParams(text: string): Record<string, unknown> | null {
  const match = text.match(/<SEARCH_PARAMS>([\s\S]*?)<\/SEARCH_PARAMS>/);
  if (!match) return null;
  try { return JSON.parse(match[1]); } catch { return null; }
}

function cleanMessage(text: string): string {
  return text.replace(/<SEARCH_PARAMS>[\s\S]*?<\/SEARCH_PARAMS>/g, '').trim();
}

async function fetchProducts(params: Record<string, unknown>): Promise<ProductResponse[]> {
  const query = new URLSearchParams();
  if (params.keyword)    query.set('keyword',    String(params.keyword));
  if (params.categoryId) query.set('categoryId', String(params.categoryId));
  if (params.brandId)    query.set('brandId',    String(params.brandId));
  if (params.minPrice)   query.set('minPrice',   String(params.minPrice));
  if (params.maxPrice)   query.set('maxPrice',   String(params.maxPrice));
  query.set('size', '4');
  query.set('sort', 'popular');

  const res = await fetch(`${API_BASE}/products/search?${query.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();
  // ProductSearchPageResponse → items hoặc content
  return data.items ?? data.content ?? [];
}

// ── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: ProductResponse }) {
  const price = product.salePrice ?? product.basePrice;
  const hasDiscount = product.salePrice && product.salePrice < product.basePrice;

  return (
    <a
      href={`/products/${product.slug}`}
      className="block bg-white border border-gray-100 rounded-xl p-3 hover:border-blue-300 hover:shadow-md transition-all group"
    >
      {/* thumbnail */}
      <div className="w-full h-24 bg-gray-50 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
        {product.thumbnailUrl ? (
          <img
            src={product.thumbnailUrl}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
          />
        ) : (
          <ShoppingBag className="w-8 h-8 text-gray-300" />
        )}
      </div>

      {/* name */}
      <p className="text-xs font-bold text-gray-800 leading-snug line-clamp-2 mb-1">
        {product.name}
      </p>

      {/* spec snippet */}
      {product.spec?.ram && (
        <p className="text-[10px] text-gray-400 truncate mb-1.5">
          {[product.spec.cpu?.split(' ').slice(0, 3).join(' '), product.spec.ram]
            .filter(Boolean).join(' • ')}
        </p>
      )}

      {/* price */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-extrabold text-blue-600">{formatPrice(price)}</span>
        {hasDiscount && (
          <span className="text-[10px] text-gray-400 line-through">
            {formatPrice(product.basePrice)}
          </span>
        )}
      </div>

      {/* cta */}
      <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-blue-500 group-hover:text-blue-700">
        Xem chi tiết <ChevronRight className="w-3 h-3" />
      </div>
    </a>
  );
}

// ── Chat Message ─────────────────────────────────────────────────────────────

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* avatar */}
      <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold
        ${isUser ? 'bg-blue-500' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      </div>

      <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* bubble */}
        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
          ${isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
          }`}>
          {message.content}
        </div>

        {/* product cards */}
        {message.products && message.products.length > 0 && (
          <div className="grid grid-cols-2 gap-2 w-full">
            {message.products.map(p => (
              <ProductCard key={p.productId} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Quick Suggestions ─────────────────────────────────────────────────────────

const QUICK_SUGGESTIONS = [
  'Laptop gaming tầm 25 triệu',
  'Laptop mỏng nhẹ cho sinh viên',
  'MacBook nào tốt nhất?',
  'Laptop làm đồ họa dưới 40 triệu',
];

// ── Main Component ────────────────────────────────────────────────────────────

export default function ProductChatBot() {
  const [open, setOpen]         = useState(false);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Xin chào! 👋 Tôi có thể giúp bạn tìm laptop phù hợp nhất.\n\nBạn cần laptop cho mục đích gì? (gaming, văn phòng, đồ họa, học tập...)',
      timestamp: new Date(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);

  // auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // build conversation history for Claude API
      const history = [...messages, userMsg]
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      // include welcome message as first assistant turn if history empty
      const apiMessages = history.length === 1 && history[0].role === 'user'
        ? history
        : history;

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: apiMessages,
        }),
      });

      const data = await res.json();
      const rawText: string = data.content
        ?.filter((b: { type: string }) => b.type === 'text')
        .map((b: { text: string }) => b.text)
        .join('') ?? 'Xin lỗi, tôi không thể trả lời lúc này.';

      // parse search params if present
      const searchParams = parseSearchParams(rawText);
      const cleanText    = cleanMessage(rawText);

      let products: ProductResponse[] = [];
      if (searchParams) {
        products = await fetchProducts(searchParams);
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleanText,
        products: products.length > 0 ? products : undefined,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Xin lỗi, đã có lỗi xảy ra. Bạn vui lòng thử lại nhé!',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const showSuggestions = messages.length === 1; // chỉ hiện lần đầu

  return (
    <>
      {/* ── Floating Button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300
          ${open
            ? 'bg-gray-700 rotate-0 scale-95'
            : 'bg-gradient-to-br from-blue-600 to-indigo-700 hover:scale-110'
          }`}
        aria-label="Mở chat tư vấn"
      >
        {open
          ? <X className="w-6 h-6 text-white" />
          : <MessageCircle className="w-6 h-6 text-white" />
        }

        {/* pulse ring */}
        {!open && (
          <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-30" />
        )}
      </button>

      {/* ── Chat Window ── */}
      <div className={`fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right
        ${open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}
        style={{ height: '580px' }}
      >

        {/* header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Trợ lý tư vấn</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <p className="text-xs text-blue-100">Đang hoạt động</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="ml-auto p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
          {messages.map(msg => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {/* typing indicator */}
          {loading && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* quick suggestions */}
        {showSuggestions && !loading && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex gap-2 flex-wrap flex-shrink-0">
            {QUICK_SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs px-2.5 py-1.5 bg-white border border-blue-200 text-blue-600 rounded-full hover:bg-blue-50 font-medium transition-colors whitespace-nowrap"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* input */}
        <div className="flex items-end gap-2 px-4 py-3 bg-white border-t border-gray-100 flex-shrink-0">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập câu hỏi của bạn..."
            rows={1}
            className="flex-1 resize-none px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 max-h-24 overflow-y-auto"
            style={{ lineHeight: '1.5' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </button>
        </div>
      </div>
    </>
  );
}