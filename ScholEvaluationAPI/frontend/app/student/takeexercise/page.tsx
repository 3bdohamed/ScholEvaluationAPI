'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { apiUrl } from "@/lib/api";

interface Student {
  id: number;
  authority: number | string;
}

interface ExerciseQuestion {
  id: number;
  ask: string | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  option4: string | null;
  answer: string | null;
}

interface ExerciseWrittenQuestion {
  id: number;
  ask: string | null;
  title: string | null;
  answerexample: string | null;
  degrees: number | null;
}

interface ExerciseParagraph {
  id: number;
  title: string | null;
  paragraphbody: string | null;
  question: ExerciseQuestion[] | null;
  qwrites: ExerciseWrittenQuestion[] | null;
}

interface Exercise {
  id: number;
  stage: string;
  classname: string;
  subjects: {
    subjectName: string;
  };
  evaluationNum: string;
  type: string;
  question: ExerciseQuestion[] | null;
  qwrites: ExerciseWrittenQuestion[] | null;
  paragraphs: ExerciseParagraph[] | null;
}

interface QuestionSubmission {
  chooseId: number;
  ask: string | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  option4: string | null;
  answer: string | null;
  choiced: string;
}

interface WrittenAnswerSubmission {
  qweiteid: number;
  totaldegree: number;
  answer: string;
}

interface ParagraphSubmission {
  paragraphid: number;
  solvedquestion: QuestionSubmission[];
  sqwrites: WrittenAnswerSubmission[];
}

interface ExerciseSubmission {
  studentid: number;
  exerciseid: number;
  stage: string;
  classname: string;
  evaluationNum: string;
  type: string;
  paragraphs: ParagraphSubmission[];
  sqwrites: WrittenAnswerSubmission[];
  question: QuestionSubmission[];
}

const toQuestionSubmission = (
  question: ExerciseQuestion,
  selectedAnswers: Record<number, string>,
): QuestionSubmission => ({
  chooseId: question.id,
  ask: question.ask,
  option1: question.option1,
  option2: question.option2,
  option3: question.option3,
  option4: question.option4,
  answer: question.answer,
  choiced: selectedAnswers[question.id] ?? "",
});

const toWrittenAnswerSubmission = (
  question: ExerciseWrittenQuestion,
  writtenAnswers: Record<number, string>,
): WrittenAnswerSubmission => ({
  qweiteid: question.id,
  totaldegree: question.degrees ?? 0,
  answer: writtenAnswers[question.id] ?? "",
});

