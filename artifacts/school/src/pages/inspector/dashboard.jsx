import { useAuth } from "@/contexts/AuthContext";
import { useListAnnotations } from "@workspace/api-client-react";
import { PageLayout } from "@/components/AppSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function InspectorDashboard() {
  const { user } = useAuth();
  const { data: annotations = [] } = useListAnnotations({ inspectorId: user?.id });
  const positivas = annotations.filter(a => a.type === "positiva").length;
  const negativas = annotations.filter(a => a.type === "negativa").length;
  const neutras = annotations.filter(a => a.type === "neutral").length;

  return (
    <PageLayout title={`Bienvenido, ${user?.nombre}`}>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center"><FileText className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold">{annotations.length}</p><p className="text-sm text-muted-foreground">Total</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><TrendingUp className="w-5 h-5 text-green-600" /></div><div><p className="text-2xl font-bold text-green-600">{positivas}</p><p className="text-sm text-muted-foreground">Positivas</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center"><TrendingDown className="w-5 h-5 text-red-600" /></div><div><p className="text-2xl font-bold text-red-600">{negativas}</p><p className="text-sm text-muted-foreground">Negativas</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center"><Minus className="w-5 h-5 text-gray-600" /></div><div><p className="text-2xl font-bold text-gray-600">{neutras}</p><p className="text-sm text-muted-foreground">Neutras</p></div></div></CardContent></Card>
      </div>
    </PageLayout>
  );
}
