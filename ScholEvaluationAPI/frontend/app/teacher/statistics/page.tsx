'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiUrl } from "@/lib/api";

interface Student {
  id: number;
  name: string;
  studentcode: string;
  studentclass: string;
  group: string;
}

interface TeacherClass {
  classname: string;
  studentclasses: {
    students: Student[] | null;
  } | null;
}

interface Teacher {
  subjectid: number;
  subjectname: string | null;
  subjects: { subjectName: string } | null;
  teatcherstudents: TeacherClass[] | null;
}

interface ExerciseQuestion {
  degrees?: number | null;
}

interface Exercise {
  id: number;
  classname: string;
  subjectid: number;
  type: string;
  evaluationNum: string | number;
  degrees?: number | null;
  question: ExerciseQuestion[] | null;
  qwrites: ExerciseQuestion[] | null;
  paragraphs: {
    question: ExerciseQuestion[] | null;
    qwrites: ExerciseQuestion[] | null;
  }[] | null;
}

interface SolvedExercise {
  id: number;
  studentid: number;
  exerciseid: number;
  correctanswer: number;
  totalanswer: number;
  iscorrected: boolean | null;
  senddate: string;
}

interface StatisticsData {
  teacher: Teacher;
  exercises: Exercise[];
  submissions: SolvedExercise[];
}

interface CategoryStatistics {
  completed: number;
  total: number;
  correct: number;
  possible: number;
}

interface StudentStatistics {
  student: Student;
  evaluations: CategoryStatistics;
  classAssignments: CategoryStatistics;
  homework: CategoryStatistics;
  other: CategoryStatistics;
  total: CategoryStatistics;
  uncorrected: number;
}

const categories = [
  { key: "evaluations", title: "Evaluations" },
  { key: "classAssignments", title: "Class assignments" },
  { key: "homework", title: "Homework" },
  { key: "other", title: "Other" },
] as const;

type CategoryKey = typeof categories[number]["key"];

function getExerciseDegrees(exercise: Exercise) {
  if (typeof exercise.degrees === "number") {
    return exercise.degrees;
  }

  const questionDegrees = (questions: ExerciseQuestion[] | null) =>
    (questions ?? []).reduce((total, question) => total + (question.degrees ?? 1), 0);
  const writtenDegrees = (questions: ExerciseQuestion[] | null) =>
    (questions ?? []).reduce((total, question) => total + (question.degrees ?? 0), 0);

  return questionDegrees(exercise.question)
    + writtenDegrees(exercise.qwrites)
    + (exercise.paragraphs ?? []).reduce(
      (total, paragraph) => total
        + questionDegrees(paragraph.question)
        + writtenDegrees(paragraph.qwrites),
      0,
    );
}

function getCategoryKey(type: string): typeof categories[number]["key"] {
  if (type.startsWith("Evaluation ")) {
    return "evaluations";
  }
  if (type === "Class Assiment") {
    return "classAssignments";
  }
  if (type === "Home Assiment") {
    return "homework";
  }
  return "other";
}

function createEmptyCategory(): CategoryStatistics {
  return { completed: 0, total: 0, correct: 0, possible: 0 };
}

function percentage(correct: number, possible: number) {
  return possible === 0 ? 0 : Math.round((correct / possible) * 100);
}

