import { Navbar } from "@/components/Navbar";
import { ExploreClient } from "@/components/explore/ExploreClient";

export const metadata = {
  title: "Eksplor Produk | ProkerMart",
  description:
    "Temukan produk dari berbagai program kerja organisasi mahasiswa di satu tempat.",
};

// No server-side data fetch needed — ExploreClient handles all fetching
// via the /api/products route with infinite scroll.
export default function ExplorePage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <ExploreClient />
    </div>
  );
}
