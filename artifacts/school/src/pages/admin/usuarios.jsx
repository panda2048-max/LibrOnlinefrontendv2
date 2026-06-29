import { useState } from "react";
import { useListUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@workspace/api-client-react";
import { PageLayout } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const roleLabels = { alumno: "Alumno", apoderado: "Apoderado", profesor: "Profesor", inspector: "Inspector", admin: "Administrador" };
const roleColors = { alumno: "default", apoderado: "secondary", profesor: "outline", inspector: "outline", admin: "destructive" };

export default function AdminUsuarios() {
  const qc = useQueryClient();
  const { data: users = [], isLoading } = useListUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ nombre: "", apellido: "", rut: "", email: "", role: "alumno", password: "" });

  const resetForm = () => { setForm({ nombre: "", apellido: "", rut: "", email: "", role: "alumno", password: "" }); setEditUser(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editUser) {
        await updateUser.mutateAsync({ id: editUser.id, data: { nombre: form.nombre, apellido: form.apellido, email: form.email, role: form.role } });
        toast.success("Usuario actualizado");
      } else {
        await createUser.mutateAsync({ data: form });
        toast.success("Usuario creado");
      }
      setOpen(false); resetForm();
      qc.invalidateQueries({ queryKey: ["users"] });
    } catch { toast.error("Error al guardar usuario"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este usuario?")) return;
    try {
      await deleteUser.mutateAsync({ id });
      toast.success("Usuario eliminado");
      qc.invalidateQueries({ queryKey: ["users"] });
    } catch { toast.error("Error al eliminar"); }
  };

  const openEdit = (u) => { setEditUser(u); setForm({ nombre: u.nombre, apellido: u.apellido, rut: u.rut, email: u.email || "", role: u.role, password: "" }); setOpen(true); };

  return (
    <PageLayout title="Gestion de Usuarios">
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />Nuevo usuario</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editUser ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Nombre</Label>
                  <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Apellido</Label>
                  <Input value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} required />
                </div>
              </div>
              {!editUser && (
                <div className="space-y-1.5">
                  <Label>RUT</Label>
                  <Input placeholder="12345678-9" value={form.rut} onChange={e => setForm(f => ({ ...f, rut: e.target.value }))} required />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Rol</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(roleLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {!editUser && (
                <div className="space-y-1.5">
                  <Label>Contraseña</Label>
                  <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                </div>
              )}
              <div className="flex gap-2 justify-end pt-1">
                <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancelar</Button>
                <Button type="submit">{editUser ? "Guardar" : "Crear"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p className="text-muted-foreground">Cargando...</p> : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                    {u.nombre[0]}{u.apellido[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.nombre} {u.apellido}</p>
                    <p className="text-xs text-muted-foreground">{u.rut}</p>
                  </div>
                  <Badge variant={roleColors[u.role] || "secondary"}>{roleLabels[u.role] || u.role}</Badge>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(u)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(u.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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
