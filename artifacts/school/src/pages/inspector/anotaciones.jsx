import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useListAnnotations, useCreateAnnotation, useUpdateAnnotation, useDeleteAnnotation,
  useListUsers,
} from "@workspace/api-client-react";
import { PageLayout } from "@/components/AppSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const typeColors = { positiva: "default", negativa: "destructive", neutral: "secondary" };
const typeLabels = { positiva: "Positiva", negativa: "Negativa", neutral: "Neutral" };

export default function InspectorAnotaciones() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: annotations = [], isLoading } = useListAnnotations({ inspectorId: user?.id });
  const { data: students = [] } = useListUsers({ role: "alumno" });
  const createAnnotation = useCreateAnnotation();
  const updateAnnotation = useUpdateAnnotation();
  const deleteAnnotation = useDeleteAnnotation();

  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ studentId: "", type: "neutral", description: "" });

  const resetForm = () => { setForm({ studentId: "", type: "neutral", description: "" }); setEditItem(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await updateAnnotation.mutateAsync({ id: editItem.id, data: { type: form.type, description: form.description } });
        toast.success("Anotacion actualizada");
      } else {
        await createAnnotation.mutateAsync({ data: { studentId: parseInt(form.studentId), inspectorId: user.id, type: form.type, description: form.description } });
        toast.success("Anotacion registrada");
      }
      setOpen(false); resetForm();
      qc.invalidateQueries({ queryKey: ["annotations"] });
    } catch { toast.error("Error al guardar anotacion"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta anotacion?")) return;
    try {
      await deleteAnnotation.mutateAsync({ id });
      toast.success("Anotacion eliminada");
      qc.invalidateQueries({ queryKey: ["annotations"] });
    } catch { toast.error("Error al eliminar"); }
  };

  const openEdit = (a) => {
    setEditItem(a);
    setForm({ studentId: String(a.studentId), type: a.type, description: a.description });
    setOpen(true);
  };

  return (
    <PageLayout title="Anotaciones">
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />Nueva anotacion</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editItem ? "Editar Anotacion" : "Nueva Anotacion"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              {!editItem && (
                <div className="space-y-1.5">
                  <Label>Alumno</Label>
                  <Select value={form.studentId} onValueChange={v => setForm(f => ({ ...f, studentId: v }))} required>
                    <SelectTrigger><SelectValue placeholder="Seleccionar alumno" /></SelectTrigger>
                    <SelectContent>
                      {students.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.nombre} {s.apellido}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positiva">Positiva</SelectItem>
                    <SelectItem value="negativa">Negativa</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Descripcion</Label>
                <Textarea placeholder="Describe la anotacion..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancelar</Button>
                <Button type="submit">{editItem ? "Guardar cambios" : "Registrar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p className="text-muted-foreground">Cargando...</p>
        : annotations.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">No hay anotaciones registradas.</CardContent></Card>
        : (
          <div className="space-y-3">
            {annotations.map(a => (
              <Card key={a.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={typeColors[a.type] || "secondary"}>{typeLabels[a.type] || a.type}</Badge>
                        <span className="text-sm font-medium">{a.studentName}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{a.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(a.createdAt).toLocaleDateString("es-CL")}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(a)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(a.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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
