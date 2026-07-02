import { useAuth } from "@/contexts/AuthContext";
import { useListEnrollments, useListCourses } from "@workspace/api-client-react";
import { PageLayout } from "@/components/AppSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { GraduationCap, User, BookOpen, ChevronRight } from "lucide-react";

const courseColors = [
  "border-l-blue-500",
  "border-l-purple-500",
  "border-l-green-500",
  "border-l-orange-500",
  "border-l-red-500",
  "border-l-teal-500",
];

export default function AlumnoCursos() {
  const { user } = useAuth();
  const { data: enrollments = [], isLoading: loadingEnrollments } = useListEnrollments(
    { studentId: user?.id },
    { query: { enabled: !!user?.id } }
  );
  const { data: courses = [], isLoading: loadingCourses } = useListCourses();

  const isLoading = loadingEnrollments || loadingCourses;

  const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));
  const myCourses = courses.filter((c) => enrolledCourseIds.has(c.id));

  return (
    <PageLayout title="Mis Cursos">
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : myCourses.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <GraduationCap className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No estás inscrito en ningún curso.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {myCourses.map((course, idx) => (
            <Link key={course.id} href={`/alumno/notas/${course.id}`}>
              <a className={`block border-l-4 ${courseColors[idx % courseColors.length]} bg-card rounded-r-xl border border-l-0 border-border p-5 hover:shadow-sm transition-all cursor-pointer group`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className="w-4 h-4 text-muted-foreground" />
                      <p className="font-semibold text-foreground text-lg">{course.nombre}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {course.profesorNombre}
                      </span>
                      {course.descripcion && (
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          {course.descripcion}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </a>
            </Link>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
