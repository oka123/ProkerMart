import { UpdatePasswordForm } from "@/components/update-password-form";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-slate-50">
      <div className="w-full max-w-md p-8 bg-white border shadow-sm rounded-2xl border-slate-100">
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
