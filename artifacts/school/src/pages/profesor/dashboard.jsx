import { useAuth } from "@/contexts/AuthContext";
import { useGetTeacherDashboard } from "@workspace/api-client-react";
import { PageLayout } from "@/components/AppSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BookOpen, CalendarCheck } from "lucide-react";

export default function ProfesorDashboard() {
  const { user } = useAuth();
  const { data: dashboard, isLoading } = useGetTeacherDashboard(user?.id ?? 0, {
    query: { enabled: !!user?.id },
  });

  return (
    <PageLayout title={`Bienvenido, ${user?.nombre}`}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoading ? (
          <>{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</>
        ) : (
          <>
            <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center"><BookOpen className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold">{dashboard?.totalCourses ?? 0}</p><p className="text-sm text-muted-foreground">Cursos asignados</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{dashboard?.totalStudents ?? 0}</p><p className="text-sm text-muted-foreground">Alumnos total</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center"><CalendarCheck className="w-5 h-5 text-orange-600" /></div><div><p className="text-2xl font-bold">{dashboard?.pendingMeetings ?? 0}</p><p className="text-sm text-muted-foreground">Reuniones pendientes</p></div></div></CardContent></Card>
          </>
        )}
      </div>
    </PageLayout>
  );
}
