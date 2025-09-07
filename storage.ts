import { 
  colleges, events, students, registrations, attendance, feedback,
  type College, type InsertCollege,
  type Event, type InsertEvent,
  type Student, type InsertStudent,
  type Registration, type InsertRegistration,
  type Attendance, type InsertAttendance,
  type Feedback, type InsertFeedback
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, avg, sql } from "drizzle-orm";

export interface IStorage {
  // Colleges
  getColleges(): Promise<College[]>;
  getCollege(id: string): Promise<College | undefined>;
  createCollege(college: InsertCollege): Promise<College>;
  updateCollege(id: string, college: Partial<InsertCollege>): Promise<College | undefined>;
  deleteCollege(id: string): Promise<boolean>;

  // Events
  getEvents(): Promise<(Event & { college: College; registrationCount: number })[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;

  // Students
  getStudents(): Promise<(Student & { college: College })[]>;
  getStudent(id: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: string): Promise<boolean>;

  // Registrations
  getRegistrations(): Promise<(Registration & { event: Event; student: Student })[]>;
  getRegistration(id: string): Promise<Registration | undefined>;
  createRegistration(registration: InsertRegistration): Promise<Registration>;
  deleteRegistration(id: string): Promise<boolean>;

  // Attendance
  getAttendanceByEvent(eventId: string): Promise<(Attendance & { registration: Registration & { student: Student } })[]>;
  markAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: string, attended: boolean): Promise<Attendance | undefined>;

  // Feedback
  getFeedbackByEvent(eventId: string): Promise<(Feedback & { registration: Registration & { student: Student } })[]>;
  submitFeedback(feedback: InsertFeedback): Promise<Feedback>;

