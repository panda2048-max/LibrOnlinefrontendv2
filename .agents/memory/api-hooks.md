---
name: API hooks disponibles en api-client-react
description: Qué hooks existen y cuáles NO existen en el cliente generado por Orval
---

## Hooks de QUERY disponibles
- useListUsers({ role? })
- useListCourses({ teacherId? })
- useListGrades({ studentId?, courseId? })
- useListSchedule({ studentId?, teacherId?, courseId? })
- useListAnnotations({ inspectorId? })
- useListMeetings({ requestedById?, withUserId? })
- useListAnnouncements()
- useListAttendance()
- useGetStudentDashboard(studentId)
- useGetTeacherDashboard(teacherId)
- useGetGradeAverage(studentId, courseId)
- useGetCourse(id)

## Hooks de MUTACIÓN disponibles
- useLogin, useLogout
- useCreateUser, useUpdateUser, useDeleteUser
- useCreateCourse
- useCreateScheduleEntry (NO hay update/delete para schedule en OpenAPI)
- useCreateGrade, useUpdateGrade, useDeleteGrade
- useCreateAttendance, useUpdateAttendance
- useCreateAnnotation, useUpdateAnnotation, useDeleteAnnotation
- useCreateMeeting, useUpdateMeeting, useDeleteMeeting
- useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement

## Hooks que NO existen
- useListStudents — usar useListUsers({ role: 'alumno' })
- useUpdateScheduleEntry — usar fetch directo: PATCH /api/schedule/:id (endpoint añadido manualmente)
- useDeleteScheduleEntry — no existe, endpoint no definido en OpenAPI

**Why:** El generador Orval solo produce hooks para endpoints definidos en openapi.yaml. useListStudents nunca estuvo en el spec; useUpdateScheduleEntry se añadió a Express manualmente pero no se regeneró el cliente.

**How to apply:** Antes de usar un hook nuevo, verificar con grep en lib/api-client-react/src/generated/api.ts.
