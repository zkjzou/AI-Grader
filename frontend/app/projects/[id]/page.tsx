"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

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
    <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 transition-colors border-black/10 dark:border-white/20 hover:border-[#818cf8] hover:bg-[#818cf8]/5 cursor-pointer">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-black/50 dark:text-white/50" aria-hidden>
        <path d="M7 20a5 5 0 1 1 1.938-9.615A7 7 0 0 1 21 14a4 4 0 1 1-2.59 7.112L18.3 21H7Z" opacity=".2"/>
        <path d="M12 12V4m0 0 3 3m-3-3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
      <div className="text-center">
        <p className="text-sm font-medium">Drag & drop files here</p>
        <p className="text-xs text-black/60 dark:text-white/60">or click to browse</p>
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
      // Recompute problem score
      const prob = next.students[sIdx].problems[pIdx];
      prob.score = prob.criteria.reduce((sum: number, c: any) => sum + (c.pointsAwarded || 0), 0);
      // Recompute student total
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
    <div className="font-sans min-h-screen">
      <header className="px-6 sm:px-10 pt-8 pb-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#818cf8]" />
            <span className="text-base font-semibold tracking-tight">{projectName || "Project"}</span>
          </div>
          <button
            className="text-xs rounded-full px-3 py-1 border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5"
            onClick={() => router.push("/")}
          >
            All projects
          </button>
        </div>
      </header>

      <main className="px-6 sm:px-10 pb-16">
        <div className="max-w-6xl mx-auto">
          <section className="text-center py-6">
            <h1 className="text-2xl font-semibold tracking-tight">Student submissions</h1>
            <p className="text-sm text-black/70 dark:text-white/70">Upload files for {projectName || "this project"}, then grade and review results.</p>
          </section>

          {step === "submissions" && (
            <section className="grid grid-cols-1 gap-6">
              <div className="rounded-2xl border border-black/10 dark:border-white/15 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Upload student submissions</h2>
                </div>
                {uploadCard}
                <div className="flex justify-end">
                  <button
                    disabled={submissions.length === 0}
                    className={`mt-6 rounded-full px-6 py-3 text-sm font-medium transition-colors ${
                      submissions.length > 0
                        ? "bg-[#818cf8] text-white hover:bg-[#6c79f6]"
                        : "bg-black/10 dark:bg-white/10 text-black/60 dark:text-white/60 cursor-not-allowed"
                    }`}
                    onClick={() => setStep("submissionsList")}
                  >
                    View submissions
                  </button>
                </div>
              </div>
            </section>
          )}

          {step === "submissionsList" && (
            <section className="grid grid-cols-1 gap-6">
              <div className="rounded-2xl border border-black/10 dark:border-white/15 p-6 sm:p-8">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h2 className="text-xl font-semibold tracking-tight">Student submissions</h2>
                  <div className="flex items-center gap-2">
                    {submissions.length > 0 && !gradesResult && (
                      <button
                        className="text-xs rounded-full px-3 py-1 bg-[#10b981] text-white hover:bg-[#0ea371]"
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
                      className="text-xs rounded-full px-3 py-1 border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5"
                      onClick={() => setStep("submissions")}
                    >
                      Upload more submissions
                    </button>
                  </div>
                </div>
                {submissions.length === 0 ? (
                  <p className="text-sm text-black/60 dark:text-white/60">No submissions yet. Use "Upload more submissions" to add files.</p>
                ) : (
                  <ul className="divide-y divide-black/10 dark:divide-white/15 rounded-lg border border-black/10 dark:border-white/15 overflow-hidden">
                    {submissions.map((s, i) => (
                      <li key={`${s.name}-${i}`} className="flex items-center gap-3 px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" title={s.name}>{s.name}</p>
                          <p className="text-xs text-black/60 dark:text-white/60">{s.sizeLabel}</p>
                        </div>
                        {!gradesResult ? (
                          <span className="ml-auto text-[10px] rounded-full px-2 py-1 border border-black/10 dark:border-white/15 text-black/60 dark:text-white/60">
                            Ungraded
                          </span>
                        ) : (
                          <button
                            className="ml-auto text-xs rounded-full px-3 py-1 border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5"
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
          {step === "grades" && gradesResult && (
            <section className="grid grid-cols-1 gap-6">
              <div className="rounded-2xl border border-black/10 dark:border-white/15 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  <div className="bg-black/5 dark:bg-white/5 min-h-[520px] p-4">
                    <div className="aspect-[1/1.3] w-full h-auto bg-black/10 dark:bg-white/10 flex items-center justify-center text-xs text-black/60 dark:text-white/60">
                      PDF preview placeholder for {gradesResult.students[selectedSubmission]?.filename}
                    </div>
                  </div>
                  <div className="p-6 border-t lg:border-t-0 lg:border-l border-black/10 dark:border-white/15">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-lg font-semibold">Score: {gradesResult.students[selectedSubmission]?.total.toFixed(1)}</h2>
                        <p className="text-xs text-black/60 dark:text-white/60">{gradesResult.students[selectedSubmission]?.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          className="text-xs bg-transparent outline-none border rounded-md border-black/10 dark:border-white/15 px-2 py-1"
                          value={selectedSubmission}
                          onChange={(e) => setSelectedSubmission(Number(e.target.value))}
                        >
                          {gradesResult.students.map((s: any, i: number) => (
                            <option key={s.id} value={i}>{s.filename}</option>
                          ))}
                        </select>
                        <button
                          className="text-xs rounded-full px-3 py-1 bg-[#818cf8] text-white hover:bg-[#6c79f6]"
                          onClick={() => setSelectedSubmission((i) => Math.min(i + 1, gradesResult.students.length - 1))}
                        >
                          Next submission
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {gradesResult.students[selectedSubmission]?.problems.map((p: any, idx: number) => (
                        <details key={p.problemId} className="rounded-lg border border-black/10 dark:border-white/15 overflow-hidden" open>
                          <summary className="cursor-pointer select-none px-4 py-3 flex items-center justify-between">
                            <span className="text-sm font-medium">{idx + 1}. {p.title}</span>
                            <span className="text-xs">{p.score.toFixed(1)} / {p.maxPoints}</span>
                          </summary>
                          <div className="px-4 pb-4">
                            <div className="space-y-2">
                              {p.criteria.map((c: any, cIdx: number) => (
                                <div key={c.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 rounded-md border border-black/10 dark:border-white/15 px-3 py-2">
                                  <div>
                                    <p className="text-xs font-medium mb-1">{c.id}</p>
                                    <textarea
                                      className="w-full text-xs bg-transparent outline-none border rounded-md border-black/10 dark:border-white/15 px-3 py-2 focus:border-[#818cf8]"
                                      value={c.comment || ""}
                                      onChange={(e) => updateCriterionComment(selectedSubmission, idx, cIdx, e.target.value)}
                                    />
                                  </div>
                                  <div className="flex items-center gap-2 md:justify-end">
                                    <span className="text-[10px] text-black/60 dark:text-white/60">Points</span>
                                    <input
                                      type="number"
                                      min={0}
                                      max={c.maxPoints}
                                      className="w-20 text-xs bg-transparent outline-none border rounded-md border-black/10 dark:border-white/15 px-2 py-1 focus:border-[#818cf8]"
                                      value={c.pointsAwarded}
                                      onChange={(e) => updateCriterionPoints(selectedSubmission, idx, cIdx, e.target.value)}
                                    />
                                    <span className="text-[10px] text-black/60 dark:text-white/60">/ {c.maxPoints}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3">
                              <label className="block text-[11px] text-black/60 dark:text-white/60 mb-1">Problem comment</label>
                              <textarea
                                className="w-full text-xs bg-transparent outline-none border rounded-md border-black/10 dark:border-white/15 px-3 py-2 focus:border-[#818cf8]"
                                value={p.comment || ""}
                                onChange={(e) => updateProblemComment(selectedSubmission, idx, e.target.value)}
                              />
                            </div>
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}


