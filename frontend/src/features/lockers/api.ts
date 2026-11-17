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

export function fetchLockerChoices(signal?: AbortSignal): Promise<LockerChoices> {
  return api.get("/lockers/choices/", lockerChoicesSchema, signal);
}

export function createLocker(payload: CreateLockerPayload): Promise<Locker> {
  return api.post("/lockers/", payload, lockerSchema);
}
