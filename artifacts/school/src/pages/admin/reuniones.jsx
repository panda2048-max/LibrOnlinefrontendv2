import { useState } from "react";
import { useListMeetings, useUpdateMeeting, useDeleteMeeting } from "@workspace/api-client-react";
import { PageLayout } from "@/components/AppSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Clock, User, CalendarCheck, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const statusColors = { pendiente: "secondary", confirmada: "default", cancelada: "destructive" };
const statusLabels = { pendiente: "Pendiente", confirmada: "Confirmada", cancelada: "Cancelada" };

export default function AdminReuniones() {
  const qc = useQueryClient();
  const { data: meetings = [], isLoading } = useListMeetings({});
  const updateMeeting = useUpdateMeeting();
  const deleteMeeting = useDeleteMeeting();

  const [reschedOpen, setReschedOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [newScheduledAt, setNewScheduledAt] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = filterStatus === "all" ? meetings : meetings.filter(m => m.status === filterStatus);

  const openReschedule = (m) => {
    setSelectedMeeting(m);
    const dt = new Date(m.scheduledAt);
    const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setNewScheduledAt(local);
    setReschedOpen(true);
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    try {
      await updateMeeting.mutateAsync({ id: selectedMeeting.id, data: { scheduledAt: new Date(newScheduledAt).toISOString(), status: "pendiente" } });
      toast.success("Reunion reagendada");
      setReschedOpen(false); setSelectedMeeting(null);
      qc.invalidateQueries({ queryKey: ["meetings"] });
    } catch { toast.error("Error al reagendar"); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateMeeting.mutateAsync({ id, data: { status } });
      toast.success("Estado actualizado");
      qc.invalidateQueries({ queryKey: ["meetings"] });
    } catch { toast.error("Error al actualizar"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta reunion?")) return;
    try {
      await deleteMeeting.mutateAsync({ id });
      toast.success("Reunion eliminada");
      qc.invalidateQueries({ queryKey: ["meetings"] });
    } catch { toast.error("Error al eliminar"); }
  };

  return (
    <PageLayout title="Gestion de Reuniones">
      <div className="flex items-center gap-3 mb-4 justify-end">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="pendiente">Pendientes</SelectItem>
            <SelectItem value="confirmada">Confirmadas</SelectItem>
            <SelectItem value="cancelada">Canceladas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Dialog open={reschedOpen} onOpenChange={setReschedOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reagendar Reunion</DialogTitle></DialogHeader>
          {selectedMeeting && (
            <div className="mb-2 p-3 bg-muted rounded-lg text-sm space-y-1">
              <p><span className="text-muted-foreground">Motivo:</span> <span className="font-medium">{selectedMeeting.reason}</span></p>
              <p><span className="text-muted-foreground">Entre:</span> <span className="font-medium">{selectedMeeting.requesterName} y {selectedMeeting.withUserName}</span></p>
              <p><span className="text-muted-foreground">Fecha actual:</span> <span className="font-medium">{new Date(selectedMeeting.scheduledAt).toLocaleString("es-CL")}</span></p>
            </div>
          )}
          <form onSubmit={handleReschedule} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nueva fecha y hora</Label>
              <Input type="datetime-local" value={newScheduledAt} onChange={e => setNewScheduledAt(e.target.value)} required />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setReschedOpen(false)}>Cancelar</Button>
              <Button type="submit">Reagendar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? <p className="text-muted-foreground">Cargando...</p>
        : filtered.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">No hay reuniones.</CardContent></Card>
        : (
          <div className="space-y-3">
            {filtered.map(m => (
              <Card key={m.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={statusColors[m.status] || "secondary"}>{statusLabels[m.status] || m.status}</Badge>
                      </div>
                      <p className="font-semibold text-foreground">{m.reason}</p>
                      <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{m.requesterName} → {m.withUserName}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(m.scheduledAt).toLocaleString("es-CL")}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => openReschedule(m)}>
                        <CalendarCheck className="w-3.5 h-3.5" />Reagendar
                      </Button>
                      <div className="flex gap-1">
                        {m.status !== "confirmada" && <Button size="sm" variant="ghost" onClick={() => handleStatusChange(m.id, "confirmada")} className="text-xs">Confirmar</Button>}
                        {m.status !== "cancelada" && <Button size="sm" variant="ghost" onClick={() => handleStatusChange(m.id, "cancelada")} className="text-xs text-destructive hover:text-destructive">Cancelar</Button>}
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(m.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </PageLayout>
  );
}
