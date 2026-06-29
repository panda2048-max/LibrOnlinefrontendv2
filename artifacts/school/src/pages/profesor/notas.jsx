import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useListCourses, useListUsers, useListGrades,
  useCreateGrade, useUpdateGrade, useDeleteGrade,
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

export default function ProfesorNotas() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: courses = [] } = useListCourses({ teacherId: user?.id });
  const [courseId, setCourseId] = useState("");
  const [studentId, setStudentId] = useState("");
  const { data: allStudents = [] } = useListUsers({ role: "alumno" });
  const { data: grades = [], isLoading } = useListGrades({
    studentId: parseInt(studentId) || 0,
    courseId: parseInt(courseId) || 0,
  });
  const createGrade = useCreateGrade();
  const updateGrade = useUpdateGrade();
  const deleteGrade = useDeleteGrade();

  const [open, setOpen] = useState(false);
  const [editGrade, setEditGrade] = useState(null);
  const [form, setForm] = useState({ evaluationName: "", value: "" });

  const resetForm = () => { setForm({ evaluationName: "", value: "" }); setEditGrade(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editGrade) {
        await updateGrade.mutateAsync({ id: editGrade.id, data: { evaluationName: form.evaluationName, value: parseFloat(form.value) } });
        toast.success("Nota actualizada");
      } else {
        await createGrade.mutateAsync({ data: { studentId: parseInt(studentId), courseId: parseInt(courseId), evaluationName: form.evaluationName, value: parseFloat(form.value) } });
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
    setForm({ evaluationName: g.evaluationName, value: String(g.value) });
    setOpen(true);
  };

  return (
    <PageLayout title="Gestionar Notas">
      <Card className="mb-6">
        <CardContent className="pt-5">
          <div className="flex gap-4 flex-wrap">
            <div className="space-y-1.5">
              <Label>Curso</Label>
              <Select value={courseId} onValueChange={v => { setCourseId(v); setStudentId(""); }}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Elegir curso..." /></SelectTrigger>
                <SelectContent>{courses.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {courseId && (
              <div className="space-y-1.5">
                <Label>Alumno</Label>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger className="w-48"><SelectValue placeholder="Elegir alumno..." /></SelectTrigger>
                  <SelectContent>{allStudents.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.nombre} {s.apellido}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {studentId && courseId && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Notas registradas</CardTitle>
            <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) resetForm(); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2"><Plus className="w-4 h-4" />Nueva nota</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editGrade ? "Editar Nota" : "Agregar Nota"}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
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
                    <Button type="submit">{editGrade ? "Guardar cambios" : "Agregar"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoading ? <p className="text-muted-foreground text-sm">Cargando...</p>
              : grades.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No hay notas para este alumno en este curso.</p>
              : (
                <div className="space-y-0">
                  {grades.map(g => (
                    <div key={g.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium">{g.evaluationName}</p>
                        <p className="text-xs text-muted-foreground">{new Date(g.createdAt ?? "").toLocaleDateString("es-CL")}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xl font-bold ${g.value >= 4 ? "text-green-600" : "text-red-600"}`}>{g.value.toFixed(1)}</span>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(g)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(g.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </CardContent>
        </Card>
      )}
    </PageLayout>
  );
}
