import { useListAnnouncements } from "@workspace/api-client-react";
import { PageLayout } from "@/components/AppSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";

const typeColors = {
  anuncio: "bg-blue-100 text-blue-800",
  evento: "bg-green-100 text-green-800",
  festividad: "bg-purple-100 text-purple-800",
  alianza: "bg-orange-100 text-orange-800",
};
const typeLabels = { anuncio: "Anuncio", evento: "Evento", festividad: "Festividad", alianza: "Alianza" };

export default function AlumnoAnuncios() {
  const { data: announcements = [], isLoading } = useListAnnouncements();
  return (
    <PageLayout title="Anuncios del Instituto">
      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : announcements.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No hay anuncios disponibles.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <Card key={a.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[a.type] || "bg-gray-100 text-gray-800"}`}>{typeLabels[a.type] || a.type}</span>
                    </div>
                    <h3 className="font-semibold text-foreground">{a.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{a.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{a.authorName}</span>
                      {a.eventDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(a.eventDate).toLocaleDateString("es-CL")}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(a.createdAt).toLocaleDateString("es-CL")}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
