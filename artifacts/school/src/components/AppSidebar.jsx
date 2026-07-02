import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Calendar, BookOpen, Megaphone, CalendarCheck, UserCog,
  FileText, GraduationCap, LogOut, ClipboardCheck, School,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navByRole = {
  alumno: [
    { label: "Dashboard", href: "/alumno/dashboard", icon: LayoutDashboard },
    { label: "Mis Cursos", href: "/alumno/cursos", icon: GraduationCap },
    { label: "Horario", href: "/alumno/horario", icon: Calendar },
    { label: "Anuncios", href: "/alumno/anuncios", icon: Megaphone },
  ],
  apoderado: [
    { label: "Dashboard", href: "/apoderado/dashboard", icon: LayoutDashboard },
    { label: "Horario", href: "/apoderado/horario", icon: Calendar },
    { label: "Anuncios", href: "/apoderado/anuncios", icon: Megaphone },
    { label: "Reuniones", href: "/apoderado/reuniones", icon: CalendarCheck },
  ],
  profesor: [
    { label: "Dashboard", href: "/profesor/dashboard", icon: LayoutDashboard },
    { label: "Cursos", href: "/profesor/cursos", icon: GraduationCap },
    { label: "Asistencia", href: "/profesor/asistencia", icon: ClipboardCheck },
    { label: "Notas", href: "/profesor/notas", icon: BookOpen },
    { label: "Reuniones", href: "/profesor/reuniones", icon: CalendarCheck },
    { label: "Anuncios", href: "/profesor/anuncios", icon: Megaphone },
  ],
  inspector: [
    { label: "Dashboard", href: "/inspector/dashboard", icon: LayoutDashboard },
    { label: "Anotaciones", href: "/inspector/anotaciones", icon: FileText },
    { label: "Reuniones", href: "/inspector/reuniones", icon: CalendarCheck },
  ],
  admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Usuarios", href: "/admin/usuarios", icon: UserCog },
    { label: "Cursos", href: "/admin/cursos", icon: GraduationCap },
    { label: "Notas", href: "/admin/notas", icon: BookOpen },
    { label: "Anotaciones", href: "/admin/anotaciones", icon: FileText },
    { label: "Reuniones", href: "/admin/reuniones", icon: CalendarCheck },
    { label: "Horarios", href: "/admin/horarios", icon: Calendar },
    { label: "Anuncios", href: "/admin/anuncios", icon: Megaphone },
  ],
};

const roleLabels = {
  alumno: "Alumno",
  apoderado: "Apoderado",
  profesor: "Profesor",
  inspector: "Inspector",
  admin: "Administrador",
};

export function AppSidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  if (!user) return null;
  const navItems = navByRole[user.role] || [];

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-sidebar border-r border-sidebar-border flex flex-col z-40">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <School className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-sidebar-foreground leading-tight">Instituto Escolar</p>
            <p className="text-xs text-muted-foreground">{roleLabels[user.role]}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || location.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <a className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all",
                isActive ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-sidebar-border">
        <div className="px-3 pb-2">
          <p className="text-xs font-semibold text-sidebar-foreground truncate">{user.nombre} {user.apellido}</p>
          <p className="text-xs text-muted-foreground truncate">{user.rut}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={logout}
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesion
        </Button>
      </div>
    </aside>
  );
}

export function PageLayout({ children, title }) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 ml-60 min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {title && <h1 className="text-2xl font-bold text-foreground mb-6">{title}</h1>}
          {children}
        </div>
      </main>
    </div>
  );
}
