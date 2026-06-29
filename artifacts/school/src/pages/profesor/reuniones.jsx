import { useAuth } from "@/contexts/AuthContext";
import { useListMeetings, useUpdateMeeting } from "@workspace/api-client-react";
import { PageLayout } from "@/components/AppSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Clock, User } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const statusColors = { pendiente: "secondary", confirmada: "default", cancelada: "destructive" };
const statusLabels = { pendiente: "Pendiente", confirmada: "Confirmada", cancelada: "Cancelada" };

export default function ProfesorReuniones() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: meetings = [], isLoading } = useListMeetings({ withUserId: user?.id });
  const updateMeeting = useUpdateMeeting();

  const handleAction = async (id, status) => {
    try {
      await updateMeeting.mutateAsync({ id, data: { status } });
      toast.success(status === "confirmada" ? "Reunion confirmada" : "Reunion cancelada");
      qc.invalidateQueries({ queryKey: ["meetings"] });
    } catch { toast.error("Error al actualizar reunion"); }
  };

  return (
    <PageLayout title="Mis Reuniones">
      {isLoading ? <p className="text-muted-foreground">Cargando...</p>
        : meetings.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">No tienes reuniones agendadas.</CardContent></Card>
        : (
          <div className="space-y-3">
            {meetings.map(m => (
              <Card key={m.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1"><Badge variant={statusColors[m.status] || "secondary"}>{statusLabels[m.status] || m.status}</Badge></div>
                      <p className="font-semibold text-foreground">{m.reason}</p>
                      <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />Solicitado por: {m.requesterName}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(m.scheduledAt).toLocaleString("es-CL")}</span>
                      </div>
                    </div>
                    {m.status === "pendiente" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleAction(m.id, "confirmada")}>Confirmar</Button>
                        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleAction(m.id, "cancelada")}>Cancelar</Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </PageLayout>
  );
}
