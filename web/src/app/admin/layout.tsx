import { Sidebar, SidebarProvider } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background relative">
        {/* Ambient background decorations */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 overflow-hidden -z-10"
        >
          <div className="absolute top-0 left-1/3 size-[40rem] rounded-full bg-primary/[0.04] blur-3xl" />
          <div className="absolute bottom-0 right-1/4 size-[30rem] rounded-full bg-accent/[0.04] blur-3xl" />
        </div>

        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
