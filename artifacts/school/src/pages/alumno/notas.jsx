import { useAuth } from "@/contexts/AuthContext";
import { useListGrades, useGetGradeAverage, useGetCourse, getGetGradeAverageQueryKey } from "@workspace/api-client-react";
import { PageLayout } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from "wouter";
import { TrendingUp } from "lucide-react";

export default function AlumnoNotas() {
  const { user } = useAuth();
  const { courseId } = useParams();
  const cId = parseInt(courseId ?? "0");

  const { data: grades = [], isLoading } = useListGrades({ studentId: user?.id, courseId: cId });
  const { data: average } = useGetGradeAverage(user?.id ?? 0, cId, {
    query: { enabled: !!user?.id && !!cId, queryKey: getGetGradeAverageQueryKey(user?.id ?? 0, cId) },
  });
  const { data: course } = useGetCourse(cId);

  return (
    <PageLayout title={course ? `Notas — ${course.nombre}` : "Mis Notas"}>
      <Card className="mb-6">
        <CardContent className="pt-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Promedio general</p>
              {average ? (
                <p className={`text-4xl font-bold ${average.average >= 4 ? "text-green-600" : "text-red-600"}`}>
                  {average.average.toFixed(1)}
                </p>
              ) : <p className="text-4xl font-bold text-muted-foreground">—</p>}
              <p className="text-xs text-muted-foreground">{average?.totalGrades ?? 0} evaluaciones</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Detalle de evaluaciones</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : grades.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No hay notas registradas para este ramo.</p>
          ) : (
            <div className="space-y-0">
              {grades.map(grade => (
                <div key={grade.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{grade.evaluationName}</p>
                    <p className="text-xs text-muted-foreground">{new Date(grade.createdAt ?? "").toLocaleDateString("es-CL")}</p>
                  </div>
                  <span className={`text-xl font-bold ${grade.value >= 4 ? "text-green-600" : "text-red-600"}`}>{grade.value.toFixed(1)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