export default function TeacherStatisticsPage() {
  const router = useRouter();
  const [data, setData] = useState<StatisticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadStatistics = async () => {
      const token = localStorage.getItem("token");
      if (!token || localStorage.getItem("userType") !== "teacher") {
        router.replace("/login/teacher");
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      try {
        const responses = await Promise.all([
          fetch(apiUrl("/teacher/0"), { headers }),
          fetch(apiUrl("/exercise"), { headers }),
          fetch(apiUrl("/solvedexercise"), { headers }),
        ]);

        if (responses.some((response) => response.status === 401 || response.status === 403)) {
          localStorage.removeItem("token");
          localStorage.removeItem("expiration");
          localStorage.removeItem("userType");
          window.dispatchEvent(new Event("auth-change"));
          router.replace("/login/teacher");
          return;
        }

        const failedResponse = responses.find((response) => !response.ok);
        if (failedResponse) {
          throw new Error(`Unable to load student statistics (${failedResponse.status}).`);
        }

        const [teacher, exercises, submissions] = await Promise.all([
          responses[0].json() as Promise<Teacher>,
          responses[1].json() as Promise<Exercise[]>,
          responses[2].json() as Promise<SolvedExercise[]>,
        ]);
        if (isActive) {
          setData({ teacher, exercises, submissions });
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError instanceof Error
            ? loadError.message
            : "Unable to load student statistics.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadStatistics();
    return () => {
      isActive = false;
    };
  }, [router]);

  const studentStatistics = useMemo(() => {
    if (!data) {
      return [];
    }

    const studentsById = new Map<number, Student>();
    for (const classGroup of data.teacher.teatcherstudents ?? []) {
      for (const student of classGroup.studentclasses?.students ?? []) {
        studentsById.set(student.id, student);
      }
    }

    const exercisesByStudent = (student: Student) => data.exercises.filter((exercise) =>
      exercise.subjectid === data.teacher.subjectid
      && exercise.classname === student.studentclass
      && (
        !exercise.type.startsWith("Evaluation ")
        || exercise.type === `Evaluation ${student.group}`
      ),
    );
    const relevantExerciseIds = new Set(
      Array.from(studentsById.values()).flatMap((student) =>
        exercisesByStudent(student).map((exercise) => exercise.id),
      ),
    );
    const submissionByStudentExercise = new Map<string, SolvedExercise>();
    for (const submission of data.submissions) {
      if (!studentsById.has(submission.studentid) || !relevantExerciseIds.has(submission.exerciseid)) {
        continue;
      }

      const key = `${submission.studentid}:${submission.exerciseid}`;
      const previous = submissionByStudentExercise.get(key);
      if (!previous || submission.senddate > previous.senddate) {
        submissionByStudentExercise.set(key, submission);
      }
    }

    return Array.from(studentsById.values())
      .map((student): StudentStatistics => {
        const statistics: Record<CategoryKey, CategoryStatistics> = {
          evaluations: createEmptyCategory(),
          classAssignments: createEmptyCategory(),
          homework: createEmptyCategory(),
          other: createEmptyCategory(),
        };
        let uncorrected = 0;

        for (const exercise of exercisesByStudent(student)) {
          const category = statistics[getCategoryKey(exercise.type)];
          const submission = submissionByStudentExercise.get(`${student.id}:${exercise.id}`);
          category.total += 1;
          category.possible += submission?.totalanswer ?? getExerciseDegrees(exercise);
          if (submission) {
            category.completed += 1;
            category.correct += submission.correctanswer;
            if (submission.iscorrected !== true) {
              uncorrected += 1;
            }
          }
        }

        const total = categories.reduce((combined, { key }) => ({
          completed: combined.completed + statistics[key].completed,
          total: combined.total + statistics[key].total,
          correct: combined.correct + statistics[key].correct,
          possible: combined.possible + statistics[key].possible,
        }), createEmptyCategory());

        return {
          student,
          ...statistics,
          total,
          uncorrected,
        };
      })
      .sort((left, right) =>
        left.student.studentclass.localeCompare(right.student.studentclass)
        || left.student.group.localeCompare(right.student.group)
        || left.student.name.localeCompare(right.student.name),
      );
  }, [data]);

  const totals = studentStatistics.reduce((combined, item) => ({
    students: combined.students + 1,
    completed: combined.completed + item.total.completed,
    exercises: combined.exercises + item.total.total,
    correct: combined.correct + item.total.correct,
    possible: combined.possible + item.total.possible,
    uncorrected: combined.uncorrected + item.uncorrected,
  }), { students: 0, completed: 0, exercises: 0, correct: 0, possible: 0, uncorrected: 0 });

  const subjectName = data?.teacher.subjectname
    ?? data?.teacher.subjects?.subjectName
    ?? (data ? `Subject #${data.teacher.subjectid}` : "your subject");

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <Link href="/teacher" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            ← Back to teacher portal
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Student statistics</h1>
          <p className="mt-1 text-sm text-gray-600">
            Scores and exercise progress in {subjectName}.
          </p>
        </header>

        {isLoading ? (
          <p className="rounded-xl bg-white p-6 text-gray-600 shadow-sm" role="status">
            Loading student statistics…
          </p>
        ) : error ? (
          <p className="rounded-xl border border-red-100 bg-red-50 p-6 text-red-700" role="alert">
            {error}
          </p>
        ) : studentStatistics.length === 0 ? (
          <p className="rounded-xl bg-white p-6 text-gray-600 shadow-sm">
            No students are assigned to your subject yet.
          </p>
        ) : (
          <>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Subject overview">
              {[
                { label: "Students", value: totals.students },
                { label: "Exercises completed", value: `${totals.completed}/${totals.exercises}` },
                { label: "Points", value: `${totals.correct}/${totals.possible}` },
                { label: "Overall score", value: `${percentage(totals.correct, totals.possible)}%` },
                { label: "Awaiting correction", value: totals.uncorrected },
              ].map(({ label, value }) => (
                <article key={label} className="rounded-xl bg-white p-4 shadow-sm">
                  <h2 className="text-sm text-gray-500">{label}</h2>
                  <p className="mt-1 text-xl font-semibold text-gray-900">{value}</p>
                </article>
              ))}
            </section>

            <section className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Student progress by exercise type
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[66rem] text-left text-sm">
                  <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                    <tr>
                      <th scope="col" className="px-3 py-3">Student</th>
                      <th scope="col" className="px-3 py-3">Class / group</th>
                      {categories.map(({ key, title }) => (
                        <th scope="col" key={key} className="px-3 py-3">{title}</th>
                      ))}
                      <th scope="col" className="px-3 py-3">Total</th>
                      <th scope="col" className="px-3 py-3">Awaiting correction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {studentStatistics.map((item) => (
                      <tr key={item.student.id} className="text-gray-700">
                        <th scope="row" className="px-3 py-3 font-medium text-gray-900">
                          <span className="block">{item.student.name}</span>
                          <span className="text-xs font-normal text-gray-500">
                            Student code: {item.student.studentcode}
                          </span>
                        </th>
                        <td className="px-3 py-3">
                          {item.student.studentclass} / {item.student.group}
                        </td>
                        {categories.map(({ key }) => {
                          const stats = item[key];
                          return (
                            <td key={key} className="px-3 py-3">
                              <span className="block font-medium">{stats.correct}/{stats.possible} points</span>
                              <span className="text-xs text-gray-500">
                                {stats.completed}/{stats.total} completed
                              </span>
                            </td>
                          );
                        })}
                        <td className="px-3 py-3">
                          <span className="block font-semibold text-gray-900">
                            {item.total.correct}/{item.total.possible}
                          </span>
                          <span className="text-xs text-gray-500">
                            {percentage(item.total.correct, item.total.possible)}% · {item.total.completed}/{item.total.total} completed
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          {item.uncorrected === 0 ? "None" : item.uncorrected}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Unsolved exercises count as zero points and still contribute their possible points.
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
