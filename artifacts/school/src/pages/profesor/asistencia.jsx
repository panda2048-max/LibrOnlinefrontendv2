import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useListCourses, useListUsers, useCreateAttendance } from "@workspace/api-client-react";
import { PageLayout } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function ProfesorAsistencia() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: courses = [] } = useListCourses({ teacherId: user?.id });
  const [courseId, setCourseId] = useState("");
  const { data: students = [] } = useListUsers({ role: "alumno" });
  const createAttendance = useCreateAttendance();
  const [attendance, setAttendance] = useState({});
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const handleSave = async () => {
    if (!courseId) return;
    setSaving(true);
    try {
      await Promise.all(students.map(s =>
        createAttendance.mutateAsync({
          data: {
            studentId: s.id,
            courseId: parseInt(courseId),
            date: today,
            status: attendance[s.id] || "presente",
          },
        })
      ));
      toast.success("Asistencia guardada correctamente");
      qc.invalidateQueries({ queryKey: ["attendance"] });
    } catch { toast.error("Error al guardar asistencia"); }
    finally { setSaving(false); }
  };

  return (
    <PageLayout title="Registro de Asistencia">
      <Card className="mb-6">
        <CardContent className="pt-5">
          <div className="space-y-1.5">
            <Label>Seleccionar curso</Label>
            <Select value={courseId} onValueChange={v => { setCourseId(v); setAttendance({}); }}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Elegir curso..." /></SelectTrigger>
              <SelectContent>{courses.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {courseId && students.length > 0 && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Alumnos — {new Date(today + "T12:00:00").toLocaleDateString("es-CL")}</CardTitle>
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar asistencia"}</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {students.map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm font-medium">{s.nombre} {s.apellido}</span>
                  <div className="flex gap-2">
                    {["presente", "ausente", "tardanza"].map(status => (
                      <button
                        key={status}
                        onClick={() => setAttendance(a => ({ ...a, [s.id]: status }))}
                        className="focus:outline-none"
                      >
                        <Badge
                          variant={(attendance[s.id] || "presente") === status ? "default" : "outline"}
                          className="cursor-pointer capitalize"
                        >
                          {status}
                        </Badge>
                      </button>
                    ))}
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
