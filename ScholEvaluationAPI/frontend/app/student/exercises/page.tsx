'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

type ExerciseCategory = "assignment" | "homework";

interface SolvedExercise {
  id: number;
  type: string;
  senddate: string;
  iscorrected: boolean;
  correctanswer: number;
  totalanswer: number;
  exercise: {
    subjects: {
      subjectName: string;
    };
    evaluationNum: number;
  };
}

interface StudentExercises {
  solvedexercises: SolvedExercise[];
}

const categoryDetails: Record<ExerciseCategory, { type: string; title: string; code: string }> = {
  assignment: {
    type: "Class Assiment",
    title: "All Class Assignments",
    code: "ASM",
  },
  homework: {
    type: "Home Assiment",
    title: "All Homework",
    code: "HW",
  },
};

export default function StudentExercisesPage() {
  const router = useRouter();
  const [category, setCategory] = useState<ExerciseCategory | null>(null);
  const [student, setStudent] = useState<StudentExercises | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadExercises = async () => {
      const selectedCategory = new URLSearchParams(window.location.search).get("type");
      if (selectedCategory !== "assignment" && selectedCategory !== "homework") {
        setError("Choose either class assignments or homework to view.");
        setIsLoading(false);
        return;
      }
      setCategory(selectedCategory);

      const token = localStorage.getItem("token");
      if (token === null) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(apiUrl("/students/0"), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("expiration");
            router.push("/login");
            return;
          }
          throw new Error(`Unable to load ${categoryDetails[selectedCategory].title.toLowerCase()} (${response.status}).`);
        }

        const result: StudentExercises = await response.json();
        if (isActive) {
          setStudent(result);
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load exercises.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadExercises();
    return () => {
      isActive = false;
    };
  }, [router]);

  const details = category ? categoryDetails[category] : null;
  const exercises = student?.solvedexercises
    .filter((exercise) => exercise.type === details?.type)
    .slice()
    .reverse() ?? [];
  const totalCorrect = exercises.reduce((total, exercise) => total + exercise.correctanswer, 0);
  const totalPossible = exercises.reduce((total, exercise) => total + exercise.totalanswer, 0);
  const overallPercentage = totalPossible === 0 ? 0 : Math.round((totalCorrect / totalPossible) * 100);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/student" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              ← Back to dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-gray-800">
              {details?.title ?? "Student exercises"}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              View all your submissions and open each one to see your answers.
            </p>
          </div>
          {!isLoading && !error && (
            <div className="rounded-xl bg-white px-5 py-4 shadow-sm">
              <p className="text-sm text-gray-500">Overall score</p>
              <p className="text-xl font-bold text-blue-700">
                {totalCorrect}/{totalPossible} <span className="text-sm font-semibold">({overallPercentage}%)</span>
              </p>
            </div>
          )}
        </div>

        {isLoading ? (
          <p className="rounded-xl bg-white p-6 text-gray-600 shadow-sm" role="status">
            Loading submissions…
          </p>
        ) : error ? (
          <p className="rounded-xl border border-red-100 bg-red-50 p-6 text-red-700" role="alert">
            {error}
          </p>
        ) : exercises.length === 0 ? (
          <p className="rounded-xl bg-white p-6 text-gray-600 shadow-sm">
            No submissions are available yet.
          </p>
        ) : (
          <section aria-label={details?.title} className="space-y-4">
            {exercises.map((exercise, index) => {
              const percentage = exercise.totalanswer === 0
                ? 0
                : Math.round((exercise.correctanswer / exercise.totalanswer) * 100);

              return (
                <article
                  key={exercise.id}
                  className="rounded-xl bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-gray-800">
                          {exercise.exercise.subjects.subjectName}
                        </h2>
                        <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs font-semibold text-gray-700">
                          {details?.code}-{exercise.exercise.evaluationNum}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">Submitted: {exercise.senddate}</p>
                    </div>
                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                        exercise.iscorrected
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {exercise.iscorrected ? "Corrected" : "Not corrected"}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Score</p>
                      <p className="mt-1 font-semibold text-gray-800">
                        {exercise.correctanswer} / {exercise.totalanswer}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Percentage</p>
                      <p className="mt-1 font-semibold text-gray-800">{percentage}%</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Submission</p>
                      <p className="mt-1 font-semibold text-gray-800">#{index + 1}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Answers</p>
                      <Link
                        href={`/student/evaluations/answers?id=${exercise.id}&type=${category}`}
                        className="mt-1 inline-flex rounded font-semibold text-blue-700 hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                      >
                        View answers
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
