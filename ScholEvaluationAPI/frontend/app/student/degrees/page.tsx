'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiUrl } from "@/lib/api";

interface Subject {
  id: number;
  subjectName: string;
}

interface Teacher {
  firstname: string;
  lastname: string;
  subjects: Subject;
}

interface TeacherStudent {
  teacher: Teacher;
}

interface StudentClasses {
  teatcherstudents: TeacherStudent[];
}

interface Exercise {
  id: number;
  stage: string;
  classname: string;
  type: string;
  evaluationNum: string | number;
  degrees?: number | null;
  question: { degrees?: number | null }[] | null;
  qwrites: { degrees: number | null }[] | null;
  paragraphs: {
    question: { degrees?: number | null }[] | null;
    qwrites: { degrees: number | null }[] | null;
  }[] | null;
  subjects: Subject;
}

interface SolvedExercise {
  id: number;
  correctanswer: number;
  totalanswer: number;
  senddate: string;
  exercise: {
    id: number;
  };
}

interface Student {
  id: number;
  name: string;
  studentclass: string;
  group: string;
  studentclasses: StudentClasses;
  solvedexercises: SolvedExercise[];
}

interface StudentDegreesData {
  student: Student;
  exercises: Exercise[];
}

const exerciseCategories = [
  { type: "Evaluation", title: "Evaluations", singular: "Evaluation" },
  { type: "Class Assiment", title: "Class assignments", singular: "Class assignment" },
  { type: "Home Assiment", title: "Homework", singular: "Homework" },
] as const;

function getScorePercentage(correct: number, total: number) {
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}

function getExerciseDegrees(exercise: Exercise) {
  if (typeof exercise.degrees === "number") {
    return exercise.degrees;
  }

  const questionDegrees = (exercise.question ?? []).reduce(
    (total, question) => total + (question.degrees ?? 1),
    0,
  );
  const writtenQuestionDegrees = (exercise.qwrites ?? []).reduce(
    (total, question) => total + (question.degrees ?? 0),
    0,
  );
  const paragraphDegrees = (exercise.paragraphs ?? []).reduce((total, paragraph) => {
    const paragraphQuestionDegrees = (paragraph.question ?? []).reduce(
      (questionTotal, question) => questionTotal + (question.degrees ?? 1),
      0,
    );
    const paragraphWrittenDegrees = (paragraph.qwrites ?? []).reduce(
      (writtenTotal, question) => writtenTotal + (question.degrees ?? 0),
      0,
    );
    return total + paragraphQuestionDegrees + paragraphWrittenDegrees;
  }, 0);

  return questionDegrees + writtenQuestionDegrees + paragraphDegrees;
}

