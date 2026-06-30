import { SignUpForm } from "@/components/sign-up-form";
import { Logo } from "@/components/Logo";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      {/* Left decorative panel — desktop only */}
      <div className="relative flex-col hidden gap-20 p-12 overflow-hidden lg:flex lg:w-1/2 bg-linear-to-br from-primary-700 via-primary-600 to-primary-800">
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
            Bergabung &amp;
            <br />
            Mulai Berjualan
          </h2>
          <p className="text-lg leading-relaxed text-primary-100">
            Platform marketplace eksklusif untuk Organisasi Mahasiswa. Jual
            merchandise, makanan, dan layanan dari program kerja Anda.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-10">
            {[
              { label: "Organisasi Aktif", value: "50+" },
              { label: "Produk Tersedia", value: "200+" },
              { label: "Pembeli Terdaftar", value: "1K+" },
              { label: "Transaksi Selesai", value: "5K+" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl"
              >
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-primary-200 text-sm mt-0.5">{stat.label}</p>
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
      <div className="flex items-center justify-center flex-1 p-6 overflow-y-auto bg-white md:p-12">
        <div className="w-full max-w-md">
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}
