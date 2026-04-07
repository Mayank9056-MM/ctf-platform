import { Navbar } from "@/shared/components/Navbar";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#080c10] text-white">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}
