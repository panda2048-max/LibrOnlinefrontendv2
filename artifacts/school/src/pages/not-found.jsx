import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl font-bold text-muted-foreground mb-4">404</p>
        <h1 className="text-2xl font-semibold text-foreground mb-2">Pagina no encontrada</h1>
        <p className="text-muted-foreground mb-6">La pagina que buscas no existe.</p>
        <Link href="/">
          <Button className="gap-2"><Home className="w-4 h-4" />Volver al inicio</Button>
        </Link>
      </div>
    </div>
  );
}
