import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex font-mono">
      <aside className="w-64 bg-[#111] shadow-xl border-r border-gray-800 hidden md:block">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-green-500">&lt;Admin /&gt;</h1>
        </div>
        <nav className="mt-6">
          <Link
            href="/admin"
            className="block px-6 py-3 text-gray-400 hover:bg-gray-900 hover:text-green-400 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/questions"
            className="block px-6 py-3 text-gray-400 hover:bg-gray-900 hover:text-green-400 transition-colors"
          >
            Questions
          </Link>
          <Link
            href="/admin/users"
            className="block px-6 py-3 text-gray-400 hover:bg-gray-900 hover:text-green-400 transition-colors"
          >
            Users
          </Link>
          <Link
            href="/"
            className="block px-6 py-3 text-gray-400 hover:bg-gray-900 hover:text-green-400 mt-auto transition-colors border-t border-gray-800"
          >
            Back to App
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto bg-[#0a0a0a] text-gray-300">
        {children}
      </main>
    </div>
  );
}
