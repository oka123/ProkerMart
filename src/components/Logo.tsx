import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-xl">P</span>
      </div>
      <span className="font-bold text-xl text-primary-600">ProkerMart</span>
    </Link>
  );
}
