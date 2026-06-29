import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useListMeetings, useCreateMeeting, useUpdateMeeting, useListUsers
} from "@workspace/api-client-react";
import { PageLayout } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, CalendarCheck, Clock, User } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const statusColors = { pendiente: "secondary", confirmada: "default", cancelada: "destructive" };
const statusLabels = { pendiente: "Pendiente", confirmada: "Confirmada", cancelada: "Cancelada" };

export default function ApoderadoReuniones() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: meetings = [], isLoading } = useListMeetings({ requestedById: user?.id });
  const { data: allUsers = [] } = useListUsers();
  const createMeeting = useCreateMeeting();
  const updateMeeting = useUpdateMeeting();

  const [open, setOpen] = useState(false);
  const [withUserId, setWithUserId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [reason, setReason] = useState("");

  const targets = allUsers.filter(u => ["profesor", "inspector", "admin"].includes(u.role));

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createMeeting.mutateAsync({ data: { requestedById: user.id, withUserId: parseInt(withUserId), scheduledAt: new Date(scheduledAt).toISOString(), reason, status: "pendiente" } });
      toast.success("Reunion solicitada");
      setOpen(false); setWithUserId(""); setScheduledAt(""); setReason("");
      qc.invalidateQueries({ queryKey: ["meetings"] });
    } catch { toast.error("Error al solicitar reunion"); }
  };

  const handleCancel = async (id) => {
    try {
      await updateMeeting.mutateAsync({ id, data: { status: "cancelada" } });
      toast.success("Reunion cancelada");
      qc.invalidateQueries({ queryKey: ["meetings"] });
    } catch { toast.error("Error al cancelar"); }
  };

  return (
    <PageLayout title="Mis Reuniones">
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Solicitar reunion</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Solicitar Reunion</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Con quien</Label>
                <Select value={withUserId} onValueChange={setWithUserId} required>
                  <SelectTrigger><SelectValue placeholder="Seleccionar persona" /></SelectTrigger>
                  <SelectContent>{targets.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.nombre} {u.apellido} ({u.role})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Fecha y hora</Label>
                <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Motivo</Label>
                <Textarea placeholder="Describe el motivo de la reunion..." value={reason} onChange={e => setReason(e.target.value)} required />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit">Solicitar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p className="text-muted-foreground">Cargando...</p> : meetings.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No tienes reuniones agendadas.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {meetings.map(m => (
            <Card key={m.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1"><Badge variant={statusColors[m.status] || "secondary"}>{statusLabels[m.status] || m.status}</Badge></div>
                    <p className="font-semibold text-foreground">{m.reason}</p>
                    <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{m.withUserName}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(m.scheduledAt).toLocaleString("es-CL")}</span>
                    </div>
                  </div>
                  {m.status === "pendiente" && (
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleCancel(m.id)}>Cancelar</Button>
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
