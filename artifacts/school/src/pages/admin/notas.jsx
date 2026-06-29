import { useState } from "react";
import {
  useListGrades, useCreateGrade, useUpdateGrade, useDeleteGrade,
  useListUsers, useListCourses
} from "@workspace/api-client-react";
import { PageLayout } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminNotas() {
  const qc = useQueryClient();
  const { data: allGrades = [], isLoading } = useListGrades({});
  const { data: students = [] } = useListUsers();
  const { data: courses = [] } = useListCourses({});
  const createGrade = useCreateGrade();
  const updateGrade = useUpdateGrade();
  const deleteGrade = useDeleteGrade();

  const [open, setOpen] = useState(false);
  const [editGrade, setEditGrade] = useState(null);
  const [form, setForm] = useState({ studentId: "", courseId: "", evaluationName: "", value: "" });

  const studentList = students.filter(u => u.role === "alumno");

  const resetForm = () => { setForm({ studentId: "", courseId: "", evaluationName: "", value: "" }); setEditGrade(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editGrade) {
        await updateGrade.mutateAsync({ id: editGrade.id, data: { evaluationName: form.evaluationName, value: parseFloat(form.value) } });
        toast.success("Nota actualizada");
      } else {
        await createGrade.mutateAsync({ data: { studentId: parseInt(form.studentId), courseId: parseInt(form.courseId), evaluationName: form.evaluationName, value: parseFloat(form.value) } });
        toast.success("Nota registrada");
      }
      setOpen(false); resetForm();
      qc.invalidateQueries({ queryKey: ["grades"] });
    } catch { toast.error("Error al guardar nota"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta nota?")) return;
    try {
      await deleteGrade.mutateAsync({ id });
      toast.success("Nota eliminada");
      qc.invalidateQueries({ queryKey: ["grades"] });
    } catch { toast.error("Error al eliminar"); }
  };

  const openEdit = (g) => {
    setEditGrade(g);
    setForm({ studentId: String(g.studentId), courseId: String(g.courseId), evaluationName: g.evaluationName, value: String(g.value) });
    setOpen(true);
  };

  return (
    <PageLayout title="Gestion de Notas">
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />Nueva nota</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editGrade ? "Editar Nota" : "Nueva Nota"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              {!editGrade && (
                <>
                  <div className="space-y-1.5">
                    <Label>Alumno</Label>
                    <Select value={form.studentId} onValueChange={v => setForm(f => ({ ...f, studentId: v }))} required>
                      <SelectTrigger><SelectValue placeholder="Seleccionar alumno" /></SelectTrigger>
                      <SelectContent>{studentList.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.nombre} {s.apellido}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Curso</Label>
                    <Select value={form.courseId} onValueChange={v => setForm(f => ({ ...f, courseId: v }))} required>
                      <SelectTrigger><SelectValue placeholder="Seleccionar curso" /></SelectTrigger>
                      <SelectContent>{courses.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </>
              )}
              {editGrade && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p><span className="text-muted-foreground">Alumno:</span> <span className="font-medium">{editGrade.studentName}</span></p>
                  <p><span className="text-muted-foreground">Curso:</span> <span className="font-medium">{editGrade.courseName}</span></p>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Nombre evaluacion</Label>
                <Input placeholder="Ej: Prueba 1" value={form.evaluationName} onChange={e => setForm(f => ({ ...f, evaluationName: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Nota (1.0 – 7.0)</Label>
                <Input type="number" step="0.1" min="1" max="7" placeholder="4.5" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} required />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancelar</Button>
                <Button type="submit">{editGrade ? "Guardar cambios" : "Registrar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p className="text-muted-foreground">Cargando...</p> : allGrades.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No hay notas registradas.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {allGrades.map(g => (
                <div key={g.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{g.studentName}</p>
                    <p className="text-xs text-muted-foreground">{g.courseName} · {g.evaluationName}</p>
                  </div>
                  <span className={`text-lg font-bold flex-shrink-0 ${g.value >= 4 ? "text-green-600" : "text-red-600"}`}>{g.value.toFixed(1)}</span>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(g)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(g.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </PageLayout>
  );
}
