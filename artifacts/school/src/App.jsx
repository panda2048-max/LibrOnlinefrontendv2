import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";

import AlumnoDashboard from "@/pages/alumno/dashboard";
import AlumnoHorario from "@/pages/alumno/horario";
import AlumnoNotas from "@/pages/alumno/notas";
import AlumnoAnuncios from "@/pages/alumno/anuncios";

import ApoderadoDashboard from "@/pages/apoderado/dashboard";
import ApoderadoHorario from "@/pages/apoderado/horario";
import ApoderadoNotas from "@/pages/apoderado/notas";
import ApoderadoAnuncios from "@/pages/apoderado/anuncios";
import ApoderadoReuniones from "@/pages/apoderado/reuniones";

import ProfesorDashboard from "@/pages/profesor/dashboard";
import ProfesorCursos from "@/pages/profesor/cursos";
import ProfesorAsistencia from "@/pages/profesor/asistencia";
import ProfesorNotas from "@/pages/profesor/notas";
import ProfesorReuniones from "@/pages/profesor/reuniones";

import InspectorDashboard from "@/pages/inspector/dashboard";
import InspectorAnotaciones from "@/pages/inspector/anotaciones";
import InspectorReuniones from "@/pages/inspector/reuniones";

import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsuarios from "@/pages/admin/usuarios";
import AdminNotas from "@/pages/admin/notas";
import AdminAnotaciones from "@/pages/admin/anotaciones";
import AdminReuniones from "@/pages/admin/reuniones";
import AdminHorarios from "@/pages/admin/horarios";
import AdminAnuncios from "@/pages/admin/anuncios";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

function RoleRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Redirect to="/login" />;
  const routes = {
    alumno: "/alumno/dashboard",
    apoderado: "/apoderado/dashboard",
    profesor: "/profesor/dashboard",
    inspector: "/inspector/dashboard",
    admin: "/admin/dashboard",
  };
  return <Redirect to={routes[user?.role] || "/login"} />;
}

function ProtectedRoute({ component: Component, roles }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (roles && user && !roles.includes(user.role)) return <Redirect to="/" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={RoleRedirect} />

      <Route path="/alumno/dashboard"><ProtectedRoute component={AlumnoDashboard} roles={["alumno"]} /></Route>
      <Route path="/alumno/horario"><ProtectedRoute component={AlumnoHorario} roles={["alumno"]} /></Route>
      <Route path="/alumno/notas/:courseId"><ProtectedRoute component={AlumnoNotas} roles={["alumno"]} /></Route>
      <Route path="/alumno/anuncios"><ProtectedRoute component={AlumnoAnuncios} roles={["alumno"]} /></Route>

      <Route path="/apoderado/dashboard"><ProtectedRoute component={ApoderadoDashboard} roles={["apoderado"]} /></Route>
      <Route path="/apoderado/horario"><ProtectedRoute component={ApoderadoHorario} roles={["apoderado"]} /></Route>
      <Route path="/apoderado/notas/:courseId"><ProtectedRoute component={ApoderadoNotas} roles={["apoderado"]} /></Route>
      <Route path="/apoderado/anuncios"><ProtectedRoute component={ApoderadoAnuncios} roles={["apoderado"]} /></Route>
      <Route path="/apoderado/reuniones"><ProtectedRoute component={ApoderadoReuniones} roles={["apoderado"]} /></Route>

      <Route path="/profesor/dashboard"><ProtectedRoute component={ProfesorDashboard} roles={["profesor"]} /></Route>
      <Route path="/profesor/cursos"><ProtectedRoute component={ProfesorCursos} roles={["profesor"]} /></Route>
      <Route path="/profesor/asistencia"><ProtectedRoute component={ProfesorAsistencia} roles={["profesor"]} /></Route>
      <Route path="/profesor/notas"><ProtectedRoute component={ProfesorNotas} roles={["profesor"]} /></Route>
      <Route path="/profesor/reuniones"><ProtectedRoute component={ProfesorReuniones} roles={["profesor"]} /></Route>

      <Route path="/inspector/dashboard"><ProtectedRoute component={InspectorDashboard} roles={["inspector"]} /></Route>
      <Route path="/inspector/anotaciones"><ProtectedRoute component={InspectorAnotaciones} roles={["inspector"]} /></Route>
      <Route path="/inspector/reuniones"><ProtectedRoute component={InspectorReuniones} roles={["inspector"]} /></Route>

      <Route path="/admin/dashboard"><ProtectedRoute component={AdminDashboard} roles={["admin"]} /></Route>
      <Route path="/admin/usuarios"><ProtectedRoute component={AdminUsuarios} roles={["admin"]} /></Route>
      <Route path="/admin/notas"><ProtectedRoute component={AdminNotas} roles={["admin"]} /></Route>
      <Route path="/admin/anotaciones"><ProtectedRoute component={AdminAnotaciones} roles={["admin"]} /></Route>
      <Route path="/admin/reuniones"><ProtectedRoute component={AdminReuniones} roles={["admin"]} /></Route>
      <Route path="/admin/horarios"><ProtectedRoute component={AdminHorarios} roles={["admin"]} /></Route>
      <Route path="/admin/anuncios"><ProtectedRoute component={AdminAnuncios} roles={["admin"]} /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
