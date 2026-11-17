import { z } from "zod";

import { api } from "@/shared/api";

const lockerSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    color: z.string(),
    icon: z.string(),
    position: z.number(),
    course_count: z.number(),
  })
  .transform(({ course_count, ...locker }) => ({
    ...locker,
    courseCount: course_count,
  }));

export type Locker = z.output<typeof lockerSchema>;

const choiceSchema = z.object({ value: z.string(), label: z.string() });

const lockerChoicesSchema = z.object({
  colors: z.array(choiceSchema),
  icons: z.array(choiceSchema),
});

export type LockerChoice = z.infer<typeof choiceSchema>;
export type LockerChoices = z.infer<typeof lockerChoicesSchema>;

export type CreateLockerPayload = {
  name: string;
  color: string;
  icon: string;
};

export function fetchLockers(signal?: AbortSignal): Promise<Locker[]> {
  return api.get("/lockers/", z.array(lockerSchema), signal);
}

export function fetchLocker(id: number, signal?: AbortSignal): Promise<Locker> {
  return api.get(`/lockers/${id}/`, lockerSchema, signal);
}

export function fetchLockerChoices(
  signal?: AbortSignal,
): Promise<LockerChoices> {
  return api.get("/lockers/choices/", lockerChoicesSchema, signal);
}

export function createLocker(payload: CreateLockerPayload): Promise<Locker> {
  return api.post("/lockers/", payload, lockerSchema);
}

const courseSchema = z
  .object({
    id: z.number(),
    title: z.string(),
    size_bytes: z.number(),
    // A plain string: a new back-end status must not break the whole list.
    analysis_status: z.string(),
    created_at: z.string(),
    file_url: z.string(),
  })
  .transform((course) => ({
    id: course.id,
    title: course.title,
    sizeBytes: course.size_bytes,
    analysisStatus: course.analysis_status,
    createdAt: course.created_at,
    fileUrl: course.file_url,
  }));

export type Course = z.output<typeof courseSchema>;

export function fetchCourses(
  lockerId: number,
  signal?: AbortSignal,
): Promise<Course[]> {
  return api.get(
    `/lockers/${lockerId}/courses/`,
    z.array(courseSchema),
    signal,
  );
}

export function uploadCourse(lockerId: number, file: File): Promise<Course> {
  const body = new FormData();
  body.append("file", file);
  return api.post(`/lockers/${lockerId}/courses/`, body, courseSchema);
}