  // Reports
  getEventRegistrationStats(): Promise<{ eventId: string; eventName: string; totalRegistrations: number }[]>;
  getEventAttendanceStats(): Promise<{ eventId: string; eventName: string; attendancePercentage: number }[]>;
  getEventFeedbackStats(): Promise<{ eventId: string; eventName: string; averageRating: number }[]>;
  getEventPopularityReport(): Promise<{ eventId: string; eventName: string; registrations: number }[]>;
  getStudentParticipationReport(): Promise<{ studentId: string; studentName: string; eventsAttended: number }[]>;
  getTopActiveStudents(): Promise<{ studentId: string; studentName: string; eventsAttended: number }[]>;
  getDashboardStats(): Promise<{
    totalEvents: number;
    totalStudents: number;
    totalRegistrations: number;
    averageAttendanceRate: number;
    averageRating: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Colleges
  async getColleges(): Promise<College[]> {
    return await db.select().from(colleges).orderBy(colleges.name);
  }

  async getCollege(id: string): Promise<College | undefined> {
    const [college] = await db.select().from(colleges).where(eq(colleges.id, id));
    return college || undefined;
  }

  async createCollege(college: InsertCollege): Promise<College> {
    const [newCollege] = await db.insert(colleges).values(college).returning();
    return newCollege;
  }

  async updateCollege(id: string, college: Partial<InsertCollege>): Promise<College | undefined> {
    const [updatedCollege] = await db.update(colleges)
      .set({ ...college, updatedAt: new Date() })
      .where(eq(colleges.id, id))
      .returning();
    return updatedCollege || undefined;
  }

  async deleteCollege(id: string): Promise<boolean> {
    const result = await db.delete(colleges).where(eq(colleges.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Events
  async getEvents(): Promise<(Event & { college: College; registrationCount: number })[]> {
    const result = await db
      .select({
        id: events.id,
        collegeId: events.collegeId,
        name: events.name,
        type: events.type,
        description: events.description,
        date: events.date,
        maxCapacity: events.maxCapacity,
        createdBy: events.createdBy,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        college: colleges,
        registrationCount: count(registrations.id),
      })
      .from(events)
      .leftJoin(colleges, eq(events.collegeId, colleges.id))
      .leftJoin(registrations, eq(events.id, registrations.eventId))
      .groupBy(events.id, colleges.id)
      .orderBy(desc(events.date));

    return result.map(row => ({
      ...row,
      college: row.college!,
      registrationCount: Number(row.registrationCount),
    }));
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const [updatedEvent] = await db.update(events)
      .set({ ...event, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return updatedEvent || undefined;
  }

  async deleteEvent(id: string): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Students
  async getStudents(): Promise<(Student & { college: College })[]> {
    const result = await db
      .select({
        id: students.id,
        name: students.name,
        email: students.email,
        collegeId: students.collegeId,
        createdAt: students.createdAt,
        updatedAt: students.updatedAt,
        college: colleges,
      })
      .from(students)
      .leftJoin(colleges, eq(students.collegeId, colleges.id))
      .orderBy(students.name);

    return result.map(row => ({
      ...row,
      college: row.college!,
    }));
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student || undefined;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [newStudent] = await db.insert(students).values(student).returning();
    return newStudent;
  }

  async updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student | undefined> {
    const [updatedStudent] = await db.update(students)
      .set({ ...student, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    return updatedStudent || undefined;
  }

  async deleteStudent(id: string): Promise<boolean> {
    const result = await db.delete(students).where(eq(students.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Registrations
  async getRegistrations(): Promise<(Registration & { event: Event; student: Student })[]> {
    const result = await db
      .select({
        id: registrations.id,
        eventId: registrations.eventId,
        studentId: registrations.studentId,
        registeredAt: registrations.registeredAt,
        event: events,
        student: students,
      })
      .from(registrations)
      .leftJoin(events, eq(registrations.eventId, events.id))
      .leftJoin(students, eq(registrations.studentId, students.id))
      .orderBy(desc(registrations.registeredAt));

    return result.map(row => ({
      ...row,
      event: row.event!,
      student: row.student!,
    }));
  }

  async getRegistration(id: string): Promise<Registration | undefined> {
    const [registration] = await db.select().from(registrations).where(eq(registrations.id, id));
    return registration || undefined;
  }

  async createRegistration(registration: InsertRegistration): Promise<Registration> {
    const [newRegistration] = await db.insert(registrations).values(registration).returning();
    return newRegistration;
  }

  async deleteRegistration(id: string): Promise<boolean> {
    const result = await db.delete(registrations).where(eq(registrations.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Attendance
  async getAttendanceByEvent(eventId: string): Promise<(Attendance & { registration: Registration & { student: Student } })[]> {
    const result = await db
      .select({
        id: attendance.id,
        registrationId: attendance.registrationId,
        attended: attendance.attended,
        markedAt: attendance.markedAt,
        regId: registrations.id,
        regEventId: registrations.eventId,
        regStudentId: registrations.studentId,
        regRegisteredAt: registrations.registeredAt,
        studentId: students.id,
        studentName: students.name,
        studentEmail: students.email,
        studentCollegeId: students.collegeId,
        studentCreatedAt: students.createdAt,
        studentUpdatedAt: students.updatedAt,
      })
      .from(attendance)
      .leftJoin(registrations, eq(attendance.registrationId, registrations.id))
      .leftJoin(students, eq(registrations.studentId, students.id))
      .where(eq(registrations.eventId, eventId));

    return result.map(row => ({
      id: row.id,
      registrationId: row.registrationId,
      attended: row.attended,
      markedAt: row.markedAt,
      registration: {
        id: row.regId!,
        eventId: row.regEventId!,
        studentId: row.regStudentId!,
        registeredAt: row.regRegisteredAt!,
        student: {
          id: row.studentId!,
          name: row.studentName!,
          email: row.studentEmail!,
          collegeId: row.studentCollegeId!,
          createdAt: row.studentCreatedAt!,
          updatedAt: row.studentUpdatedAt!,
        },
      },
    }));
  }

  async markAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const [newAttendance] = await db.insert(attendance).values(attendanceData).returning();
    return newAttendance;
  }

  async updateAttendance(id: string, attended: boolean): Promise<Attendance | undefined> {
    const [updatedAttendance] = await db.update(attendance)
      .set({ attended, markedAt: new Date() })
      .where(eq(attendance.id, id))
      .returning();
    return updatedAttendance || undefined;
  }

  // Feedback
  async getFeedbackByEvent(eventId: string): Promise<(Feedback & { registration: Registration & { student: Student } })[]> {
    const result = await db
      .select({
        id: feedback.id,
        registrationId: feedback.registrationId,
        rating: feedback.rating,
        comment: feedback.comment,
        submittedAt: feedback.submittedAt,
        regId: registrations.id,
        regEventId: registrations.eventId,
        regStudentId: registrations.studentId,
        regRegisteredAt: registrations.registeredAt,
        studentId: students.id,
        studentName: students.name,
        studentEmail: students.email,
        studentCollegeId: students.collegeId,
        studentCreatedAt: students.createdAt,
        studentUpdatedAt: students.updatedAt,
      })
      .from(feedback)
      .leftJoin(registrations, eq(feedback.registrationId, registrations.id))
      .leftJoin(students, eq(registrations.studentId, students.id))
      .where(eq(registrations.eventId, eventId));

    return result.map(row => ({
      id: row.id,
      registrationId: row.registrationId,
      rating: row.rating,
      comment: row.comment,
      submittedAt: row.submittedAt,
      registration: {
        id: row.regId!,
        eventId: row.regEventId!,
        studentId: row.regStudentId!,
        registeredAt: row.regRegisteredAt!,
        student: {
          id: row.studentId!,
          name: row.studentName!,
          email: row.studentEmail!,
          collegeId: row.studentCollegeId!,
          createdAt: row.studentCreatedAt!,
          updatedAt: row.studentUpdatedAt!,
        },
      },
    }));
  }

  async submitFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const [newFeedback] = await db.insert(feedback).values(feedbackData).returning();
    return newFeedback;
  }

  // Reports
  async getEventRegistrationStats(): Promise<{ eventId: string; eventName: string; totalRegistrations: number }[]> {
    const result = await db
      .select({
        eventId: events.id,
        eventName: events.name,
        totalRegistrations: count(registrations.id),
      })
      .from(events)
      .leftJoin(registrations, eq(events.id, registrations.eventId))
      .groupBy(events.id, events.name)
      .orderBy(desc(count(registrations.id)));

    return result.map(row => ({
      ...row,
      totalRegistrations: Number(row.totalRegistrations),
    }));
  }

  async getEventAttendanceStats(): Promise<{ eventId: string; eventName: string; attendancePercentage: number }[]> {
    const result = await db
      .select({
        eventId: events.id,
        eventName: events.name,
        totalRegistrations: count(registrations.id),
        attendedCount: sql<number>`SUM(CASE WHEN ${attendance.attended} THEN 1 ELSE 0 END)`,
      })
      .from(events)
      .leftJoin(registrations, eq(events.id, registrations.eventId))
      .leftJoin(attendance, eq(registrations.id, attendance.registrationId))
      .groupBy(events.id, events.name)
      .having(sql`COUNT(${registrations.id}) > 0`);

    return result.map(row => ({
      eventId: row.eventId,
      eventName: row.eventName,
      attendancePercentage: Number(row.totalRegistrations) > 0 
        ? Math.round((Number(row.attendedCount) / Number(row.totalRegistrations)) * 100)
        : 0,
    }));
  }

  async getEventFeedbackStats(): Promise<{ eventId: string; eventName: string; averageRating: number }[]> {
    const result = await db
      .select({
        eventId: events.id,
        eventName: events.name,
        averageRating: avg(feedback.rating),
      })
      .from(events)
      .leftJoin(registrations, eq(events.id, registrations.eventId))
      .leftJoin(feedback, eq(registrations.id, feedback.registrationId))
      .groupBy(events.id, events.name)
      .having(sql`COUNT(${feedback.id}) > 0`);

    return result.map(row => ({
      eventId: row.eventId,
      eventName: row.eventName,
      averageRating: Number(row.averageRating) || 0,
    }));
  }

  async getEventPopularityReport(): Promise<{ eventId: string; eventName: string; registrations: number }[]> {
    const result = await db
      .select({
        eventId: events.id,
        eventName: events.name,
        registrations: count(registrations.id),
      })
      .from(events)
      .leftJoin(registrations, eq(events.id, registrations.eventId))
      .groupBy(events.id, events.name)
      .orderBy(desc(count(registrations.id)))
      .limit(10);

    return result.map(row => ({
      eventId: row.eventId,
      eventName: row.eventName,
      registrations: Number(row.registrations),
    }));
  }

  async getStudentParticipationReport(): Promise<{ studentId: string; studentName: string; eventsAttended: number }[]> {
    const result = await db
      .select({
        studentId: students.id,
        studentName: students.name,
        eventsAttended: sql<number>`SUM(CASE WHEN ${attendance.attended} THEN 1 ELSE 0 END)`,
      })
      .from(students)
      .leftJoin(registrations, eq(students.id, registrations.studentId))
      .leftJoin(attendance, eq(registrations.id, attendance.registrationId))
      .groupBy(students.id, students.name)
      .orderBy(desc(sql`SUM(CASE WHEN ${attendance.attended} THEN 1 ELSE 0 END)`));

    return result.map(row => ({
      studentId: row.studentId,
      studentName: row.studentName,
      eventsAttended: Number(row.eventsAttended) || 0,
    }));
  }

  async getTopActiveStudents(): Promise<{ studentId: string; studentName: string; eventsAttended: number }[]> {
    const result = await this.getStudentParticipationReport();
    return result.slice(0, 3);
  }

  async getDashboardStats(): Promise<{
    totalEvents: number;
    totalStudents: number;
    totalRegistrations: number;
    averageAttendanceRate: number;
    averageRating: number;
  }> {
    const [eventsCount] = await db.select({ count: count() }).from(events);
    const [studentsCount] = await db.select({ count: count() }).from(students);
    const [registrationsCount] = await db.select({ count: count() }).from(registrations);
    
    const [attendanceStats] = await db
      .select({
        totalRegistrations: count(registrations.id),
        attendedCount: sql<number>`SUM(CASE WHEN ${attendance.attended} THEN 1 ELSE 0 END)`,
      })
      .from(registrations)
      .leftJoin(attendance, eq(registrations.id, attendance.registrationId));

    const [feedbackStats] = await db
      .select({
        averageRating: avg(feedback.rating),
      })
      .from(feedback);

    const averageAttendanceRate = Number(attendanceStats.totalRegistrations) > 0
      ? Math.round((Number(attendanceStats.attendedCount) / Number(attendanceStats.totalRegistrations)) * 100)
      : 0;

    return {
      totalEvents: Number(eventsCount.count),
      totalStudents: Number(studentsCount.count),
      totalRegistrations: Number(registrationsCount.count),
      averageAttendanceRate,
      averageRating: Number(feedbackStats.averageRating) || 0,
    };
  }
}

export const storage = new DatabaseStorage();
