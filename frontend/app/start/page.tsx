"use client";



import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logo from "../logo.png";
import userPic from "../user.png";
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

function UploadCard({
  title,
  description,
  accept,
  onFilesSelected,
  files,
}: {
  title: string;
  description: string;
  accept: string;
  onFilesSelected: (files: FileList | null) => void;
  files: UploadedFile[];
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFilesSelected(e.dataTransfer.files);
        e.dataTransfer.clearData();
      }
    },
    [onFilesSelected]
  );

  const areaClasses = useMemo(
    () =>
      `flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 transition-colors ${
        isDragging
          ? "border-[#0fe3c2] bg-[#0fe3c2]/10"
          : "border-black/10 dark:border-white/20 hover:border-[#0fe3c2] hover:bg-[#0fe3c2]/5"
      }`,
    [isDragging]
  );

  return (
    <div className="w-full max-w-xl mx-auto rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-gray-900 shadow-sm p-6 sm:p-8">

      <div className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight mb-1">{title}</h2>
        <p className="text-sm text-black/60 dark:text-white/60 mb-5">{description}</p>

        <label
          className={areaClasses}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-10 h-10 text-black/50 dark:text-white/50"
            aria-hidden
          >
            <path d="M7 20a5 5 0 1 1 1.938-9.615A7 7 0 0 1 21 14a4 4 0 1 1-2.59 7.112L18.3 21H7Z" opacity=".2"/>
            <path d="M12 12V4m0 0 3 3m-3-3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          <div className="text-center">
            <p className="text-sm font-medium">Drag & drop files here</p>
            <p className="text-xs text-black/60 dark:text-white/60">or click to browse</p>
          </div>
          <input
            type="file"
            accept={accept}
            onChange={(e) => onFilesSelected(e.target.files)}
            className="hidden"
            multiple
          />
        </label>

        {files.length > 0 && (
          <div className="mt-5 space-y-2">
            {files.map((f, idx) => (
              <div
                key={`${f.name}-${idx}`}
                className="flex items-center justify-between rounded-lg border border-black/10 dark:border-white/15 px-3 py-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-[#0fe3c2]" />
                  <p className="text-sm truncate" title={f.name}>{f.name}</p>
                </div>
                <span className="text-xs text-black/60 dark:text-white/60 shrink-0">{f.sizeLabel}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProblemsEditor({
  initialItems,
  onFinalize,
}: {
  initialItems: Array<{
    id: string;
    title: string;
    prompt: string;
    maxPoints: number;
    rubric: Array<{ id: string; description: string; points: number }>;
  }>;
  onFinalize?: (items: Array<{
    id: string;
    title: string;
    prompt: string;
    maxPoints: number;
    rubric: Array<{ id: string; description: string; points: number }>;
  }>) => void;
}) {
  type EditorCriterion = { id: string; description: string; points: number };
  type EditorSubquestion = { id: string; prefix: string; description: string; criteria: EditorCriterion[] };
  type EditorProblem = { id: string; title: string; prompt: string; subquestions: EditorSubquestion[] };

  const toEditorModel = (items: Array<{ id: string; title: string; prompt: string; rubric: Array<{ id: string; description: string; points: number }> }>): EditorProblem[] => {
    return items.map((p, idx) => ({
      id: p.id,
      title: p.title,
      prompt: p.prompt,
      subquestions: [
        {
          id: `sq-${Math.random().toString(36).slice(2, 8)}`,
          prefix: "a",
          description: "",
          criteria: p.rubric?.length ? p.rubric : [],
        },
      ],
    }));
  };

  const [items, setItems] = useState<EditorProblem[]>(toEditorModel(initialItems));

  const updateProblemField = (id: string, field: "title" | "prompt", value: string) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const addProblem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `p-${Math.random().toString(36).slice(2, 8)}`,
        title: "New problem",
        prompt: "Describe the task...",
        subquestions: [
          {
            id: `sq-${Math.random().toString(36).slice(2, 8)}`,
            prefix: "a",
            description: "",
            criteria: [
              { id: `c-${Math.random().toString(36).slice(2, 8)}`, description: "Clarity", points: 2 },
              { id: `c-${Math.random().toString(36).slice(2, 8)}`, description: "Correctness", points: 3 },
            ],
          },
        ],
      },
    ]);
  };

  const removeProblem = (pid: string) => {
    setItems((prev) => prev.filter((p) => p.id !== pid));
  };

  const nextLetter = (n: number) => String.fromCharCode("a".charCodeAt(0) + n);

  const addSubquestion = (pid: string) => {
    setItems((prev) =>
      prev.map((p) =>
        p.id === pid
          ? {
              ...p,
              subquestions: [
                ...p.subquestions,
                {
                  id: `sq-${Math.random().toString(36).slice(2, 8)}`,
                  prefix: nextLetter(p.subquestions.length),
                  description: "",
                  criteria: [],
                },
              ],
            }
          : p
      )
    );
  };

  const updateSubPrefix = (pid: string, sid: string, value: string) => {
    setItems((prev) =>
      prev.map((p) =>
        p.id === pid
          ? { ...p, subquestions: p.subquestions.map((s) => (s.id === sid ? { ...s, prefix: value } : s)) }
          : p
      )
    );
  };

  const updateSubDescription = (pid: string, sid: string, value: string) => {
    setItems((prev) =>
      prev.map((p) =>
        p.id === pid
          ? { ...p, subquestions: p.subquestions.map((s) => (s.id === sid ? { ...s, description: value } : s)) }
          : p
      )
    );
  };

  const removeSubquestion = (pid: string, sid: string) => {
    setItems((prev) =>
      prev.map((p) =>
        p.id === pid ? { ...p, subquestions: p.subquestions.filter((s) => s.id !== sid) } : p
      )
    );
  };

  const addCriterion = (pid: string, sid: string) => {
    setItems((prev) =>
      prev.map((p) =>
        p.id === pid
          ? {
              ...p,
              subquestions: p.subquestions.map((s) =>
                s.id === sid
                  ? {
                      ...s,
                      criteria: [
                        ...s.criteria,
                        { id: `c-${Math.random().toString(36).slice(2, 8)}`, description: "New criterion", points: 1 },
                      ],
                    }
                  : s
              ),
            }
          : p
      )
    );
  };

  const updateCriterion = (
    pid: string,
    sid: string,
    cid: string,
    field: "description" | "points",
    value: string
  ) => {
    setItems((prev) =>
      prev.map((p) =>
        p.id === pid
          ? {
              ...p,
              subquestions: p.subquestions.map((s) =>
                s.id === sid
                  ? {
                      ...s,
                      criteria: s.criteria.map((c) =>
                        c.id === cid
                          ? { ...c, [field]: field === "points" ? Number(value || 0) : value }
                          : c
                      ),
                    }
                  : s
              ),
            }
          : p
      )
    );
  };

  const removeCriterion = (pid: string, sid: string, cid: string) => {
    setItems((prev) =>
      prev.map((p) =>
        p.id === pid
          ? {
              ...p,
              subquestions: p.subquestions.map((s) =>
                s.id === sid ? { ...s, criteria: s.criteria.filter((c) => c.id !== cid) } : s
              ),
            }
          : p
      )
    );
  };

  const problemMaxPoints = (p: EditorProblem) =>
    p.subquestions.reduce(
      (sum, sq) => sum + sq.criteria.reduce((s, c) => s + (c.points || 0), 0),
      0
    );

  const totalPoints = items.reduce((sum, p) => sum + problemMaxPoints(p), 0);

  const handleFinalize = () => {
    const flattened = items.map((p) => ({
      id: p.id,
      title: p.title,
      prompt: p.prompt,
      maxPoints: problemMaxPoints(p),
      rubric: p.subquestions.flatMap((sq) => sq.criteria),
    }));
    onFinalize?.(flattened);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-black/70 dark:text-white/70">
          Total max points: <span className="font-medium">{totalPoints}</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            className="text-xs rounded-full px-3 py-1 bg-[#0fe3c2] text-white hover:bg-[#a8ffe9]"
            onClick={addProblem}
          >
            Add problem
          </button>
        </div>
      </div>

      {items.map((p) => (
        <div key={p.id} className="rounded-xl border border-black/10 dark:border-white/15 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <input
              className="w-full text-base font-medium bg-transparent outline-none border-b border-transparent focus:border-[#0fe3c2] pb-1"
              value={p.title}
              onChange={(e) => updateProblemField(p.id, "title", e.target.value)}
            />
            <button
              className="text-xs rounded-full px-2 py-1 border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 shrink-0"
              onClick={() => removeProblem(p.id)}
            >
              Remove
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
            <textarea
              className="w-full resize-y min-h-[72px] text-sm bg-transparent outline-none border rounded-md border-black/10 dark:border-white/15 px-3 py-2 focus:border-[#0fe3c2]"
              value={p.prompt}
              onChange={(e) => updateProblemField(p.id, "prompt", e.target.value)}
            />
            <div className="flex md:flex-col items-center md:items-end gap-2">
              <span className="text-xs text-black/60 dark:text-white/60">Max points</span>
              <span className="w-24 text-sm font-medium text-center">{problemMaxPoints(p)}</span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Subquestions</h3>
              <button
                className="text-xs rounded-full px-2 py-1 border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5"
                onClick={() => addSubquestion(p.id)}
              >
                Add subquestion
              </button>
            </div>

            {p.subquestions.map((sq) => (
              <div key={sq.id} className="rounded-lg border border-black/10 dark:border-white/15 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-black/60 dark:text-white/60">Prefix</label>
                  <input
                    className="w-20 text-sm bg-transparent outline-none border rounded-md border-black/10 dark:border-white/15 px-2 py-1 focus:border-[#0fe3c2]"
                    value={sq.prefix}
                    onChange={(e) => updateSubPrefix(p.id, sq.id, e.target.value)}
                  />
                  <input
                    className="flex-1 text-sm bg-transparent outline-none border rounded-md border-black/10 dark:border-white/15 px-3 py-2 focus:border-[#0fe3c2]"
                    placeholder="Subquestion description"
                    value={sq.description}
                    onChange={(e) => updateSubDescription(p.id, sq.id, e.target.value)}
                  />
                  <button
                    className="ml-auto text-xs rounded-full px-2 py-1 border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5"
                    onClick={() => addCriterion(p.id, sq.id)}
                  >
                    Add criterion
                  </button>
                  <button
                    className="text-xs rounded-full px-2 py-1 border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5"
                    onClick={() => removeSubquestion(p.id, sq.id)}
                  >
                    Remove subquestion
                  </button>
                </div>

                {sq.criteria.map((c) => (
                  <div key={c.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-md border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5">{sq.prefix}</span>
                      <input
                        className="w-full text-sm bg-transparent outline-none border rounded-md border-black/10 dark:border-white/15 px-3 py-2 focus:border-[#0fe3c2]"
                        value={c.description}
                        onChange={(e) => updateCriterion(p.id, sq.id, c.id, "description", e.target.value)}
                      />
                    </div>
                    <input
                      type="number"
                      min={0}
                      className="w-24 text-sm bg-transparent outline-none border rounded-md border-black/10 dark:border-white/15 px-3 py-2 focus:border-[#0fe3c2]"
                      value={c.points}
                      onChange={(e) => updateCriterion(p.id, sq.id, c.id, "points", e.target.value)}
                    />
                    <button
                      className="text-xs rounded-full px-2 py-1 border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5"
                      onClick={() => removeCriterion(p.id, sq.id, c.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <button
          className="rounded-full px-5 py-2 text-sm font-medium bg-[#0fe3c2] text-white hover:bg-[#a8ffe9]"
          onClick={handleFinalize}
        >
          Proceed to grading
        </button>
      </div>
    </div>
  );
}

// Matching UI removed from the main page. Project pages now handle grading UX.

export default function Home() {
  const router = useRouter();
  const [problemFiles, setProblemFiles] = useState<UploadedFile[]>([]);
  const [rubricFiles, setRubricFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [assignmentName, setAssignmentName] = useState("");
  const [parseResult, setParseResult] = useState<null | {
    items: Array<{
      id: string;
      title: string;
      prompt: string;
      maxPoints: number;
      rubric: Array<{ id: string; description: string; points: number }>;
    }>;
    assignmentId: string;
  }>(null);
  const [step, setStep] = useState<"upload" | "review">("upload");
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const handleProblemFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    const mapped: UploadedFile[] = Array.from(list).map((file) => ({
      file,
      name: file.name,
      sizeLabel: formatBytes(file.size),
    }));
    setProblemFiles((prev) => [...prev, ...mapped]);
  }, []);

  const handleRubricFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    const mapped: UploadedFile[] = Array.from(list).map((file) => ({
      file,
      name: file.name,
      sizeLabel: formatBytes(file.size),
    }));
    setRubricFiles((prev) => [...prev, ...mapped]);
  }, []);

  // Function to map backend data structure to frontend format
  const mapBackendToFrontend = (backendData: any) => {
    if (!backendData.rubric || !Array.isArray(backendData.rubric)) {
      return [];
    }

    return backendData.rubric.map((problem: any, index: number) => ({
      id: problem.id || `problem-${index}`,
      title: problem.name || `Problem ${index + 1}`,
      prompt: problem.description || "",
      maxPoints: problem.total || 0,
      rubric: problem.items?.map((item: any, itemIndex: number) => ({
        id: item.id || `item-${index}-${itemIndex}`,
        description: item.description || "",
        points: item.points || 0,
      })) || [],
    }));
  };

  // Polling function to check assignment processing status
  const pollAssignmentStatus = useCallback(async (assignmentId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/assignments/${assignmentId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch assignment status");
      }
      const data = await response.json();
      
      // Check if processing is complete (rubric is available)
      if (data.rubric && data.problem_structure) {
        // Stop polling
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        
        // Map the data and proceed to review
        const mappedItems = mapBackendToFrontend(data);
        setParseResult({
          items: mappedItems,
          assignmentId: assignmentId,
        });
        setStep("review");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error polling assignment status:", error);
      // Continue polling on error, but maybe add retry limit
    }
  }, [pollingInterval]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Uploading rubric/solutions is optional now; users must finish rubric editing to proceed.
  const isReady = problemFiles.length > 0 && assignmentName.trim() !== ""; // problem set and name required


  return (
    <div className="font-sans min-h-screen " >
<header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 shadow-sm rounded-[50px] mt-6 mx-6 mb-6">

  <div className="flex items-center gap-6">
    <Link href="/">
      <Image src={logo} alt="logo" width={200} height={200} className="cursor-pointer" />
    </Link>
    <nav className="flex items-center gap-4">
      <Link href="/start" className="text-sm font-medium text-black dark:text-white hover:text-[#0fe3c2]">
        Create Assignment
      </Link>
      <Link href="/submissions" className="text-sm font-medium text-black/60 dark:text-white/60 hover:text-[#0fe3c2]">
        Grade Submissions
      </Link>
    </nav>
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
        <div className="max-w-4xl mx-auto mt-15">

          {step === "upload" && (
            <section className="flex justify-center w-full">
              <div className="w-full max-w-xl mx-auto rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-gray-900 shadow-sm p-6 sm:p-8">
                <h2 className="text-xl font-semibold tracking-tight mb-1">Create Assignment</h2>
                <p className="text-sm text-black/60 dark:text-white/60 mb-6">
                  Give your assignment a name and upload the problem set.
                </p>

                {/* Assignment Name Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Assignment Name</label>
                  <input
                    className="w-full text-sm bg-transparent outline-none border rounded-md border-black/10 dark:border-white/15 px-3 py-2 focus:border-[#0fe3c2]"
                    placeholder="e.g., Linear Algebra Homework 2"
                    value={assignmentName}
                    onChange={(e) => setAssignmentName(e.target.value)}
                  />
                </div>

                <UploadCard
                  title="Upload problem set"
                  description="PDF, DOCX, images, or plain text"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.md"
                  onFilesSelected={handleProblemFiles}
                  files={problemFiles}
                />
              </div>
            </section>
          )}

          {step === "upload" && (
            <div className="flex justify-center">
              <button
                disabled={!isReady || isLoading}
                className={`mt-8 rounded-full px-6 py-3 text-sm font-medium transition-colors ${
                  isReady && !isLoading
                    ? "bg-[#0fe3c2] text-white hover:bg-[#a8ffe9]"
                    : "bg-black/10 dark:bg-white/10 text-black/60 dark:text-white/60 cursor-not-allowed"
                }`}
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    
                    const form = new FormData();
                    form.append("file", problemFiles[0].file);
                    form.append("name", assignmentName.trim());
                    const res = await fetch("http://localhost:8000/assignments", {
                      method: "POST",
                      body: form,
                    });
                    if (!res.ok) throw new Error("Upload failed");
                    const data = await res.json();
                    console.log("Assignment created:", data);
                    
                    // Start polling for processing completion
                    const assignmentId = data.assignment_id;
                    if (assignmentId) {
                      // Start polling every 2 seconds
                      const interval = setInterval(() => {
                        pollAssignmentStatus(assignmentId);
                      }, 2000);
                      setPollingInterval(interval);
                      
                      // Also poll immediately
                      pollAssignmentStatus(assignmentId);
                    } else {
                      throw new Error("No assignment ID returned");
                    }
                  } catch (e) {
                    console.error("Upload error:", e);
                    alert("Failed to submit files. Please try again.");
                    setIsLoading(false);
                  }
                }}
              >
                {isLoading ? "Parsing…" : "Review extracted problems"}
              </button>
            </div>
          )}

          {isLoading && (
            <div className="mt-10 flex justify-center">
              <div className="flex items-center gap-3 text-sm text-black/70 dark:text-white/70">
                <svg
                  className="animate-spin h-5 w-5 text-[#0fe3c2]"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                <span>Processing assignment and extracting problems…</span>
              </div>
            </div>
          )}

          {step === "review" && parseResult && (
            <section className="mt-6 md:mt-8 grid grid-cols-1 gap-6">
              <div className="rounded-2xl border border-black/10 dark:border-white/15 p-6 sm:p-8">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h2 className="text-xl font-semibold tracking-tight">Review extracted problems & rubrics</h2>
                  <div className="flex items-center gap-2">
                    <button
                      className="text-xs rounded-full px-3 py-1 border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5"
                      onClick={() => {
                        setParseResult(null);
                        setProblemFiles([]);
                        setRubricFiles([]);
                        setStep("upload");
                      }}
                    >
                      Start over
                    </button>
                  </div>
                </div>

                <ProblemsEditor
                  initialItems={parseResult.items}
                  onFinalize={(items) => {
                    // Navigate to submissions page
                    router.push("/submissions");
                  }}
                />
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
