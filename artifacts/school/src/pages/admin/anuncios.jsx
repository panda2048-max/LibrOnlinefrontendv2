import { useState } from "react";
import { useListAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
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
import { Plus, Pencil, Trash2, Calendar } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const typeColors = { anuncio: "bg-blue-100 text-blue-800", evento: "bg-green-100 text-green-800", festividad: "bg-purple-100 text-purple-800", alianza: "bg-orange-100 text-orange-800" };
const typeLabels = { anuncio: "Anuncio", evento: "Evento", festividad: "Festividad", alianza: "Alianza" };

export default function AdminAnuncios() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: announcements = [], isLoading } = useListAnnouncements();
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();

  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ title: "", content: "", type: "anuncio", eventDate: "" });

  const resetForm = () => { setForm({ title: "", content: "", type: "anuncio", eventDate: "" }); setEditItem(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { title: form.title, content: form.content, type: form.type, ...(form.eventDate && { eventDate: form.eventDate }) };
      if (editItem) {
        await updateAnnouncement.mutateAsync({ id: editItem.id, data });
        toast.success("Anuncio actualizado");
      } else {
        await createAnnouncement.mutateAsync({ data: { ...data, authorId: user.id } });
        toast.success("Anuncio publicado");
      }
      setOpen(false); resetForm();
      qc.invalidateQueries({ queryKey: ["announcements"] });
    } catch { toast.error("Error al guardar anuncio"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este anuncio?")) return;
    try {
      await deleteAnnouncement.mutateAsync({ id });
      toast.success("Anuncio eliminado");
      qc.invalidateQueries({ queryKey: ["announcements"] });
    } catch { toast.error("Error al eliminar"); }
  };

  const openEdit = (a) => {
    setEditItem(a);
    setForm({ title: a.title, content: a.content, type: a.type, eventDate: a.eventDate ? a.eventDate.split("T")[0] : "" });
    setOpen(true);
  };

  return (
    <PageLayout title="Gestion de Anuncios">
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />Nuevo anuncio</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editItem ? "Editar Anuncio" : "Nuevo Anuncio"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Titulo</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Contenido</Label>
                <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={3} required />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(typeLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Fecha del evento (opcional)</Label>
                <Input type="date" value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancelar</Button>
                <Button type="submit">{editItem ? "Guardar cambios" : "Publicar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p className="text-muted-foreground">Cargando...</p>
        : announcements.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">No hay anuncios publicados.</CardContent></Card>
        : (
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
                        <span>{new Date(a.createdAt).toLocaleDateString("es-CL")}</span>
                      </div>
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
