import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useListUsers } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { School, LogIn } from "lucide-react";

const roleLabels = {
  alumno: "Alumno",
  apoderado: "Apoderado",
  profesor: "Profesor",
  inspector: "Inspector",
  admin: "Administrador",
};

const roleColors = {
  alumno: "bg-blue-100 text-blue-800 border-blue-200",
  apoderado: "bg-purple-100 text-purple-800 border-purple-200",
  profesor: "bg-green-100 text-green-800 border-green-200",
  inspector: "bg-orange-100 text-orange-800 border-orange-200",
  admin: "bg-red-100 text-red-800 border-red-200",
};

const routes = {
  alumno: "/alumno/dashboard",
  apoderado: "/apoderado/dashboard",
  profesor: "/profesor/dashboard",
  inspector: "/inspector/dashboard",
  admin: "/admin/dashboard",
};

export default function LoginPage() {
  const { login, loginAs, isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const [rut, setRut] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: rawUsers } = useListUsers();
  const users = Array.isArray(rawUsers) ? rawUsers : [];

  if (isAuthenticated && user) {
    setLocation(routes[user.role] || "/");
    return null;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(rut, password);
      toast.success("Sesion iniciada correctamente");
    } catch {
      toast.error("RUT o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (u) => {
    loginAs(u);
    toast.success(`Ingresando como ${u.nombre} ${u.apellido}`);
    setLocation(routes[u.role] || "/");
  };

  const roles = ["alumno", "apoderado", "profesor", "inspector", "admin"];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8">
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <School className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Instituto Escolar</h1>
              <p className="text-sm text-muted-foreground">Sistema de Gestion Academica</p>
            </div>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Plataforma integral para la gestion de alumnos, profesores, apoderados e inspectores del instituto.
          </p>
          <div className="flex flex-wrap gap-2">
            {roles.map(role => (
              <span key={role} className={`px-2.5 py-1 rounded-full text-xs font-medium border ${roleColors[role]}`}>
                {roleLabels[role]}
              </span>
            ))}
          </div>
        </div>

        <div>
          <Tabs defaultValue="demo">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="demo" className="flex-1">Acceso Rapido (Demo)</TabsTrigger>
              <TabsTrigger value="manual" className="flex-1">Iniciar Sesion</TabsTrigger>
            </TabsList>

            <TabsContent value="demo">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Selecciona un rol para explorar</CardTitle>
                  <CardDescription>Haz clic en cualquier usuario para ingresar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {roles.map(role =>
                    users.filter(u => u.role === role).map(u => (
                      <button
                        key={u.id}
                        onClick={() => handleQuickLogin(u)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-all text-left group"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${roleColors[role]}`}>
                          {u.nombre[0]}{u.apellido[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{u.nombre} {u.apellido}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.rut} — {roleLabels[role]}</p>
                        </div>
                        <LogIn className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manual">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Iniciar Sesion</CardTitle>
                  <CardDescription>Ingresa tu RUT y contraseña</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="rut">RUT</Label>
                      <Input id="rut" placeholder="12345678-9" value={rut} onChange={e => setRut(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="password">Contraseña</Label>
                      <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Ingresando..." : "Ingresar"}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Contrasena demo: <span className="font-mono font-medium">password123</span>
                    </p>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
