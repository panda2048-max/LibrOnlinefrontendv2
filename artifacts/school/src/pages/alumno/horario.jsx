import { useAuth } from "@/contexts/AuthContext";
import { useListSchedule } from "@workspace/api-client-react";
import { PageLayout } from "@/components/AppSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { ChevronRight, Clock, User, MapPin } from "lucide-react";

const DAYS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];
const dayColors = {
  Lunes: "border-l-blue-500",
  Martes: "border-l-purple-500",
  Miercoles: "border-l-green-500",
  Jueves: "border-l-orange-500",
  Viernes: "border-l-red-500",
};

export default function AlumnoHorario() {
  const { user } = useAuth();
  const { data: schedule = [], isLoading } = useListSchedule({ studentId: user?.id });
  const byDay = DAYS.map(day => ({
    day,
    entries: schedule.filter(s => s.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }));

  return (
    <PageLayout title="Mi Horario de Clases">
      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
      ) : schedule.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No hay horario disponible.</CardContent></Card>
      ) : (
        <div className="space-y-6">
          {byDay.filter(d => d.entries.length > 0).map(({ day, entries }) => (
            <div key={day}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">{day}</h2>
              <div className="space-y-2">
                {entries.map(entry => (
                  <Link key={entry.id} href={`/alumno/notas/${entry.courseId}`}>
                    <a className={`block border-l-4 ${dayColors[day] || "border-l-primary"} bg-card rounded-r-xl border border-l-0 border-border p-4 hover:shadow-sm transition-all cursor-pointer group`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{entry.courseName}</p>
                          <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{entry.startTime} – {entry.endTime}</span>
                            <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{entry.teacherName}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{entry.classroom}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </a>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
