"use client";

import { useCallback, useEffect, useState } from "react";
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

type Assignment = {
  id: string;
  name: string;
  file_path: string;
  rubric: any;
  problem_structure: any;
  has_rubric?: boolean;
  has_problem_structure?: boolean;
};

type Submission = {
  id: string;
  assignment_id: string;
  student_name: string;
  file_path: string;
  graded_content: any | null;
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  return `${size} ${sizes[i]}`;
}

function SubmissionUploadCard({
  assignments,
  onSubmissionUpload,
  isLoading,
}: {
  assignments: Assignment[];
  onSubmissionUpload: (assignmentId: string, studentName: string, file: File) => void;
  isLoading: boolean;
}) {
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");
  const [studentName, setStudentName] = useState<string>("");
  const [submissionFile, setSubmissionFile] = useState<UploadedFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback((list: FileList | null) => {
    if (!list || list.length === 0) return;
    const file = list[0];
    setSubmissionFile({
      file,
      name: file.name,
      sizeLabel: formatBytes(file.size),
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files);
        e.dataTransfer.clearData();
      }
    },
    [handleFileSelect]
  );

  const handleSubmit = () => {
    if (!selectedAssignmentId || !submissionFile || !studentName.trim()) return;
    onSubmissionUpload(selectedAssignmentId, studentName.trim(), submissionFile.file);
  };

  console.log(assignments)

  const areaClasses = `flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 transition-colors ${
    isDragging
      ? "border-[#0fe3c2] bg-[#0fe3c2]/10"
      : "border-black/10 dark:border-white/20 hover:border-[#0fe3c2] hover:bg-[#0fe3c2]/5"
  }`;

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-gray-900 shadow-sm p-6 sm:p-8">
      <h2 className="text-xl font-semibold tracking-tight mb-1">Grade Student Submission</h2>
      <p className="text-sm text-black/60 dark:text-white/60 mb-6">
        Select an assignment and upload a student's submission for AI grading.
      </p>

      {/* Assignment Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Assignment</label>
        <select
          className="w-full text-sm bg-transparent outline-none border rounded-md border-black/10 dark:border-white/15 px-3 py-2 focus:border-[#0fe3c2]"
          value={selectedAssignmentId}
          onChange={(e) => setSelectedAssignmentId(e.target.value)}
        >
          <option value="">Choose an assignment...</option>
          {assignments.map((assignment) => (
            <option key={assignment.id} value={assignment.id}>
              {assignment.name} {assignment.has_rubric ? "✓" : "⏳"}
            </option>
          ))}
        </select>
      </div>

      {/* Student Name Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Student Name</label>
        <input
          className="w-full text-sm bg-transparent outline-none border rounded-md border-black/10 dark:border-white/15 px-3 py-2 focus:border-[#0fe3c2]"
          placeholder="Enter student name"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
        />
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Student Submission File</label>
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
            <p className="text-sm font-medium">Drag & drop submission here</p>
            <p className="text-xs text-black/60 dark:text-white/60">or click to browse</p>
          </div>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.md"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </label>

        {submissionFile && (
          <div className="mt-3 flex items-center justify-between rounded-lg border border-black/10 dark:border-white/15 px-3 py-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-2 h-2 rounded-full bg-[#0fe3c2]" />
              <p className="text-sm truncate" title={submissionFile.name}>{submissionFile.name}</p>
            </div>
            <span className="text-xs text-black/60 dark:text-white/60 shrink-0">{submissionFile.sizeLabel}</span>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          disabled={!selectedAssignmentId || !submissionFile || !studentName.trim() || isLoading}
          className={`rounded-full px-6 py-3 text-sm font-medium transition-colors ${
            selectedAssignmentId && submissionFile && studentName.trim() && !isLoading
              ? "bg-[#0fe3c2] text-white hover:bg-[#a8ffe9]"
              : "bg-black/10 dark:bg-white/10 text-black/60 dark:text-white/60 cursor-not-allowed"
          }`}
          onClick={handleSubmit}
        >
          {isLoading ? "Uploading..." : "Upload & Grade Submission"}
        </button>
      </div>
    </div>
  );
}

function SubmissionResults({
  submissions,
  onPollSubmission,
}: {
  submissions: Submission[];
  onPollSubmission: (submissionId: string) => void;
}) {
  if (submissions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-black/60 dark:text-white/60">No submissions yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Recent Submissions</h3>
      {submissions.map((submission) => (
        <div
          key={submission.id}
          className="rounded-lg border border-black/10 dark:border-white/15 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-medium">{submission.student_name}</p>
              <p className="text-sm text-black/60 dark:text-white/60">
                Submission {submission.id}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {submission.graded_content ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Graded
                  </span>
                  <Link
                    href={`/grading/${submission.id}`}
                    className="text-xs px-3 py-1 rounded-full bg-[#0fe3c2] text-white hover:bg-[#a8ffe9] transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-[#0fe3c2]"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  <span className="text-xs text-black/60 dark:text-white/60">Grading...</span>
                </div>
              )}
            </div>
          </div>
          
        </div>
      ))}
    </div>
  );
}

export default function SubmissionsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pollingIntervals, setPollingIntervals] = useState<Map<string, NodeJS.Timeout>>(new Map());

  // Load assignments and submissions on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load assignments
        const assignmentsResponse = await fetch("http://localhost:8000/assignments");
        if (!assignmentsResponse.ok) {
          throw new Error("Failed to load assignments");
        }
        const assignmentsData = await assignmentsResponse.json();
        setAssignments(assignmentsData.assignments || []);

        // Load existing submissions
        const submissionsResponse = await fetch("http://localhost:8000/submissions");
        if (submissionsResponse.ok) {
          const submissionsData = await submissionsResponse.json();
          setSubmissions(submissionsData.submissions || []);
        } else {
          console.error("Failed to load submissions from backend, trying localStorage fallback");
          // Fallback to localStorage
          const savedSubmissions = localStorage.getItem("ai-grader-submissions");
          if (savedSubmissions) {
            try {
              const parsedSubmissions = JSON.parse(savedSubmissions);
              setSubmissions(parsedSubmissions);
            } catch (e) {
              console.error("Failed to parse saved submissions:", e);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };
    loadData();
  }, []);

  const handleSubmissionUpload = useCallback(async (assignmentId: string, studentName: string, file: File) => {
    try {
      setIsLoading(true);
      
      const form = new FormData();
      form.append("assignment_id", assignmentId);
      form.append("student_name", studentName);
      form.append("file", file);
      
      const response = await fetch("http://localhost:8000/submissions", {
        method: "POST",
        body: form,
      });
      
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      
      const data = await response.json();
      console.log("Submission created:", data);
      
      // Add to submissions list
      const newSubmission: Submission = {
        id: data.submission_id,
        assignment_id: assignmentId,
        student_name: studentName,
        file_path: "", // Will be filled by polling
        graded_content: null,
      };
      
      setSubmissions(prev => {
        const updated = [newSubmission, ...prev];
        // Save to localStorage
        try {
          localStorage.setItem("ai-grader-submissions", JSON.stringify(updated));
        } catch (e) {
          console.error("Failed to save submissions to localStorage:", e);
        }
        return updated;
      });
      
      // Start polling for this submission
      startPollingSubmission(data.submission_id);
      
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload submission. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startPollingSubmission = useCallback((submissionId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8000/submissions/${submissionId}`);
        if (!response.ok) return;
        
        const data = await response.json();
        
        // Update submission in state
        setSubmissions(prev => {
          const updated = prev.map(sub => 
            sub.id === submissionId 
              ? { ...sub, ...data }
              : sub
          );
          // Save to localStorage
          try {
            localStorage.setItem("ai-grader-submissions", JSON.stringify(updated));
          } catch (e) {
            console.error("Failed to save submissions to localStorage:", e);
          }
          return updated;
        });
        
        // Stop polling if grading is complete
        if (data.graded_content) {
          clearInterval(interval);
          setPollingIntervals(prev => {
            const newMap = new Map(prev);
            newMap.delete(submissionId);
            return newMap;
          });
        }
      } catch (error) {
        console.error("Error polling submission:", error);
      }
    }, 2000);
    
    setPollingIntervals(prev => new Map(prev).set(submissionId, interval));
  }, []);

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      pollingIntervals.forEach(interval => clearInterval(interval));
    };
  }, [pollingIntervals]);

  return (
    <div className="font-sans min-h-screen">
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 shadow-sm rounded-[50px] mt-6 mx-6 mb-6">
        <div className="flex items-center gap-6">
          <Link href="/">
            <Image src={logo} alt="logo" width={200} height={200} className="cursor-pointer" />
          </Link>
<nav>
  <ul className="flex items-center gap-4">
    {/* Create Assignment */}
    <li className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
      <i className="fa-solid fa-pen text-black/60 dark:text-white/60"></i>
      <Link 
        href="/start" 
        className="text-sm font-medium text-black/60 dark:text-white/60"
      >
        Create Assignment
      </Link>
    </li>

    {/* Grade Submissions - active */}
    <li className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#0fe3c2]">
      <i className="fa-solid fa-graduation-cap text-white"></i>
      <Link 
        href="/submissions" 
        className="text-sm font-medium text-white"
      >
        Grade Submissions
      </Link>
    </li>
  </ul>
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

          <div className="space-y-8">
            <SubmissionUploadCard
              assignments={assignments}
              onSubmissionUpload={handleSubmissionUpload}
              isLoading={isLoading}
            />

            <SubmissionResults
              submissions={submissions}
              onPollSubmission={startPollingSubmission}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
