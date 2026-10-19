'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { apiUrl } from "@/lib/api";

interface Subject {
  id: number;
  subjectName: string;
}

interface ExerciseQuestion {
  id: number;
  ask: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  answer: string;
  paragraphid?: number | null;
}

interface ExerciseWrittenQuestion {
  id: number;
  ask: string;
  type: string;
  title: string | null;
  answerexample: string | null;
  isJustify: boolean;
  justifyanswer?: string | null;
  degrees: number | null;
  paragraphid?: number | null;
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
  subjectid: number;
  subjects?: Subject | null;
  evaluationNum: string | number;
  type: string;
  question: ExerciseQuestion[] | null;
  qwrites: ExerciseWrittenQuestion[] | null;
  paragraphs: ExerciseParagraph[] | null;
  degrees?: number | null;
}

interface ExerciseForm {
  type: string;
  stage: string;
  classname: string;
  subjectid: string;
  evaluationNum: string;
}

interface QuestionDraft {
  ask: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  answer: string;
}

interface WrittenDraft {
  ask: string;
  type: string;
  title: string;
  answerexample: string;
  isJustify: boolean;
  justifyanswer: string;
  degrees: string;
}

interface ParagraphDraft {
  title: string;
  paragraphbody: string;
  question: QuestionDraft[];
  qwrites: WrittenDraft[];
}

const exerciseTypes = [
  "Evaluation A",
  "Evaluation B",
  "Evaluation C",
  "Class Assiment",
  "Home Assiment",
];
const stages = ["secondary"];
const classNames = ["secondary1", "secondary2", "secondary3"];
const fieldClass = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100";
const labelClass = "text-sm font-medium text-gray-700";

const emptyForm: ExerciseForm = {
  type: exerciseTypes[0],
  stage: stages[0],
  classname: "",
  subjectid: "",
  evaluationNum: "",
};

function emptyQuestion(): QuestionDraft {
  return { ask: "", option1: "", option2: "", option3: "", option4: "", answer: "" };
}

function emptyWritten(): WrittenDraft {
  return {
    ask: "",
    type: "Other",
    title: "",
    answerexample: "",
    isJustify: false,
    justifyanswer: "",
    degrees: "1",
  };
}

function emptyParagraph(): ParagraphDraft {
  return { title: "", paragraphbody: "", question: [], qwrites: [] };
}

function isSubject(value: unknown): value is Subject {
  if (!value || typeof value !== "object") {
    return false;
  }
  const subject = value as Record<string, unknown>;
  return typeof subject.id === "number" && typeof subject.subjectName === "string";
}

function isExercise(value: unknown): value is Exercise {
  if (!value || typeof value !== "object") {
    return false;
  }
  const exercise = value as Record<string, unknown>;
  return typeof exercise.id === "number"
    && typeof exercise.stage === "string"
    && typeof exercise.classname === "string"
    && typeof exercise.subjectid === "number"
    && (typeof exercise.evaluationNum === "string" || typeof exercise.evaluationNum === "number")
    && typeof exercise.type === "string";
}

async function requestApi(path: string, token: string, init: RequestInit = {}): Promise<unknown> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem("token");
    localStorage.removeItem("expiration");
    localStorage.removeItem("userType");
    window.dispatchEvent(new Event("auth-change"));
    window.location.replace("/login/manager");
    throw new Error("Your manager session has expired. Please sign in again.");
  }

  const responseText = await response.text();
  let result: unknown = null;
  if (responseText) {
    try {
      result = JSON.parse(responseText) as unknown;
    } catch {
      result = responseText;
    }
  }

  if (!response.ok) {
    let message = typeof result === "string" ? result : "";
    if (result && typeof result === "object") {
      const details = result as Record<string, unknown>;
      const responseMessage = details.message ?? details.title ?? details.detail;
      if (typeof responseMessage === "string") {
        message = responseMessage;
      } else if (Array.isArray(details.errors)) {
        message = details.errors
          .filter((item): item is string => typeof item === "string")
          .join(" ");
      }
    }
    throw new Error(message || `Request failed (${response.status}).`);
  }

  return result;
}

