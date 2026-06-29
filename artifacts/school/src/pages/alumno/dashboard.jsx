import { useAuth } from "@/contexts/AuthContext";
import { useGetStudentDashboard, useListAnnouncements } from "@workspace/api-client-react";
import { PageLayout } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Megaphone, CalendarCheck, TrendingUp } from "lucide-react";

export default function AlumnoDashboard() {
  const { user } = useAuth();
  const { data: dashboard, isLoading } = useGetStudentDashboard(user?.id ?? 0, {
    query: { enabled: !!user?.id },
  });
  const { data: announcements = [] } = useListAnnouncements();

  return (
    <PageLayout title={`Bienvenido, ${user?.nombre}`}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {isLoading ? (
          <>{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</>
        ) : (
          <>
            <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center"><BookOpen className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold">{dashboard?.totalCourses ?? 0}</p><p className="text-sm text-muted-foreground">Cursos</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center"><CalendarCheck className="w-5 h-5 text-orange-600" /></div><div><p className="text-2xl font-bold">{dashboard?.upcomingMeetings ?? 0}</p><p className="text-sm text-muted-foreground">Reuniones pendientes</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><Megaphone className="w-5 h-5 text-green-600" /></div><div><p className="text-2xl font-bold">{announcements.length}</p><p className="text-sm text-muted-foreground">Anuncios</p></div></div></CardContent></Card>
          </>
        )}
      </div>

      {dashboard?.gradesSummary?.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="w-4 h-4" /> Promedios por ramo</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboard.gradesSummary.map(item => (
                <div key={item.courseId} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm font-medium">{item.courseName}</span>
                  <span className={`text-lg font-bold ${item.average >= 4 ? "text-green-600" : "text-red-600"}`}>{item.average.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Ultimos anuncios</CardTitle></CardHeader>
        <CardContent>
          {announcements.slice(0, 3).length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay anuncios recientes.</p>
          ) : (
            <div className="space-y-3">
              {announcements.slice(0, 3).map(a => (
                <div key={a.id} className="border-b border-border pb-3 last:border-0">
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.content.slice(0, 100)}...</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
