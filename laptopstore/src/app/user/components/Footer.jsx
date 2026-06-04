import {
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  CreditCard,
  ShieldCheck,
  Truck,
  BadgeCheck,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
} from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-[-120px] h-72 w-72 rounded-full bg-red-600/20 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-120px] h-80 w-80 rounded-full bg-red-500/10 blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Top Feature Bar */}
        <div className="border-b border-white/10 bg-white/[0.03] backdrop-blur">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 gap-4 py-6 md:grid-cols-4">
              <div className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition-all duration-300 hover:border-red-500/30 hover:bg-white/[0.06]">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-400">
                  <Truck className="size-6" />
                </div>
                <div>
                  <p className="font-semibold">Giao hàng nhanh</p>
                  <p className="text-sm text-gray-400">
                    Toàn quốc 24/7
                  </p>
                </div>
              </div>

              <div className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition-all duration-300 hover:border-red-500/30 hover:bg-white/[0.06]">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
                  <ShieldCheck className="size-6" />
                </div>
                <div>
                  <p className="font-semibold">Bảo hành chính hãng</p>
                  <p className="text-sm text-gray-400">
                    Hỗ trợ tận nơi
                  </p>
                </div>
              </div>

              <div className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition-all duration-300 hover:border-red-500/30 hover:bg-white/[0.06]">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-400">
                  <CreditCard className="size-6" />
                </div>
                <div>
                  <p className="font-semibold">Thanh toán linh hoạt</p>
                  <p className="text-sm text-gray-400">
                    Trả góp 0%
                  </p>
                </div>
              </div>

              <div className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition-all duration-300 hover:border-red-500/30 hover:bg-white/[0.06]">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-yellow-500/15 text-yellow-400">
                  <BadgeCheck className="size-6" />
                </div>
                <div>
                  <p className="font-semibold">100% chính hãng</p>
                  <p className="text-sm text-gray-400">
                    Uy tín chất lượng
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Footer */}
        <div className="container mx-auto px-4 py-16">
          <div className="grid gap-12 lg:grid-cols-12">
            {/* Brand Info */}
            <div className="lg:col-span-4">
              <div className="mb-6">
                <div className="mb-4 inline-flex items-center gap-3">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 text-xl font-black shadow-lg shadow-red-500/30">
                    LW
                  </div>

                  <div>
                    <h2 className="text-3xl font-black tracking-tight">
                      Laptop World
                    </h2>
                    <p className="text-sm text-gray-400">
                      Premium Gaming & Workstation
                    </p>
                  </div>
                </div>

                <p className="max-w-md leading-7 text-gray-400">
                  Hệ thống bán laptop gaming, đồ họa và văn phòng cao cấp.
                  Cam kết hàng chính hãng, giá tốt và dịch vụ hỗ trợ tận tâm.
                </p>
              </div>

              {/* Contact */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-white/5">
                    <Phone className="size-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Hotline</p>
                    <p className="font-semibold">1900 9999</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-300">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-white/5">
                    <Mail className="size-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold">support@laptopworld.vn</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-gray-300">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-white/5">
                    <MapPin className="size-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Địa chỉ</p>
                    <p className="font-semibold">
                      123 Nguyễn Văn A, TP. Hồ Chí Minh
                    </p>
                  </div>
                </div>
              </div>

              {/* Social */}
              <div className="mt-8 flex items-center gap-3">
                <a
                  href="#"
                  className="group flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50 hover:bg-blue-500"
                >
                  <Facebook className="size-5 transition-transform group-hover:scale-110" />
                </a>

                <a
                  href="#"
                  className="group flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] transition-all duration-300 hover:-translate-y-1 hover:border-pink-500/50 hover:bg-gradient-to-br hover:from-pink-500 hover:to-orange-400"
                >
                  <Instagram className="size-5 transition-transform group-hover:scale-110" />
                </a>

                <a
                  href="#"
                  className="group flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] transition-all duration-300 hover:-translate-y-1 hover:border-sky-500/50 hover:bg-sky-500"
                >
                  <Twitter className="size-5 transition-transform group-hover:scale-110" />
                </a>

                <a
                  href="#"
                  className="group flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] transition-all duration-300 hover:-translate-y-1 hover:border-red-500/50 hover:bg-red-600"
                >
                  <Youtube className="size-5 transition-transform group-hover:scale-110" />
                </a>
              </div>
            </div>

            {/* Links */}
            <div className="lg:col-span-8">
              <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                {/* Company */}
                <div>
                  <h3 className="mb-5 text-lg font-bold">
                    Về chúng tôi
                  </h3>

                  <ul className="space-y-3">
                    {[
                      'Giới thiệu',
                      'Tuyển dụng',
                      'Tin công nghệ',
                      'Liên hệ',
                      'Hệ thống cửa hàng',
                    ].map((item) => (
                      <li key={item}>
                        <a
                          href="#"
                          className="group flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
                        >
                          <ChevronRight className="size-4 text-red-500 transition-transform group-hover:translate-x-1" />
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Support */}
                <div>
                  <h3 className="mb-5 text-lg font-bold">
                    Hỗ trợ khách hàng
                  </h3>

                  <ul className="space-y-3">
                    {[
                      'Trung tâm hỗ trợ',
                      'Hướng dẫn mua hàng',
                      'Bảo hành sản phẩm',
                      'Đổi trả & hoàn tiền',
                      'FAQ',
                    ].map((item) => (
                      <li key={item}>
                        <a
                          href="#"
                          className="group flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
                        >
                          <ChevronRight className="size-4 text-red-500 transition-transform group-hover:translate-x-1" />
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Policy */}
                <div>
                  <h3 className="mb-5 text-lg font-bold">
                    Chính sách
                  </h3>

                  <ul className="space-y-3">
                    {[
                      'Điều khoản dịch vụ',
                      'Chính sách bảo mật',
                      'Chính sách vận chuyển',
                      'Thanh toán',
                      'Trả góp',
                    ].map((item) => (
                      <li key={item}>
                        <a
                          href="#"
                          className="group flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
                        >
                          <ChevronRight className="size-4 text-red-500 transition-transform group-hover:translate-x-1" />
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Payment */}
                <div>
                  <h3 className="mb-5 text-lg font-bold">
                    Thanh toán
                  </h3>

                  <div className="space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition-all hover:bg-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
                          <CreditCard className="size-5" />
                        </div>
                        <div>
                          <p className="font-medium">Thẻ tín dụng</p>
                          <p className="text-xs text-gray-500">
                            Visa, Mastercard
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition-all hover:bg-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                          💳
                        </div>
                        <div>
                          <p className="font-medium">Ví điện tử</p>
                          <p className="text-xs text-gray-500">
                            MoMo, ZaloPay
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition-all hover:bg-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-yellow-500/15 text-yellow-400">
                          🏦
                        </div>
                        <div>
                          <p className="font-medium">Chuyển khoản</p>
                          <p className="text-xs text-gray-500">
                            Internet Banking
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition-all hover:bg-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-red-500/15 text-red-400">
                          ✨
                        </div>
                        <div>
                          <p className="font-medium">Trả góp 0%</p>
                          <p className="text-xs text-gray-500">
                            Duyệt nhanh chóng
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div className="mt-16 rounded-3xl border border-white/10 bg-gradient-to-r from-red-600/20 to-red-500/5 p-8 backdrop-blur">
            <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">
              <div>
                <h3 className="mb-2 text-2xl font-bold">
                  Đăng ký nhận ưu đãi
                </h3>
                <p className="text-gray-300">
                  Nhận thông tin khuyến mãi và sản phẩm mới sớm nhất.
                </p>
              </div>

              <div className="flex w-full max-w-xl items-center gap-3">
                <input
                  type="email"
                  placeholder="Nhập email của bạn..."
                  className="h-14 flex-1 rounded-2xl border border-white/10 bg-white/10 px-5 text-white placeholder:text-gray-400 outline-none transition-all focus:border-red-500 focus:bg-white/15"
                />

                <button className="h-14 rounded-2xl bg-red-600 px-8 font-semibold text-white shadow-lg shadow-red-600/30 transition-all duration-300 hover:scale-105 hover:bg-red-700">
                  Đăng ký
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 bg-black/30">
          <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 text-sm text-gray-500 md:flex-row">
            <p>
              © 2026 Laptop World. Tất cả quyền được bảo lưu.
            </p>

            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-white transition-colors">
                Điều khoản
              </a>

              <a href="#" className="hover:text-white transition-colors">
                Bảo mật
              </a>

              <a href="#" className="hover:text-white transition-colors">
                Sitemap
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}