export default function TakeExercisePage() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [writtenAnswers, setWrittenAnswers] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadExercise = async () => {
      const token = localStorage.getItem("token");
      if (token === null) {
        router.push("/login");
        return;
      }

      try {
        const studentResponse = await fetch(apiUrl("/students/0"), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!studentResponse.ok) {
          if (studentResponse.status === 401 || studentResponse.status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("expiration");
            router.push("/login");
            return;
          }
          throw new Error(`Unable to load student data (${studentResponse.status}).`);
        }

        const studentData: Student = await studentResponse.json();
        const exerciseId = Number(studentData.authority);
        if (!Number.isInteger(exerciseId) || exerciseId < 1) {
          throw new Error("There is no exercise assigned to your account.");
        }

        const exerciseResponse = await fetch(apiUrl(`/exercise/${exerciseId}`), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!exerciseResponse.ok) {
          if (exerciseResponse.status === 401 || exerciseResponse.status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("expiration");
            router.push("/login");
            return;
          }
          throw new Error(`Unable to load the exercise (${exerciseResponse.status}).`);
        }

        const exerciseData: Exercise = await exerciseResponse.json();
        if (isActive) {
          setStudent(studentData);
          setExercise(exerciseData);
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load the exercise.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadExercise();
    return () => {
      isActive = false;
    };
  }, [router]);

  const paragraphs = exercise?.paragraphs ?? [];
  const topLevelQuestions = exercise?.question ?? [];
  const topLevelWrittenQuestions = exercise?.qwrites ?? [];
  const hasQuestions = topLevelQuestions.length > 0
    || topLevelWrittenQuestions.length > 0
    || paragraphs.some((paragraph) => (paragraph.question?.length ?? 0) > 0
      || (paragraph.qwrites?.length ?? 0) > 0);

  const submitAnswers = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (student === null || exercise === null) {
      setError("The exercise is not ready to submit.");
      return;
    }

    const token = localStorage.getItem("token");
    if (token === null) {
      router.push("/login");
      return;
    }

    const submission: ExerciseSubmission = {
      studentid: student.id,
      exerciseid: exercise.id,
      stage: exercise.stage,
      classname: exercise.classname,
      evaluationNum: exercise.evaluationNum,
      type: exercise.type,
      paragraphs: paragraphs.map((paragraph) => ({
        paragraphid: paragraph.id,
        solvedquestion: (paragraph.question ?? []).map((question) =>
          toQuestionSubmission(question, selectedAnswers)),
        sqwrites: (paragraph.qwrites ?? []).map((question) =>
          toWrittenAnswerSubmission(question, writtenAnswers)),
      })),
      sqwrites: topLevelWrittenQuestions.map((question) =>
        toWrittenAnswerSubmission(question, writtenAnswers)),
      question: topLevelQuestions.map((question) =>
        toQuestionSubmission(question, selectedAnswers)),
    };

    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch(apiUrl("/exercise/send"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submission),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("expiration");
          router.push("/login");
          return;
        }
        if (response.status === 400) {
          throw new Error("the exercise already send before");
        }
        throw new Error(`Unable to submit your answers (${response.status}).`);
      }

      setIsSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit your answers.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question: ExerciseQuestion) => {
    const options = [question.option1, question.option2, question.option3, question.option4];

    return (
      <fieldset key={question.id} className="rounded-lg bg-gray-50 p-4">
        <legend className="font-semibold text-gray-800">{question.ask}</legend>
        <div className="mt-3 space-y-2">
          {options.map((option, index) => option !== null && (
            <label key={`${question.id}-${index}`} className="flex cursor-pointer items-start gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name={`question-${question.id}`}
                value={String(index + 1)}
                required
                disabled={isSubmitted}
                checked={selectedAnswers[question.id] === String(index + 1)}
                onChange={(event) => setSelectedAnswers((current) => ({
                  ...current,
                  [question.id]: event.target.value,
                }))}
                className="mt-1 accent-blue-600"
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  };

  const renderWrittenQuestion = (question: ExerciseWrittenQuestion) => (
    <div key={question.id} className="rounded-lg bg-gray-50 p-4">
      <label htmlFor={`written-${question.id}`} className="block font-semibold text-gray-800">
        {question.title ? `${question.title}: ` : ""}{question.ask}
      </label>
      <textarea
        id={`written-${question.id}`}
        required
        rows={4}
        disabled={isSubmitted}
        value={writtenAnswers[question.id] ?? ""}
        onChange={(event) => setWrittenAnswers((current) => ({
          ...current,
          [question.id]: event.target.value,
        }))}
        className="mt-3 w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <Link href="/student" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            ← Back to dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-800">Take exercise</h1>
          {exercise && (
            <p className="mt-1 text-sm text-gray-600">
              {exercise.type} · {exercise.subjects?.subjectName ?? "Exercise"} · {exercise.evaluationNum}
            </p>
          )}
        </div>

        {isLoading ? (
          <p className="rounded-xl bg-white p-6 text-gray-600 shadow-sm" role="status">
            Loading exercise…
          </p>
        ) : error && !exercise ? (
          <p className="rounded-xl border border-red-100 bg-red-50 p-6 text-red-700" role="alert">
            {error}
          </p>
        ) : exercise && !hasQuestions ? (
          <p className="rounded-xl bg-white p-6 text-gray-600 shadow-sm">
            This exercise does not contain any questions yet.
          </p>
        ) : exercise ? (
          <form onSubmit={submitAnswers} className="space-y-6">
            {error && (
              <p className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}
            {isSubmitted && (
              <p className="rounded-lg border border-green-100 bg-green-50 p-4 text-sm text-green-700" role="status">
                Your answers were submitted successfully.
              </p>
            )}

            {paragraphs.map((paragraph) => (
              <section key={paragraph.id} className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
                <div>
                  {paragraph.title && <h2 className="text-lg font-semibold text-gray-800">{paragraph.title}</h2>}
                  {paragraph.paragraphbody && (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                      {paragraph.paragraphbody}
                    </p>
                  )}
                </div>
                {(paragraph.question ?? []).map(renderQuestion)}
                {(paragraph.qwrites ?? []).map(renderWrittenQuestion)}
              </section>
            ))}

            {(topLevelQuestions.length > 0 || topLevelWrittenQuestions.length > 0) && (
              <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
                {topLevelQuestions.map(renderQuestion)}
                {topLevelWrittenQuestions.map(renderWrittenQuestion)}
              </section>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting || isSubmitted}
                className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Submitting…" : isSubmitted ? "Submitted" : "Submit answers"}
              </button>
              {isSubmitted && (
                <Link href="/student" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
                  Return to dashboard
                </Link>
              )}
            </div>
          </form>
        ) : null}
      </div>
    </main>
  );
}
