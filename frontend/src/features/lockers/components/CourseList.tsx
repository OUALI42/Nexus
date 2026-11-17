import { Download, ExternalLink, FileText } from "lucide-react";

import type { Course } from "../api";
import { analysisStatusLabel, dateLabel, fileSizeLabel } from "../format";

const ACTION_LINK =
  "inline-flex min-h-tap items-center gap-1 px-3 font-semibold";

export function CourseList({ courses }: { courses: Course[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {courses.map((course) => (
        <li
          key={course.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface p-4"
        >
          <div className="flex min-w-0 items-start gap-3">
            <FileText aria-hidden="true" className="mt-1 size-6 shrink-0" />
            <div className="flex min-w-0 flex-col">
              <span className="font-bold break-words">{course.title}</span>
              <span>
                {fileSizeLabel(course.sizeBytes)}, ajouté le{" "}
                {dateLabel(course.createdAt)}
              </span>
              <span>{analysisStatusLabel(course.analysisStatus)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={course.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={ACTION_LINK}
            >
              Ouvrir{" "}
              <span className="sr-only">{course.title} (nouvel onglet)</span>
              <ExternalLink aria-hidden="true" className="size-4" />
            </a>
            <a href={`${course.fileUrl}?download=1`} className={ACTION_LINK}>
              <Download aria-hidden="true" className="size-4" />
              Télécharger <span className="sr-only">{course.title}</span>
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}
