"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Users,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  UserPlus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Usuarios",
    href: "/dashboard/usuarios",
    icon: Users,
  },
  {
    name: "Registrar Usuario",
    href: "/dashboard/usuarios/new",
    icon: UserPlus,
  },
  {
    name: "Configuración",
    href: "/dashboard/configuracion",
    icon: Settings,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile
  const [sidebarExpanded, setSidebarExpanded] = useState(true); // desktop
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const getInitials = () => {
    if (!mounted) return "U";
    if (!user?.nombres || !user?.apellidos) return "U";
    return `${user.nombres[0]}${user.apellidos[0]}`;
  };

  // Sidebar width
  const sidebarWidth = sidebarExpanded ? "w-64" : "w-20";

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex h-16 items-center justify-between px-4 bg-white shadow-sm">
          <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
        </div>
        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex overflow-hidden">
      {/* Sidebar (desktop & mobile) */}
      <aside
        className={cn(
          "z-50 flex flex-col bg-white shadow-lg transition-all duration-200 ease-in-out h-full fixed md:static",
          sidebarWidth,
          sidebarOpen ? "left-0" : "-left-64 md:left-0",
          "top-0 md:translate-x-0 md:relative"
        )}
        style={{ minHeight: '100vh' }}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className={cn("text-xl font-bold text-primary transition-all", sidebarExpanded ? "block" : "hidden")}>AdminPanel</span>
            <span className={cn("text-xl font-bold text-primary transition-all", !sidebarExpanded ? "block" : "hidden")}>AP</span>
          </Link>
          {/* Collapse/Expand button (desktop) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarExpanded((v) => !v)}
            className="hidden md:inline-flex"
            aria-label={sidebarExpanded ? "Colapsar menú" : "Expandir menú"}
          >
            {sidebarExpanded ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </Button>
          {/* Close button (mobile) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        {/* Navigation */}
        <nav className="mt-8 flex-1 space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-6 w-6 flex-shrink-0 transition-all",
                    sidebarExpanded ? "" : "mx-auto"
                  )}
                />
                <span className={cn("transition-all", sidebarExpanded ? "block" : "hidden")}>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          style={{ touchAction: 'none', overflow: 'hidden' }}
        />
      )}

      {/* Main content */}
      <div className={cn("flex-1 flex flex-col min-h-screen overflow-x-hidden")}> 
        {/* Top navigation */}
        <div className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-6 md:px-8 shadow-sm w-full">
          {/* Hamburger for mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="md:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-6 w-6" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/avatars/01.png" alt={user?.nombres || "Usuario"} />
                      <AvatarFallback>{getInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 w-full overflow-x-auto">
          <div className="py-6">
            <div className="mx-auto w-full px-2">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 