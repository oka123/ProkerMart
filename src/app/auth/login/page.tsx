import { LoginForm } from "@/components/login-form";
import { Logo } from "@/components/Logo";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      {/* Left decorative panel — desktop only */}
      <div className="relative flex-col justify-between hidden p-12 overflow-hidden lg:flex lg:w-1/2 bg-linear-to-br from-primary-700 via-primary-600 to-primary-800">
        {/* Background decorative circles */}
        <div className="absolute rounded-full -top-20 -right-20 w-80 h-80 bg-white/5" />
        <div className="absolute rounded-full -bottom-10 -left-10 w-60 h-60 bg-white/5" />
        <div className="absolute w-40 h-40 rounded-full top-1/3 right-10 bg-white/5" />

        {/* Top branding */}
        <div className="relative z-10">
          <Logo theme="white" />
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <h2 className="mb-4 text-4xl font-bold leading-tight text-white">
            Satu Platform,
            <br />
            Seribu Produk Ormawa
          </h2>
          <p className="text-lg leading-relaxed text-primary-100">
            Temukan dan beli produk menarik dari berbagai Organisasi Mahasiswa
            kampus Anda. Dukung kegiatan mereka dengan berbelanja di ProkerMart.
          </p>

          <div className="mt-10 space-y-4">
            {[
              "🛒 Belanja produk eksklusif Ormawa",
              "📍 Temukan penjual terdekat di kampus",
              "💳 Pembayaran mudah & aman",
              "🎯 Dukung program kerja mahasiswa",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl"
              >
                <p className="text-sm font-medium text-white">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="relative z-10 text-sm text-primary-300">
          © 2026 ProkerMart. Marketplace Ormawa Kampus.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center flex-1 p-6 bg-white md:p-12">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