function QuestionFields({
  idPrefix,
  value,
  onChange,
  onRemove,
}: {
  idPrefix: string;
  value: QuestionDraft;
  onChange: (next: QuestionDraft) => void;
  onRemove: () => void;
}) {
  const update = (key: keyof QuestionDraft, fieldValue: string) => onChange({ ...value, [key]: fieldValue });

  return (
    <fieldset className="space-y-3 rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <legend className="px-1 text-sm font-semibold text-gray-800">Multiple-choice question</legend>
        <button type="button" onClick={onRemove} className="text-xs font-semibold text-red-700 hover:text-red-900">
          Remove
        </button>
      </div>
      <label className="block space-y-1">
        <span className={labelClass}>Question</span>
        <textarea id={`${idPrefix}-ask`} required value={value.ask} onChange={(event) => update("ask", event.target.value)} rows={2} className={fieldClass} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        {(["option1", "option2", "option3", "option4"] as const).map((option, index) => (
          <label key={option} className="block space-y-1">
            <span className={labelClass}>Option {index + 1}</span>
            <input id={`${idPrefix}-${option}`} required value={value[option]} onChange={(event) => update(option, event.target.value)} className={fieldClass} />
          </label>
        ))}
      </div>
      <label className="block space-y-1 sm:max-w-xs">
        <span className={labelClass}>Correct option</span>
        <select id={`${idPrefix}-answer`} required value={value.answer} onChange={(event) => update("answer", event.target.value)} className={`${fieldClass} bg-white`}>
          <option value="" disabled>Select the correct option</option>
          {[1, 2, 3, 4].map((number) => <option key={number} value={String(number)}>Option {number}</option>)}
        </select>
      </label>
    </fieldset>
  );
}

