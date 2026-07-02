import { useState } from "react";
import {
  useListCourses, useCreateCourse, useUpdateCourse, useDeleteCourse,
  useListUsers, useListEnrollments, useCreateEnrollment, useDeleteEnrollment,
} from "@workspace/api-client-react";
import { PageLayout } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, GraduationCap, Users, ChevronDown, ChevronUp, UserPlus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

// ── Enrollment panel (shown when a course row is expanded) ─────────────────
function EnrollmentPanel({ course }) {
  const qc = useQueryClient();
  const { data: enrollments = [], refetch } = useListEnrollments({ courseId: course.id });
  const { data: allStudents = [] } = useListUsers({ role: "alumno" });
  const createEnrollment = useCreateEnrollment();
  const deleteEnrollment = useDeleteEnrollment();
  const [addStudentId, setAddStudentId] = useState("");

  const enrolledIds = new Set(enrollments.map((e) => e.studentId));
  const available = allStudents.filter((s) => !enrolledIds.has(s.id));

  const handleAdd = async () => {
    if (!addStudentId) return;
    try {
      await createEnrollment.mutateAsync({ data: { studentId: parseInt(addStudentId), courseId: course.id } });
      toast.success("Alumno matriculado");
      setAddStudentId("");
      refetch();
    } catch { toast.error("Error al matricular alumno"); }
  };

  const handleRemove = async (enrollmentId) => {
    try {
      await deleteEnrollment.mutateAsync({ id: enrollmentId });
      toast.success("Alumno desmatriculado");
      refetch();
    } catch { toast.error("Error al desmatricular"); }
  };

  return (
    <div className="px-5 pb-4 pt-1 border-t border-border bg-muted/30">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Alumnos matriculados ({enrollments.length})
      </p>
      {enrollments.length === 0 ? (
        <p className="text-xs text-muted-foreground mb-2">Sin alumnos matriculados.</p>
      ) : (
        <div className="space-y-1 mb-3">
          {enrollments.map((e) => (
            <div key={e.id} className="flex items-center gap-2 text-sm">
              <span className="flex-1 truncate">{e.studentName}</span>
              <span className="text-xs text-muted-foreground">{e.studentRut}</span>
              <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive flex-shrink-0"
                onClick={() => handleRemove(e.id)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      {available.length > 0 && (
        <div className="flex gap-2 items-center">
          <Select value={addStudentId} onValueChange={setAddStudentId}>
            <SelectTrigger className="h-8 text-xs flex-1"><SelectValue placeholder="Agregar alumno..." /></SelectTrigger>
            <SelectContent>{available.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.nombre} {s.apellido}</SelectItem>)}</SelectContent>
          </Select>
          <Button size="sm" className="h-8 gap-1 text-xs" onClick={handleAdd} disabled={!addStudentId}>
            <UserPlus className="w-3 h-3" />Matricular
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function AdminCursos() {
  const qc = useQueryClient();
  const { data: courses = [], isLoading } = useListCourses();
  const { data: users = [] } = useListUsers({ role: "profesor" });
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();

  const [open, setOpen] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState({ nombre: "", descripcion: "", profesorId: "" });

  const resetForm = () => { setForm({ nombre: "", descripcion: "", profesorId: "" }); setEditCourse(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editCourse) {
        await updateCourse.mutateAsync({ id: editCourse.id, data: { nombre: form.nombre, profesorId: parseInt(form.profesorId) } });
        toast.success("Curso actualizado");
      } else {
        await createCourse.mutateAsync({ data: { nombre: form.nombre, descripcion: form.descripcion, profesorId: parseInt(form.profesorId) } });
        toast.success("Curso creado");
      }
      setOpen(false); resetForm();
      qc.invalidateQueries({ queryKey: ["/api/courses"] });
    } catch { toast.error("Error al guardar curso"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este curso?")) return;
    try {
      await deleteCourse.mutateAsync({ id });
      toast.success("Curso eliminado");
      qc.invalidateQueries({ queryKey: ["/api/courses"] });
    } catch { toast.error("Error al eliminar"); }
  };

  const openEdit = (c) => { setEditCourse(c); setForm({ nombre: c.nombre, descripcion: c.descripcion || "", profesorId: String(c.profesorId || "") }); setOpen(true); };

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  const filteredCourses = courses.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.profesorNombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageLayout title="Gestion de Cursos">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar curso o profesor..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />Nuevo curso</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editCourse ? "Editar Curso" : "Nuevo Curso"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 mt-2">
              <div className="space-y-1.5">
                <Label>Nombre del curso</Label>
                <Input placeholder="Ej: 1° A" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required />
              </div>
              {!editCourse && (
                <div className="space-y-1.5">
                  <Label>Descripcion</Label>
                  <Input placeholder="Ej: Matematica, Lenguaje" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Profesor</Label>
                <Select value={form.profesorId} onValueChange={v => setForm(f => ({ ...f, profesorId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar profesor" /></SelectTrigger>
                  <SelectContent>{users.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.nombre} {u.apellido}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancelar</Button>
                <Button type="submit">{editCourse ? "Guardar" : "Crear"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p className="text-muted-foreground">Cargando...</p> : filteredCourses.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No se encontraron cursos.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filteredCourses.map(c => (
                <div key={c.id}>
                  <div className="flex items-center gap-3 px-5 py-3">
                    <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.nombre}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.profesorNombre}{c.descripcion ? ` · ${c.descripcion}` : ""}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs text-muted-foreground" onClick={() => toggleExpand(c.id)}>
                      <Users className="w-3.5 h-3.5" />Alumnos
                      {expandedId === c.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </Button>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                  {expandedId === c.id && <EnrollmentPanel course={c} />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </PageLayout>
  );
}
