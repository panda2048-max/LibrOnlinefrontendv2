import { useListUsers, useListGrades, useListAnnotations, useListMeetings, useListAnnouncements } from "@workspace/api-client-react";
import { PageLayout } from "@/components/AppSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Users, BookOpen, FileText, CalendarCheck, Megaphone } from "lucide-react";

export default function AdminDashboard() {
  const { data: users = [] } = useListUsers();
  const { data: grades = [] } = useListGrades({});
  const { data: annotations = [] } = useListAnnotations({});
  const { data: meetings = [] } = useListMeetings({});
  const { data: announcements = [] } = useListAnnouncements();

  const stats = [
    { icon: Users, label: "Usuarios", value: users.length, color: "bg-primary/10 text-primary" },
    { icon: BookOpen, label: "Notas registradas", value: grades.length, color: "bg-green-100 text-green-600" },
    { icon: FileText, label: "Anotaciones", value: annotations.length, color: "bg-orange-100 text-orange-600" },
    { icon: CalendarCheck, label: "Reuniones", value: meetings.length, color: "bg-blue-100 text-blue-600" },
    { icon: Megaphone, label: "Anuncios", value: announcements.length, color: "bg-purple-100 text-purple-600" },
  ];

  return (
    <PageLayout title="Panel de Administracion">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Card>
          <CardContent className="pt-5">
            <h3 className="font-semibold mb-3">Distribucion de roles</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {["alumno", "apoderado", "profesor", "inspector", "admin"].map(role => (
                <div key={role} className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-xl font-bold">{users.filter(u => u.role === role).length}</p>
                  <p className="text-xs text-muted-foreground capitalize">{role}s</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