function WrittenFields({
  value,
  onChange,
  onRemove,
}: {
  value: WrittenDraft;
  onChange: (next: WrittenDraft) => void;
  onRemove: () => void;
}) {
  const update = (key: keyof WrittenDraft, fieldValue: string | boolean) => onChange({ ...value, [key]: fieldValue });

  return (
    <fieldset className="space-y-3 rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <legend className="px-1 text-sm font-semibold text-gray-800">Written question</legend>
        <button type="button" onClick={onRemove} className="text-xs font-semibold text-red-700 hover:text-red-900">
          Remove
        </button>
      </div>
      <label className="block space-y-1">
        <span className={labelClass}>Prompt</span>
        <textarea required value={value.ask} onChange={(event) => update("ask", event.target.value)} rows={2} className={fieldClass} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className={labelClass}>Question type</span>
          <select value={value.type} onChange={(event) => update("type", event.target.value)} className={`${fieldClass} bg-white`}>
            <option>Other</option>
            <option>Rewrite</option>
            <option>Justify</option>
          </select>
        </label>
        <label className="block space-y-1">
          <span className={labelClass}>Degrees</span>
          <input type="number" min="0" step="0.5" required value={value.degrees} onChange={(event) => update("degrees", event.target.value)} className={fieldClass} />
        </label>
        <label className="block space-y-1">
          <span className={labelClass}>Title (optional)</span>
          <input value={value.title} onChange={(event) => update("title", event.target.value)} className={fieldClass} />
        </label>
        <label className="block space-y-1">
          <span className={labelClass}>Example answer</span>
          <input value={value.answerexample} onChange={(event) => update("answerexample", event.target.value)} className={fieldClass} />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={value.isJustify} onChange={(event) => update("isJustify", event.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
        Requires justification
      </label>
      {value.isJustify && (
        <label className="block space-y-1">
          <span className={labelClass}>Justification answer</span>
          <input value={value.justifyanswer} onChange={(event) => update("justifyanswer", event.target.value)} className={fieldClass} />
        </label>
      )}
    </fieldset>
  );
}

function ParagraphFields({
  idPrefix,
  value,
  onChange,
  onRemove,
}: {
  idPrefix: string;
  value: ParagraphDraft;
  onChange: (next: ParagraphDraft) => void;
  onRemove: () => void;
}) {
  const updateQuestion = (index: number, next: QuestionDraft) => {
    onChange({ ...value, question: value.question.map((item, itemIndex) => itemIndex === index ? next : item) });
  };
  const updateWritten = (index: number, next: WrittenDraft) => {
    onChange({ ...value, qwrites: value.qwrites.map((item, itemIndex) => itemIndex === index ? next : item) });
  };

  return (
    <fieldset className="space-y-4 rounded-lg border border-blue-100 bg-blue-50/40 p-4">
      <div className="flex items-center justify-between">
        <legend className="px-1 text-sm font-semibold text-gray-800">Reading paragraph</legend>
        <button type="button" onClick={onRemove} className="text-xs font-semibold text-red-700 hover:text-red-900">
          Remove paragraph
        </button>
      </div>
      <label className="block space-y-1">
        <span className={labelClass}>Title</span>
        <input required value={value.title} onChange={(event) => onChange({ ...value, title: event.target.value })} className={fieldClass} />
      </label>
      <label className="block space-y-1">
        <span className={labelClass}>Paragraph text</span>
        <textarea required value={value.paragraphbody} onChange={(event) => onChange({ ...value, paragraphbody: event.target.value })} rows={4} className={fieldClass} />
      </label>
      <div className="space-y-3">
        {value.question.map((question, index) => (
          <QuestionFields
            key={`paragraph-question-${index}`}
            idPrefix={`${idPrefix}-question-${index}`}
            value={question}
            onChange={(next) => updateQuestion(index, next)}
            onRemove={() => onChange({ ...value, question: value.question.filter((_, itemIndex) => itemIndex !== index) })}
          />
        ))}
        <button type="button" onClick={() => onChange({ ...value, question: [...value.question, emptyQuestion()] })} className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-white">
          Add paragraph question
        </button>
      </div>
      <div className="space-y-3">
        {value.qwrites.map((written, index) => (
          <WrittenFields
            key={`paragraph-written-${index}`}
            value={written}
            onChange={(next) => updateWritten(index, next)}
            onRemove={() => onChange({ ...value, qwrites: value.qwrites.filter((_, itemIndex) => itemIndex !== index) })}
          />
        ))}
        <button type="button" onClick={() => onChange({ ...value, qwrites: [...value.qwrites, emptyWritten()] })} className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-white">
          Add paragraph written question
        </button>
      </div>
    </fieldset>
  );
}

function questionPayload(question: QuestionDraft) {
  return {
    ask: question.ask.trim(),
    option1: question.option1.trim(),
    option2: question.option2.trim(),
    option3: question.option3.trim(),
    option4: question.option4.trim(),
    answer: question.answer,
  };
}

function writtenPayload(written: WrittenDraft) {
  return {
    ask: written.ask.trim(),
    type: written.type,
    ...(written.title.trim() ? { title: written.title.trim() } : {}),
    answerexample: written.answerexample.trim(),
    isJustify: written.isJustify,
    ...(written.isJustify && written.justifyanswer.trim() ? { justifyanswer: written.justifyanswer.trim() } : {}),
    degrees: Number(written.degrees),
  };
}

function isQuestionDraftValid(question: QuestionDraft) {
  return Boolean(
    question.ask.trim()
    && question.option1.trim()
    && question.option2.trim()
    && question.option3.trim()
    && question.option4.trim()
    && question.answer,
  );
}

function isWrittenDraftValid(written: WrittenDraft) {
  return Boolean(written.ask.trim() && Number.isFinite(Number(written.degrees)) && Number(written.degrees) >= 0);
}

export default function ManageExercisesPage() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [form, setForm] = useState<ExerciseForm>(emptyForm);
  const [editingExerciseId, setEditingExerciseId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingExerciseId, setDeletingExerciseId] = useState<number | null>(null);
  const [selectedContentId, setSelectedContentId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);
  const [writtenQuestions, setWrittenQuestions] = useState<WrittenDraft[]>([emptyWritten()]);
  const [paragraphs, setParagraphs] = useState<ParagraphDraft[]>([]);
  const [contentQuestion, setContentQuestion] = useState<QuestionDraft>(emptyQuestion());
  const [contentWritten, setContentWritten] = useState<WrittenDraft>(emptyWritten());
  const [contentParagraph, setContentParagraph] = useState<ParagraphDraft>(emptyParagraph());
  const [isUpdatingContent, setIsUpdatingContent] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadData = async () => {
      const token = localStorage.getItem("token");
      if (!token || localStorage.getItem("userType") !== "manager") {
        router.replace("/login/manager");
        return;
      }

      try {
        const [exerciseResult, subjectResult] = await Promise.all([
          requestApi("/exercise", token),
          requestApi("/subject", token),
        ]);
        if (!Array.isArray(exerciseResult) || !exerciseResult.every(isExercise)) {
          throw new Error("The exercise list returned an unexpected response.");
        }
        if (!Array.isArray(subjectResult) || !subjectResult.every(isSubject)) {
          throw new Error("The subject list returned an unexpected response.");
        }
        if (isActive) {
          setExercises(exerciseResult);
          setSubjects(subjectResult);
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load exercise data.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadData();
    return () => {
      isActive = false;
    };
  }, [router]);

  const filteredExercises = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase();
    if (!query) {
      return exercises;
    }
    return exercises.filter((exercise) =>
      `${exercise.classname} ${exercise.type} ${exercise.evaluationNum} ${exercise.subjects?.subjectName ?? ""}`
        .toLocaleLowerCase()
        .includes(query),
    );
  }, [exercises, searchTerm]);

  const contentExercise = exercises.find((exercise) => exercise.id === selectedContentId) ?? null;
  const availableClassNames = [...new Set([...classNames, ...exercises.map((exercise) => exercise.classname)])];

  const tokenOrRedirect = () => {
    const token = localStorage.getItem("token");
    if (!token || localStorage.getItem("userType") !== "manager") {
      router.replace("/login/manager");
      return null;
    }
    return token;
  };

  const refreshExercises = async (token: string) => {
    const result = await requestApi("/exercise", token);
    if (!Array.isArray(result) || !result.every(isExercise)) {
      throw new Error("The updated exercise list returned an unexpected response.");
    }
    setExercises(result);
  };

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingExerciseId(null);
    setQuestions([emptyQuestion()]);
    setWrittenQuestions([emptyWritten()]);
    setParagraphs([]);
  };

  const handleEdit = (exercise: Exercise) => {
    setForm({
      type: exercise.type,
      stage: exercise.stage,
      classname: exercise.classname,
      subjectid: String(exercise.subjectid),
      evaluationNum: String(exercise.evaluationNum),
    });
    setEditingExerciseId(exercise.id);
    setSelectedContentId(null);
    setError(null);
    setNotice(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsSaving(true);
    const token = tokenOrRedirect();
    if (!token) {
      setIsSaving(false);
      return;
    }

    let saved = false;
    try {
      const exerciseDetails = {
        type: form.type,
        stage: form.stage,
        classname: form.classname,
        subjectid: Number(form.subjectid),
        evaluationNum: form.evaluationNum.trim(),
      };
      const body = editingExerciseId === null
        ? {
          ...exerciseDetails,
          question: questions.filter((question) => question.ask.trim()).map(questionPayload),
          qwrites: writtenQuestions.filter((question) => question.ask.trim()).map(writtenPayload),
          paragraphs: paragraphs.map((paragraph) => ({
            title: paragraph.title.trim(),
            paragraphbody: paragraph.paragraphbody.trim(),
            question: paragraph.question.filter((question) => question.ask.trim()).map(questionPayload),
            qwrites: paragraph.qwrites.filter((question) => question.ask.trim()).map(writtenPayload),
          })),
        }
        : { id: editingExerciseId, ...exerciseDetails };

      await requestApi(
        editingExerciseId === null ? "/exercise/" : `/exercise/${editingExerciseId}`,
        token,
        { method: editingExerciseId === null ? "POST" : "PUT", body: JSON.stringify(body) },
      );
      saved = true;
      await refreshExercises(token);
      setNotice(editingExerciseId === null ? "Exercise added successfully." : "Exercise updated successfully.");
      resetForm();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Unable to save this exercise.";
      setError(saved ? `Exercise saved, but the list could not be refreshed: ${message}` : message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (exercise: Exercise) => {
    if (!window.confirm(`Delete exercise #${exercise.id} (${exercise.type} ${exercise.evaluationNum})? This action cannot be undone.`)) {
      return;
    }

    const token = tokenOrRedirect();
    if (!token) {
      return;
    }
    setError(null);
    setNotice(null);
    setDeletingExerciseId(exercise.id);
    let deleted = false;
    try {
      await requestApi(`/exercise/${exercise.id}`, token, { method: "DELETE" });
      deleted = true;
      await refreshExercises(token);
      if (editingExerciseId === exercise.id) {
        resetForm();
      }
      if (selectedContentId === exercise.id) {
        setSelectedContentId(null);
      }
      setNotice(`Exercise #${exercise.id} deleted successfully.`);
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Unable to delete this exercise.";
      setError(deleted ? `Exercise deleted, but the list could not be refreshed: ${message}` : message);
    } finally {
      setDeletingExerciseId(null);
    }
  };

  const updateContent = async (path: string, method: "POST" | "DELETE", body: unknown, successMessage: string) => {
    const token = tokenOrRedirect();
    if (!token || !contentExercise) {
      return false;
    }
    setError(null);
    setNotice(null);
    setIsUpdatingContent(true);
    let updated = false;
    try {
      await requestApi(path, token, { method, body: JSON.stringify(body) });
      updated = true;
      await refreshExercises(token);
      setNotice(successMessage);
      return true;
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : "Unable to update exercise content.";
      setError(updated ? `Content saved, but the exercise list could not be refreshed: ${message}` : message);
      return updated;
    } finally {
      setIsUpdatingContent(false);
    }
  };

  const addExerciseQuestion = async () => {
    if (!contentExercise) {
      return;
    }
    const added = await updateContent(
      "/exercise/question",
      "POST",
      { ...questionPayload(contentQuestion), exerciseid: contentExercise.id },
      "Question added successfully.",
    );
    if (added) {
      setContentQuestion(emptyQuestion());
    }
  };

  const addExerciseWritten = async () => {
    if (!contentExercise) {
      return;
    }
    const added = await updateContent(
      "/exercise/qwrite",
      "POST",
      { ...writtenPayload(contentWritten), exerciseid: contentExercise.id },
      "Written question added successfully.",
    );
    if (added) {
      setContentWritten(emptyWritten());
    }
  };

  const addExerciseParagraph = async () => {
    if (!contentExercise) {
      return;
    }
    const added = await updateContent(
      "/exercise/paragraph",
      "POST",
      {
        title: contentParagraph.title.trim(),
        paragraphbody: contentParagraph.paragraphbody.trim(),
        question: contentParagraph.question.map(questionPayload),
        qwrites: contentParagraph.qwrites.map(writtenPayload),
        exerciseid: contentExercise.id,
      },
      "Paragraph added successfully.",
    );
    if (added) {
      setContentParagraph(emptyParagraph());
    }
  };

  const deleteContentItem = (kind: "question" | "qwrite" | "paragraph", itemId: number) => {
    if (!contentExercise) {
      return;
    }
    const label = kind === "qwrite" ? "written question" : kind;
    if (!window.confirm(`Delete this ${label}? This action cannot be undone.`)) {
      return;
    }
    void updateContent(
      `/exercise/${kind}`,
      "DELETE",
      { id: contentExercise.id, number: itemId },
      `${label[0].toUpperCase()}${label.slice(1)} deleted successfully.`,
    );
  };

  const editContentQuestion = (index: number, next: QuestionDraft) => {
    setQuestions((current) => current.map((question, itemIndex) => itemIndex === index ? next : question));
  };
  const editContentWritten = (index: number, next: WrittenDraft) => {
    setWrittenQuestions((current) => current.map((question, itemIndex) => itemIndex === index ? next : question));
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-xl bg-white p-6 shadow-sm">
          <Link href="/manager" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            ← Manager portal
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Manage exercises</h1>
          <p className="mt-1 text-sm text-gray-600">Create exercises, edit their details, manage questions, and remove exercises.</p>
        </header>

        {error && <p className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
        {notice && <p className="rounded-lg border border-green-100 bg-green-50 p-3 text-sm text-green-700" role="status">{notice}</p>}

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">{editingExerciseId === null ? "Add an exercise" : `Edit exercise #${editingExerciseId}`}</h2>
          {editingExerciseId !== null && (
            <p className="mt-2 text-sm text-gray-600">This form edits exercise details. Manage questions and paragraphs separately from the exercise list.</p>
          )}
          <form onSubmit={handleSubmit} className="mt-4 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block space-y-1">
                <span className={labelClass}>Exercise type</span>
                <select required value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className={`${fieldClass} bg-white`}>
                  {exerciseTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>
              <label className="block space-y-1">
                <span className={labelClass}>Stage</span>
                <select required value={form.stage} onChange={(event) => setForm({ ...form, stage: event.target.value })} className={`${fieldClass} bg-white`}>
                  {stages.map((stage) => <option key={stage}>{stage}</option>)}
                </select>
              </label>
              <label className="block space-y-1">
                <span className={labelClass}>Class name</span>
                <select required value={form.classname} onChange={(event) => setForm({ ...form, classname: event.target.value })} className={`${fieldClass} bg-white`}>
                  <option value="" disabled>Select a class</option>
                  {availableClassNames.map((name) => <option key={name}>{name}</option>)}
                </select>
              </label>
              <label className="block space-y-1">
                <span className={labelClass}>Subject</span>
                <select required value={form.subjectid} onChange={(event) => setForm({ ...form, subjectid: event.target.value })} className={`${fieldClass} bg-white`}>
                  <option value="" disabled>Select a subject</option>
                  {subjects.map((subject) => <option key={subject.id} value={String(subject.id)}>{subject.subjectName}</option>)}
                </select>
              </label>
              <label className="block space-y-1">
                <span className={labelClass}>Evaluation number</span>
                <input required value={form.evaluationNum} onChange={(event) => setForm({ ...form, evaluationNum: event.target.value })} className={fieldClass} />
              </label>
            </div>

            {editingExerciseId === null && (
              <div className="space-y-5 border-t border-gray-100 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">Exercise questions</h3>
                    <p className="text-sm text-gray-600">Add any multiple-choice questions, written questions, or reading paragraphs.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setQuestions((current) => [...current, emptyQuestion()])} className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">Add multiple-choice</button>
                    <button type="button" onClick={() => setWrittenQuestions((current) => [...current, emptyWritten()])} className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">Add written</button>
                    <button type="button" onClick={() => setParagraphs((current) => [...current, emptyParagraph()])} className="rounded-md border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50">Add paragraph</button>
                  </div>
                </div>
                {questions.map((question, index) => (
                  <QuestionFields
                    key={`exercise-question-${index}`}
                    idPrefix={`exercise-question-${index}`}
                    value={question}
                    onChange={(next) => editContentQuestion(index, next)}
                    onRemove={() => setQuestions((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  />
                ))}
                {writtenQuestions.map((written, index) => (
                  <WrittenFields
                    key={`exercise-written-${index}`}
                    value={written}
                    onChange={(next) => editContentWritten(index, next)}
                    onRemove={() => setWrittenQuestions((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  />
                ))}
                {paragraphs.map((paragraph, index) => (
                  <ParagraphFields
                    key={`exercise-paragraph-${index}`}
                    idPrefix={`exercise-paragraph-${index}`}
                    value={paragraph}
                    onChange={(next) => setParagraphs((current) => current.map((item, itemIndex) => itemIndex === index ? next : item))}
                    onRemove={() => setParagraphs((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  />
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" disabled={isSaving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                {isSaving ? "Saving…" : editingExerciseId === null ? "Add exercise" : "Save changes"}
              </button>
              {editingExerciseId !== null && (
                <button type="button" onClick={resetForm} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Exercise list</h2>
              <p className="mt-1 text-sm text-gray-600">{filteredExercises.length} of {exercises.length} exercises</p>
            </div>
            <label className="relative block">
              <span className="sr-only">Search exercises</span>
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400">
                <circle cx="8.5" cy="8.5" r="5.75" stroke="currentColor" strokeWidth="1.5" />
                <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search class, type, subject" className={`${fieldClass} pl-10 sm:w-72`} />
            </label>
          </div>
          {isLoading ? (
            <p className="mt-4 text-sm text-gray-600" role="status">Loading exercises…</p>
          ) : exercises.length === 0 ? (
            <p className="mt-4 text-sm text-gray-600">No exercises found.</p>
          ) : filteredExercises.length === 0 ? (
            <p className="mt-4 text-sm text-gray-600">No exercises match your search.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                  <tr>
                    <th scope="col" className="px-3 py-3 font-semibold">Exercise</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Class / stage</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Subject</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Questions</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredExercises.map((exercise) => (
                    <tr key={exercise.id}>
                      <td className="px-3 py-3 font-medium text-gray-900">{exercise.type} {exercise.evaluationNum} <span className="text-xs text-gray-500">#{exercise.id}</span></td>
                      <td className="px-3 py-3 text-gray-600">{exercise.classname} · {exercise.stage}</td>
                      <td className="px-3 py-3 text-gray-600">{exercise.subjects?.subjectName ?? `Subject #${exercise.subjectid}`}</td>
                      <td className="px-3 py-3 text-gray-600">
                        {(exercise.question ?? []).length} multiple-choice, {(exercise.qwrites ?? []).length} written, {(exercise.paragraphs ?? []).length} paragraphs
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button type="button" onClick={() => handleEdit(exercise)} className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">Edit</button>
                          <button type="button" onClick={() => { setSelectedContentId(exercise.id); setError(null); setNotice(null); }} className="rounded-md border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">Manage questions</button>
                          <button type="button" onClick={() => void handleDelete(exercise)} disabled={deletingExerciseId === exercise.id} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">
                            {deletingExerciseId === exercise.id ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {contentExercise && (
          <section className="space-y-5 rounded-xl bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Manage questions — {contentExercise.type} {contentExercise.evaluationNum}</h2>
                <p className="mt-1 text-sm text-gray-600">Delete existing items or add new ones. The API does not provide an update route for individual questions.</p>
              </div>
              <button type="button" onClick={() => setSelectedContentId(null)} className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">Close</button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800">Multiple-choice questions</h3>
                {(contentExercise.question ?? []).map((question) => (
                  <div key={question.id} className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{question.ask}</p>
                      <p className="mt-1 text-xs text-gray-600">Correct option: {question.answer}</p>
                    </div>
                    <button type="button" disabled={isUpdatingContent} onClick={() => deleteContentItem("question", question.id)} className="shrink-0 text-xs font-semibold text-red-700 hover:text-red-900 disabled:opacity-50">Delete</button>
                  </div>
                ))}
                {(contentExercise.question ?? []).length === 0 && <p className="text-sm text-gray-500">No multiple-choice questions.</p>}
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800">Written questions</h3>
                {(contentExercise.qwrites ?? []).map((written) => (
                  <div key={written.id} className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{written.ask}</p>
                      <p className="mt-1 text-xs text-gray-600">{written.type} · {written.degrees ?? 0} degrees</p>
                    </div>
                    <button type="button" disabled={isUpdatingContent} onClick={() => deleteContentItem("qwrite", written.id)} className="shrink-0 text-xs font-semibold text-red-700 hover:text-red-900 disabled:opacity-50">Delete</button>
                  </div>
                ))}
                {(contentExercise.qwrites ?? []).length === 0 && <p className="text-sm text-gray-500">No written questions.</p>}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Reading paragraphs</h3>
              {(contentExercise.paragraphs ?? []).map((paragraph) => (
                <div key={paragraph.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{paragraph.title || "Untitled paragraph"}</h4>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{paragraph.paragraphbody}</p>
                    </div>
                    <button type="button" disabled={isUpdatingContent} onClick={() => deleteContentItem("paragraph", paragraph.id)} className="shrink-0 text-xs font-semibold text-red-700 hover:text-red-900 disabled:opacity-50">Delete paragraph</button>
                  </div>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <h5 className="text-xs font-semibold uppercase text-gray-500">Paragraph questions</h5>
                      {(paragraph.question ?? []).map((question) => (
                        <div key={question.id} className="flex items-start justify-between gap-2 text-sm">
                          <span>{question.ask}</span>
                          <button type="button" disabled={isUpdatingContent} onClick={() => deleteContentItem("question", question.id)} className="shrink-0 text-xs font-semibold text-red-700 disabled:opacity-50">Delete</button>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <h5 className="text-xs font-semibold uppercase text-gray-500">Paragraph written questions</h5>
                      {(paragraph.qwrites ?? []).map((written) => (
                        <div key={written.id} className="flex items-start justify-between gap-2 text-sm">
                          <span>{written.ask}</span>
                          <button type="button" disabled={isUpdatingContent} onClick={() => deleteContentItem("qwrite", written.id)} className="shrink-0 text-xs font-semibold text-red-700 disabled:opacity-50">Delete</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {(contentExercise.paragraphs ?? []).length === 0 && <p className="text-sm text-gray-500">No paragraphs.</p>}
            </div>

            <div className="space-y-4 border-t border-gray-100 pt-5">
              <h3 className="font-semibold text-gray-900">Add content</h3>
              <div className="grid gap-5 xl:grid-cols-2">
                <div className="space-y-3">
                  <QuestionFields idPrefix="existing-exercise-question" value={contentQuestion} onChange={setContentQuestion} onRemove={() => setContentQuestion(emptyQuestion())} />
                  <button type="button" disabled={isUpdatingContent || !isQuestionDraftValid(contentQuestion)} onClick={() => void addExerciseQuestion()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">Add multiple-choice question</button>
                </div>
                <div className="space-y-3">
                  <WrittenFields value={contentWritten} onChange={setContentWritten} onRemove={() => setContentWritten(emptyWritten())} />
                  <button type="button" disabled={isUpdatingContent || !isWrittenDraftValid(contentWritten)} onClick={() => void addExerciseWritten()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">Add written question</button>
                </div>
              </div>
              <div className="space-y-3">
                <ParagraphFields idPrefix="content-paragraph" value={contentParagraph} onChange={setContentParagraph} onRemove={() => setContentParagraph(emptyParagraph())} />
                <button type="button" disabled={isUpdatingContent || !contentParagraph.title.trim() || !contentParagraph.paragraphbody.trim() || !contentParagraph.question.every(isQuestionDraftValid) || !contentParagraph.qwrites.every(isWrittenDraftValid)} onClick={() => void addExerciseParagraph()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">Add paragraph</button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
