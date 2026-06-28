import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import InviteAcceptForm from "./InviteAcceptForm";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
      <Suspense fallback={
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 max-w-md mx-auto text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
        </div>
      }>
        <InviteAcceptForm token={token} />
      </Suspense>
    </div>
  );
}
