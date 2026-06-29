import { useAuth } from "@/contexts/AuthContext";
import { useListCourses, useListUsers } from "@workspace/api-client-react";
import { PageLayout } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Users, ChevronDown, ChevronUp } from "lucide-react";

function CourseCard({ course }) {
  const [open, setOpen] = useState(false);
  const { data: allStudents = [], isLoading } = useListUsers({ role: "alumno" });
  const students = allStudents;

  return (
    <Card>
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{course.nombre}</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />{students.length} alumnos
            </p>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </CardHeader>
      {open && (
        <CardContent className="pt-0">
          {isLoading ? <Skeleton className="h-20" /> : students.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin alumnos.</p>
          ) : (
            <div className="space-y-1">
              {students.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 py-1.5 border-b border-border last:border-0">
                  <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                  <span className="text-sm font-medium">{s.nombre} {s.apellido}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{s.rut}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function ProfesorCursos() {
  const { user } = useAuth();
  const { data: courses = [], isLoading } = useListCourses({ teacherId: user?.id });

  return (
    <PageLayout title="Mis Cursos">
      {isLoading ? <div className="space-y-4">{[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        : courses.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">No tienes cursos asignados.</CardContent></Card>
        : <div className="space-y-3">{courses.map(c => <CourseCard key={c.id} course={c} />)}</div>}
    </PageLayout>
  );
}
