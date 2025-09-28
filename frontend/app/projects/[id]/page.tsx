"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import logo from "../../logo.png";
import userPic from "../../user.png";
import Link from "next/link";


type UploadedFile = {
  file: File;
  name: string;
  sizeLabel: string;
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  return `${size} ${sizes[i]}`;
}

export default function ProjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params?.id as string;

  const [projectName, setProjectName] = useState("");
  const [submissions, setSubmissions] = useState<UploadedFile[]>([]);
  const [rubric, setRubric] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [gradesResult, setGradesResult] = useState<any | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState(0);
  const [step, setStep] = useState<"submissions" | "submissionsList" | "grades">("submissions");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ai-grader-projects");
      const projects = raw ? (JSON.parse(raw) as Array<{ id: string; name: string }>) : [];
      const current = projects.find((p) => p.id === projectId);
      setProjectName(current?.name || "");

      const savedRubricRaw = localStorage.getItem(`ai-grader-rubric-${projectId}`);
      if (savedRubricRaw) setRubric(JSON.parse(savedRubricRaw));
    } catch {}
  }, [projectId]);

  const uploadCard = (
    <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 px-6 py-10 transition-colors hover:border-[#a8ffe9] hover:bg-[#e8fffb] cursor-pointer">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-black/50" aria-hidden>
        <path d="M7 20a5 5 0 1 1 1.938-9.615A7 7 0 0 1 21 14a4 4 0 1 1-2.59 7.112L18.3 21H7Z" opacity=".2"/>
        <path d="M12 12V4m0 0 3 3m-3-3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
      <div className="text-center">
        <p className="text-sm font-medium">Drag & drop files here</p>
        <p className="text-xs text-gray-500">or click to browse</p>
      </div>
      <input
        type="file"
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.md"
        className="hidden"
        multiple
        onChange={(e) => {
          const list = e.target.files;
          if (!list) return;
          const mapped: UploadedFile[] = Array.from(list).map((file) => ({
            file,
            name: file.name,
            sizeLabel: formatBytes(file.size),
          }));
          setSubmissions((prev) => [...prev, ...mapped]);
        }}
      />
    </label>
  );

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

  const updateCriterionPoints = (sIdx: number, pIdx: number, cIdx: number, value: string) => {
    setGradesResult((prev: any) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const crit = next.students[sIdx].problems[pIdx].criteria[cIdx];
      const num = clamp(Number(value ?? 0) || 0, 0, crit.maxPoints);
      crit.pointsAwarded = num;
      const prob = next.students[sIdx].problems[pIdx];
      prob.score = prob.criteria.reduce((sum: number, c: any) => sum + (c.pointsAwarded || 0), 0);
      const student = next.students[sIdx];
      student.total = student.problems.reduce((sum: number, p: any) => sum + (p.score || 0), 0);
      return next;
    });
  };

  const updateCriterionComment = (sIdx: number, pIdx: number, cIdx: number, value: string) => {
    setGradesResult((prev: any) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next.students[sIdx].problems[pIdx].criteria[cIdx].comment = value;
      return next;
    });
  };

  const updateProblemComment = (sIdx: number, pIdx: number, value: string) => {
    setGradesResult((prev: any) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next.students[sIdx].problems[pIdx].comment = value;
      return next;
    });
  };

  return (
    <div className="font-sans min-h-screen bg-[#f9f9fb] text-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 shadow-sm rounded-[50px] mt-6 mx-6 mb-6">

  <div className="flex items-center gap-3">
  <Link href="/">
    <Image src={logo} alt="logo" width={200} height={200} className="cursor-pointer" />
  </Link>
</div>

  <div className="flex items-center gap-3">
    <div className="flex items-center gap-4">
  <Image src={userPic} alt="User" width={50} height={50} className="rounded-full" />

  <div className="flex flex-col text-base">
    <span className="font-semibold text-black dark:text-white text-base">Jose Simmons</span>
    <small className="text-sm text-black/50 dark:text-white/50">Instructor</small>
  </div>
</div>
    <div className="flex items-center gap-2 ml-4 text-black/60 dark:text-white/60">
      <i className="fa-solid fa-gear cursor-pointer hover:text-black dark:hover:text-white"></i>
      <i className="fa-solid fa-ellipsis-vertical cursor-pointer hover:text-black dark:hover:text-white"></i>
    </div>
  </div>
</header>

      <main className="px-6 sm:px-10 pb-16">
        <div className="max-w-6xl mx-auto">
          <section className="text-center py-6">
            <h1 className="text-2xl font-semibold tracking-tight">Student submissions</h1>
            <p className="text-sm text-gray-500">Upload files for {projectName || "this project"}, then grade and review results.</p>
          </section>

          {/* Submissions Upload */}
          {step === "submissions" && (
            <section className="grid grid-cols-1 gap-6">
              <div className="rounded-2xl border border-gray-200 p-6 sm:p-8 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Upload student submissions</h2>
                </div>
                {uploadCard}
                <div className="flex justify-end">
                  <button
                    disabled={submissions.length === 0}
                    className={`mt-6 rounded-full px-6 py-3 text-sm font-medium transition-colors ${
                      submissions.length > 0
                        ? "bg-[#0fe3c2] text-black hover:bg-[#a8ffe9]"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                    onClick={() => setStep("submissionsList")}
                  >
                    View submissions
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Submissions List */}
          {step === "submissionsList" && (
            <section className="grid grid-cols-1 gap-6">
              <div className="rounded-2xl border border-gray-200 p-6 sm:p-8 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h2 className="text-xl font-semibold tracking-tight">Student submissions</h2>
                  <div className="flex items-center gap-2">
                    {submissions.length > 0 && !gradesResult && (
                      <button
                        className="text-xs rounded-full px-3 py-1 bg-[#0fe3c2] text-black hover:bg-[#a8ffe9]"
                        onClick={async () => {
                          try {
                            setIsLoading(true);
                            const form = new FormData();
                            form.append("projectName", projectName);
                            form.append("rubric", JSON.stringify(rubric));
                            for (const f of submissions) form.append("submissions", f.file);
                            const res = await fetch("/api/grade", { method: "POST", body: form });
                            if (!res.ok) throw new Error("Grading failed");
                            const data = await res.json();
                            setGradesResult(data);
                            setSelectedSubmission(0);
                            setStep("grades");
                          } catch (e) {
                            alert("Failed to grade submissions. Please try again.");
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                      >
                        {isLoading ? "Grading…" : "Grade all works"}
                      </button>
                    )}
                    <button
                      className="text-xs rounded-full px-3 py-1 border border-gray-200 hover:bg-gray-100"
                      onClick={() => setStep("submissions")}
                    >
                      Upload more submissions
                    </button>
                  </div>
                </div>
                {submissions.length === 0 ? (
                  <p className="text-sm text-gray-500">No submissions yet. Use "Upload more submissions" to add files.</p>
                ) : (
                  <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 overflow-hidden">
                    {submissions.map((s, i) => (
                      <li key={`${s.name}-${i}`} className="flex items-center gap-3 px-3 py-2 bg-white rounded-lg shadow-sm hover:bg-[#a8ffe9;]">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" title={s.name}>{s.name}</p>
                          <p className="text-xs text-gray-500">{s.sizeLabel}</p>
                        </div>
                        {!gradesResult ? (
                          <span className="ml-auto text-[10px] rounded-full px-2 py-1 border border-gray-200 text-gray-500">
                            Ungraded
                          </span>
                        ) : (
                          <button
                            className="ml-auto text-xs rounded-full px-3 py-1 border border-gray-200 hover:bg-gray-100"
                            onClick={() => {
                              setSelectedSubmission(i);
                              setStep("grades");
                            }}
                          >
                            Review grading
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
