import { useState } from "react";
import { useListSchedule, useCreateScheduleEntry, useListCourses } from "@workspace/api-client-react";
import { PageLayout } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Clock, MapPin, User, Pencil } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const DAYS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];

async function apiPatchSchedule(id, data) {
  const res = await fetch(`/api/schedule/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar horario");
  return res.json();
}

export default function AdminHorarios() {
  const qc = useQueryClient();
  const { data: schedule = [], isLoading } = useListSchedule({});
  const { data: courses = [] } = useListCourses({});
  const createEntry = useCreateScheduleEntry();

  const [newOpen, setNewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);

  const [newForm, setNewForm] = useState({ courseId: "", dayOfWeek: "", startTime: "", endTime: "", classroom: "" });
  const [editForm, setEditForm] = useState({ dayOfWeek: "", startTime: "", endTime: "", classroom: "" });

  const [filterDay, setFilterDay] = useState("all");

  const filtered = filterDay === "all" ? schedule : schedule.filter(s => s.dayOfWeek === filterDay);
  const byDay = DAYS.filter(d => filterDay === "all" || d === filterDay).map(day => ({
    day,
    entries: filtered.filter(s => s.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime)),
  })).filter(d => d.entries.length > 0);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createEntry.mutateAsync({ data: { courseId: parseInt(newForm.courseId), dayOfWeek: newForm.dayOfWeek, startTime: newForm.startTime, endTime: newForm.endTime, classroom: newForm.classroom } });
      toast.success("Entrada de horario creada");
      setNewOpen(false);
      setNewForm({ courseId: "", dayOfWeek: "", startTime: "", endTime: "", classroom: "" });
      qc.invalidateQueries({ queryKey: ["schedule"] });
    } catch { toast.error("Error al crear horario"); }
  };

  const openEdit = (entry) => {
    setEditEntry(entry);
    setEditForm({ dayOfWeek: entry.dayOfWeek, startTime: entry.startTime, endTime: entry.endTime, classroom: entry.classroom });
    setEditOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await apiPatchSchedule(editEntry.id, editForm);
      toast.success("Horario actualizado");
      setEditOpen(false); setEditEntry(null);
      qc.invalidateQueries({ queryKey: ["schedule"] });
    } catch { toast.error("Error al actualizar horario"); }
  };

  return (
    <PageLayout title="Gestion de Horarios">
      <div className="flex items-center gap-3 mb-4 justify-between">
        <Select value={filterDay} onValueChange={setFilterDay}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los dias</SelectItem>
            {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />Nueva entrada</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Agregar Entrada de Horario</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Curso</Label>
                <Select value={newForm.courseId} onValueChange={v => setNewForm(f => ({ ...f, courseId: v }))} required>
                  <SelectTrigger><SelectValue placeholder="Seleccionar curso" /></SelectTrigger>
                  <SelectContent>{courses.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Dia</Label>
                <Select value={newForm.dayOfWeek} onValueChange={v => setNewForm(f => ({ ...f, dayOfWeek: v }))} required>
                  <SelectTrigger><SelectValue placeholder="Seleccionar dia" /></SelectTrigger>
                  <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Hora inicio</Label>
                  <Input type="time" value={newForm.startTime} onChange={e => setNewForm(f => ({ ...f, startTime: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Hora fin</Label>
                  <Input type="time" value={newForm.endTime} onChange={e => setNewForm(f => ({ ...f, endTime: e.target.value }))} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Sala</Label>
                <Input placeholder="Ej: Sala 101" value={newForm.classroom} onChange={e => setNewForm(f => ({ ...f, classroom: e.target.value }))} required />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setNewOpen(false)}>Cancelar</Button>
                <Button type="submit">Agregar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Horario</DialogTitle></DialogHeader>
          {editEntry && (
            <div className="mb-2 p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium">{editEntry.courseName}</p>
              <p className="text-muted-foreground">{editEntry.teacherName}</p>
            </div>
          )}
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Dia</Label>
              <Select value={editForm.dayOfWeek} onValueChange={v => setEditForm(f => ({ ...f, dayOfWeek: v }))} required>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Hora inicio</Label>
                <Input type="time" value={editForm.startTime} onChange={e => setEditForm(f => ({ ...f, startTime: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Hora fin</Label>
                <Input type="time" value={editForm.endTime} onChange={e => setEditForm(f => ({ ...f, endTime: e.target.value }))} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Sala</Label>
              <Input value={editForm.classroom} onChange={e => setEditForm(f => ({ ...f, classroom: e.target.value }))} required />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar cambios</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? <p className="text-muted-foreground">Cargando...</p>
        : byDay.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">No hay entradas de horario.</CardContent></Card>
        : (
          <div className="space-y-6">
            {byDay.map(({ day, entries }) => (
              <div key={day}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">{day}</h2>
                <div className="space-y-2">
                  {entries.map(entry => (
                    <Card key={entry.id}>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{entry.courseName}</p>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{entry.startTime} – {entry.endTime}</span>
                              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{entry.teacherName}</span>
                              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{entry.classroom}</span>
                            </div>
                          </div>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(entry)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
    </PageLayout>
  );
}
