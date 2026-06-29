import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useListMeetings, useCreateMeeting, useUpdateMeeting, useListUsers
} from "@workspace/api-client-react";
import { PageLayout } from "@/components/AppSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Clock, User, CalendarCheck, Pencil } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const statusColors = { pendiente: "secondary", confirmada: "default", cancelada: "destructive" };
const statusLabels = { pendiente: "Pendiente", confirmada: "Confirmada", cancelada: "Cancelada" };

export default function InspectorReuniones() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: incoming = [], isLoading: loadingIn } = useListMeetings({ withUserId: user?.id });
  const { data: outgoing = [], isLoading: loadingOut } = useListMeetings({ requestedById: user?.id });
  const { data: allUsers = [] } = useListUsers();

  const createMeeting = useCreateMeeting();
  const updateMeeting = useUpdateMeeting();

  const [newOpen, setNewOpen] = useState(false);
  const [reschedOpen, setReschedOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  const [newForm, setNewForm] = useState({ withUserId: "", scheduledAt: "", reason: "" });
  const [newScheduledAt, setNewScheduledAt] = useState("");

  const targets = allUsers.filter(u => u.id !== user?.id && ["alumno", "apoderado", "profesor"].includes(u.role));

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createMeeting.mutateAsync({
        data: {
          requestedById: user.id,
          withUserId: parseInt(newForm.withUserId),
          scheduledAt: new Date(newForm.scheduledAt).toISOString(),
          reason: newForm.reason,
          status: "pendiente",
        },
      });
      toast.success("Reunion solicitada");
      setNewOpen(false);
      setNewForm({ withUserId: "", scheduledAt: "", reason: "" });
      qc.invalidateQueries({ queryKey: ["meetings"] });
    } catch { toast.error("Error al solicitar reunion"); }
  };

  const handleAction = async (id, status) => {
    try {
      await updateMeeting.mutateAsync({ id, data: { status } });
      toast.success(status === "confirmada" ? "Reunion confirmada" : "Reunion cancelada");
      qc.invalidateQueries({ queryKey: ["meetings"] });
    } catch { toast.error("Error al actualizar"); }
  };

  const openReschedule = (m) => { setSelectedMeeting(m); setNewScheduledAt(""); setReschedOpen(true); };

  const handleReschedule = async (e) => {
    e.preventDefault();
    try {
      await updateMeeting.mutateAsync({
        id: selectedMeeting.id,
        data: { scheduledAt: new Date(newScheduledAt).toISOString(), status: "pendiente" },
      });
      toast.success("Reunion reagendada");
      setReschedOpen(false); setSelectedMeeting(null);
      qc.invalidateQueries({ queryKey: ["meetings"] });
    } catch { toast.error("Error al reagendar"); }
  };

  const isLoading = loadingIn || loadingOut;
  const allMeetings = [...incoming, ...outgoing.filter(o => !incoming.find(i => i.id === o.id))];

  return (
    <PageLayout title="Reuniones">
      <div className="flex justify-end mb-4">
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />Solicitar reunion</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Solicitar Reunion</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Con quien</Label>
                <Select value={newForm.withUserId} onValueChange={v => setNewForm(f => ({ ...f, withUserId: v }))} required>
                  <SelectTrigger><SelectValue placeholder="Seleccionar persona" /></SelectTrigger>
                  <SelectContent>
                    {targets.map(u => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.nombre} {u.apellido} ({u.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Fecha y hora</Label>
                <Input type="datetime-local" value={newForm.scheduledAt} onChange={e => setNewForm(f => ({ ...f, scheduledAt: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Motivo</Label>
                <Textarea placeholder="Describe el motivo..." value={newForm.reason} onChange={e => setNewForm(f => ({ ...f, reason: e.target.value }))} required />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setNewOpen(false)}>Cancelar</Button>
                <Button type="submit">Solicitar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={reschedOpen} onOpenChange={setReschedOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reagendar Reunion</DialogTitle></DialogHeader>
          {selectedMeeting && (
            <div className="mb-2">
              <p className="text-sm text-muted-foreground">Fecha actual: <span className="font-medium text-foreground">{new Date(selectedMeeting.scheduledAt).toLocaleString("es-CL")}</span></p>
              <p className="text-sm text-muted-foreground">Motivo: <span className="font-medium text-foreground">{selectedMeeting.reason}</span></p>
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
        : allMeetings.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">No tienes reuniones agendadas.</CardContent></Card>
        : (
          <div className="space-y-3">
            {allMeetings.map(m => {
              const isRequester = m.requestedById === user?.id;
              return (
                <Card key={m.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={statusColors[m.status] || "secondary"}>{statusLabels[m.status] || m.status}</Badge>
                          <span className="text-xs text-muted-foreground">{isRequester ? "Solicitada por ti" : "Solicitada a ti"}</span>
                        </div>
                        <p className="font-semibold text-foreground">{m.reason}</p>
                        <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {isRequester ? m.withUserName : m.requesterName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(m.scheduledAt).toLocaleString("es-CL")}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        {!isRequester && m.status === "pendiente" && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleAction(m.id, "confirmada")}>Confirmar</Button>
                            <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleAction(m.id, "cancelada")}>Cancelar</Button>
                          </div>
                        )}
                        {m.status !== "cancelada" && (
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => openReschedule(m)}>
                            <CalendarCheck className="w-3.5 h-3.5" />Reagendar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
    </PageLayout>
  );
}