export default function StudentDegreesPage() {
  const router = useRouter();
  const [data, setData] = useState<StudentDegreesData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadDegrees = async () => {
      const token = localStorage.getItem("token");
      if (token === null) {
        router.push("/login");
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      try {
        const [studentResponse, exercisesResponse] = await Promise.all([
          fetch(apiUrl("/students/0"), { method: "GET", headers }),
          fetch(apiUrl("/exercise"), { method: "GET", headers }),
        ]);

        if (
          studentResponse.status === 401 || studentResponse.status === 403
          || exercisesResponse.status === 401 || exercisesResponse.status === 403
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("expiration");
          router.push("/login");
          return;
        }

        if (!studentResponse.ok) {
          throw new Error(`Unable to load student data (${studentResponse.status}).`);
        }
        if (!exercisesResponse.ok) {
          throw new Error(`Unable to load exercises (${exercisesResponse.status}).`);
        }

        const [student, exercises]: [Student, Exercise[]] = await Promise.all([
          studentResponse.json(),
          exercisesResponse.json(),
        ]);

        if (isActive) {
          setData({ student, exercises });
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load subject degrees.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadDegrees();
    return () => {
      isActive = false;
    };
  }, [router]);

  const subjects = useMemo(() => {
    if (data === null) {
      return [];
    }

    const availableExercises = data.exercises.filter((exercise) =>
      exercise.classname === data.student.studentclass
      && exercise.stage.toLowerCase() === data.student.studentclass.replace(/\d+$/, "").toLowerCase()
      && (
        !exercise.type.startsWith("Evaluation ")
        || exercise.type === `Evaluation ${data.student.group}`
      ),
    );
    const enrolledSubjects = data.student.studentclasses.teatcherstudents.map(
      (teacherStudent) => teacherStudent.teacher.subjects,
    );
    const subjectById = new Map<number, Subject>();

    for (const subject of enrolledSubjects) {
      subjectById.set(subject.id, subject);
    }
    for (const exercise of availableExercises) {
      subjectById.set(exercise.subjects.id, exercise.subjects);
    }

    const submissionByExerciseId = new Map<number, SolvedExercise>();
    for (const submission of data.student.solvedexercises) {
      submissionByExerciseId.set(submission.exercise.id, submission);
    }

    return Array.from(subjectById.values())
      .sort((left, right) => left.subjectName.localeCompare(right.subjectName))
      .map((subject) => {
        const exercises = availableExercises
          .filter((exercise) => exercise.subjects.id === subject.id)
          .sort((left, right) => {
            const categoryOrder = (type: string) => exerciseCategories.findIndex(
              (category) => category.type === (type.startsWith("Evaluation ") ? "Evaluation" : type),
            );
            return categoryOrder(left.type) - categoryOrder(right.type)
              || String(left.evaluationNum).localeCompare(String(right.evaluationNum), undefined, { numeric: true })
              || left.id - right.id;
          });
        const solvedScores = exercises.flatMap((exercise) => {
          const submission = submissionByExerciseId.get(exercise.id);
          return submission ? [submission] : [];
        });
        const unsolvedDegrees = exercises.reduce((total, exercise) =>
          submissionByExerciseId.has(exercise.id) ? total : total + getExerciseDegrees(exercise), 0);

        return {
          subject,
          exercises,
          solvedCount: solvedScores.length,
          totalCount: exercises.length,
          totalCorrect: solvedScores.reduce((total, submission) => total + submission.correctanswer, 0),
          totalPossible: solvedScores.reduce((total, submission) => total + submission.totalanswer, 0)
            + unsolvedDegrees,
        };
      });
  }, [data]);

  const totalSolved = subjects.reduce((total, subject) => total + subject.solvedCount, 0);
  const totalExercises = subjects.reduce((total, subject) => total + subject.totalCount, 0);
  const totalCorrect = subjects.reduce((total, subject) => total + subject.totalCorrect, 0);
  const totalPossible = subjects.reduce((total, subject) => total + subject.totalPossible, 0);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/student" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              ← Back to dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-gray-800">Subject degrees & exercises</h1>
            <p className="mt-1 text-sm text-gray-600">
              See your scores and which evaluations, class assignments, and homework are still unsolved.
            </p>
          </div>
          {!isLoading && !error && data && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
                <p className="text-xs text-gray-500">Solved</p>
                <p className="font-semibold text-gray-800">{totalSolved}/{totalExercises}</p>
              </div>
              <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
                <p className="text-xs text-gray-500">Points earned</p>
                <p className="font-semibold text-gray-800">{totalCorrect}/{totalPossible}</p>
              </div>
              <div className="col-span-2 rounded-xl bg-white px-4 py-3 shadow-sm sm:col-span-1">
                <p className="text-xs text-gray-500">Overall percentage</p>
                <p className="font-semibold text-blue-700">
                  {getScorePercentage(totalCorrect, totalPossible)}%
                </p>
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <p className="rounded-xl bg-white p-6 text-gray-600 shadow-sm" role="status">
            Loading subject degrees…
          </p>
        ) : error ? (
          <p className="rounded-xl border border-red-100 bg-red-50 p-6 text-red-700" role="alert">
            {error}
          </p>
        ) : subjects.length === 0 ? (
          <p className="rounded-xl bg-white p-6 text-gray-600 shadow-sm">
            No subjects or exercises are available for your class yet.
          </p>
        ) : (
          <div className="space-y-6">
            {subjects.map(({ subject, exercises, solvedCount, totalCount, totalCorrect: subjectCorrect, totalPossible: subjectPossible }) => (
              <section key={subject.id} className="rounded-xl bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-xl font-semibold text-gray-800">{subject.subjectName}</h2>
                  <p className="text-sm font-medium text-gray-600">
                    {solvedCount}/{totalCount} solved
                    <span className="ml-3 text-blue-700">
                      Score: {subjectCorrect}/{subjectPossible} ({getScorePercentage(subjectCorrect, subjectPossible)}%)
                    </span>
                  </p>
                </div>

                {exercises.length === 0 ? (
                  <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                    No exercises available for this subject.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {exerciseCategories.map((category) => {
                      const categoryExercises = exercises.filter((exercise) =>
                        category.type === "Evaluation"
                          ? exercise.type.startsWith("Evaluation ")
                          : exercise.type === category.type,
                      );

                      if (categoryExercises.length === 0) {
                        return null;
                      }

                      const categoryScores = categoryExercises.flatMap((exercise) => {
                        const submission = data?.student.solvedexercises.find(
                          (item) => item.exercise.id === exercise.id,
                        );
                        return submission ? [submission] : [];
                      });
                      const categoryCorrect = categoryScores.reduce(
                        (total, submission) => total + submission.correctanswer,
                        0,
                      );
                      const categoryPossible = categoryScores.reduce(
                        (total, submission) => total + submission.totalanswer,
                        0,
                      ) + categoryExercises.reduce((total, exercise) =>
                        data?.student.solvedexercises.some((item) => item.exercise.id === exercise.id)
                          ? total
                          : total + getExerciseDegrees(exercise), 0);

                      return (
                        <div key={category.type} className="rounded-lg border border-gray-100 p-4">
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <h3 className="font-semibold text-gray-800">{category.title}</h3>
                            <span className="text-sm text-gray-600">
                              Score: {categoryCorrect}/{categoryPossible} ({getScorePercentage(categoryCorrect, categoryPossible)}%)
                            </span>
                          </div>
                          <ul className="space-y-2">
                            {categoryExercises.map((exercise) => {
                              const submission = data?.student.solvedexercises.find(
                                (item) => item.exercise.id === exercise.id,
                              );
                              const categoryLabel = `${category.singular} ${exercise.evaluationNum}`;

                              return (
                                <li
                                  key={exercise.id}
                                  className="flex flex-col gap-2 rounded-lg bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                                >
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-medium text-gray-800">{categoryLabel}</span>
                                    <span className="font-mono text-xs text-gray-500">#{exercise.id}</span>
                                  </div>
                                  {submission ? (
                                    <span className="text-sm font-semibold text-green-700">
                                      Solved · {submission.correctanswer}/{submission.totalanswer} points
                                    </span>
                                  ) : (
                                    <span className="text-sm font-semibold text-amber-700">
                                      Not solved · 0/{getExerciseDegrees(exercise)} points
                                    </span>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
