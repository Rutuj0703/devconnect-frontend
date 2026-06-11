import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/shared/ProtectedRoute";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-4">
        {children}
      </main>
    </div>
    </ProtectedRoute>
  );
}