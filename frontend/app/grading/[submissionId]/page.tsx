"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import logo from "../../logo.png";
import userPic from "../../user.png";
import Link from "next/link";

type Submission = {
  id: string;
  assignment_id: string;
  student_name: string;
  file_path: string;
  graded_content: any | null;
};

type Assignment = {
  id: string;
  name: string;
  file_path: string;
  rubric: any;
  problem_structure: any;
};

type GradingItem = {
  item: number;
  score: number | null;
  total_possible_score: number;
  explanation: string;
  confidence: number;
};

type GradingProblem = {
  id: number;
  name: string;
  items: GradingItem[];
  score: number | null;
  total_score: number;
  explanation: string;
  confidence: number;
};

type Problem = {
  id: string;
  title: string;
  prompt: string;
  maxPoints: number;
  rubric: Array<{
    id: string;
    description: string;
    points: number;
  }>;
  grading?: GradingProblem;
};

function PDFViewer({ filePath }: { filePath: string }) {
  // Convert file path to URL format with parameters to hide sidebar and toolbar
  const baseUrl = `http://localhost:8000/uploads/${filePath.split('/').pop()}`;
  const pdfUrl = `${baseUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`;
  
  return (
    <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative">
      <iframe
        src={pdfUrl}
        className="w-full h-full border-0"
        title="Student Submission PDF"
        onError={() => {
          console.error("Failed to load PDF in iframe");
        }}
      />
      <div className="absolute top-4 right-4">
        <a
          href={baseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-3 py-2 bg-white/90 text-black rounded hover:bg-white transition-colors shadow-sm"
        >
          Open in New Tab
        </a>
      </div>
    </div>
  );
}

function RubricGradingInterface({
  problem,
}: {
  problem: Problem;
}) {
  const grading = problem.grading;
  
  if (!grading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-black/10 dark:border-white/15 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{problem.title}</h3>
          <div className="text-sm font-medium text-gray-500">
            No grading data available
          </div>
        </div>
        <p className="text-sm text-black/70 dark:text-white/70 mb-4">{problem.prompt}</p>
        <div className="text-center py-8 text-gray-500">
          <p>Grading in progress...</p>
        </div>
      </div>
    );
  }

  const scoreDisplay = grading.score !== null ? grading.score : "N/A";
  const confidencePercentage = Math.round(grading.confidence * 100);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-black/10 dark:border-white/15 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{grading.name}</h3>
        <div className="text-right">
          <div className="text-sm font-medium text-[#0fe3c2]">
            Score: {scoreDisplay}/{grading.total_score}
          </div>
          <div className="text-xs text-gray-500">
            Confidence: {confidencePercentage}%
          </div>
        </div>
      </div>
      
      <p className="text-sm text-black/70 dark:text-white/70 mb-4">{problem.prompt}</p>
      
      {/* Overall Problem Explanation */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="text-sm font-medium mb-2">Overall Assessment</h4>
        <p className="text-sm text-black/70 dark:text-white/70">{grading.explanation}</p>
      </div>
      
      {/* Individual Item Scores */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Detailed Scoring</h4>
        {grading.items.map((item, index) => (
          <div key={item.item} className="border border-black/10 dark:border-white/15 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h5 className="text-sm font-medium">Item {item.item}</h5>
              <div className="text-right">
                <div className="text-sm font-medium text-[#0fe3c2]">
                  {item.score !== null ? item.score : "N/A"}/{item.total_possible_score}
                </div>
                <div className="text-xs text-gray-500">
                  {Math.round(item.confidence * 100)}% confidence
                </div>
              </div>
            </div>
            
            <div className="mt-2">
              <p className="text-sm text-black/70 dark:text-white/70">{item.explanation}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GradingDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const submissionId = params.submissionId as string;
  
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load submission and assignment data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load submission
        const submissionResponse = await fetch(`http://localhost:8000/submissions/${submissionId}`);
        if (!submissionResponse.ok) {
          throw new Error("Failed to load submission");
        }
        const submissionData = await submissionResponse.json();
        setSubmission(submissionData);
        
        // Load assignment
        const assignmentResponse = await fetch(`http://localhost:8000/assignments/${submissionData.assignment_id}`);
        if (!assignmentResponse.ok) {
          throw new Error("Failed to load assignment");
        }
        const assignmentData = await assignmentResponse.json();
        setAssignment(assignmentData);
        
        // Convert assignment rubric to problems format and add grading data
        if (assignmentData.rubric && Array.isArray(assignmentData.rubric)) {
          const convertedProblems = assignmentData.rubric.map((problem: any, index: number) => {
            // Check if we have grading data for this problem
            let gradingData = null;
            if (submissionData.graded_content && Array.isArray(submissionData.graded_content)) {
              gradingData = submissionData.graded_content.find((g: any) => g.id === problem.id);
            }
            
            return {
              id: problem.id || `problem-${index}`,
              title: problem.name || `Problem ${index + 1}`,
              prompt: problem.description || "",
              maxPoints: problem.total || 0,
              rubric: problem.items?.map((item: any, itemIndex: number) => ({
                id: item.id || `item-${index}-${itemIndex}`,
                description: item.description || "",
                points: item.points || 0,
              })) || [],
              grading: gradingData,
            };
          });
          setProblems(convertedProblems);
        }
        
      } catch (error) {
        console.error("Error loading data:", error);
        alert("Failed to load submission details");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (submissionId) {
      loadData();
    }
  }, [submissionId]);

  const handleSaveGrading = async () => {
    try {
      // Here you would typically save any manual adjustments to the backend
      console.log("Saving grading adjustments...");
      alert("Grading adjustments saved successfully!");
    } catch (error) {
      console.error("Error saving grading:", error);
      alert("Failed to save grading");
    }
  };

  if (isLoading) {
    return (
      <div className="font-sans min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-black/70 dark:text-white/70">
          <svg
            className="animate-spin h-5 w-5 text-[#0fe3c2]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <span>Loading submission details...</span>
        </div>
      </div>
    );
  }

  if (!submission || !assignment) {
    return (
      <div className="font-sans min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Submission not found</h2>
          <p className="text-black/60 dark:text-white/60 mb-4">The requested submission could not be found.</p>
          <Link href="/submissions" className="text-[#0fe3c2] hover:underline">
            Back to Submissions
          </Link>
        </div>
      </div>
    );
  }

  const totalScore = problems.reduce((sum, problem) => {
    if (problem.grading && problem.grading.score !== null) {
      return sum + problem.grading.score;
    }
    return sum;
  }, 0);

  const maxTotalScore = problems.reduce((sum, problem) => {
    if (problem.grading) {
      return sum + problem.grading.total_score;
    }
    return sum + problem.maxPoints;
  }, 0);

  return (
    <div className="font-sans min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center gap-6">
          <Link href="/">
            <Image src={logo} alt="logo" width={200} height={200} className="cursor-pointer" />
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/start" className="text-sm font-medium text-black/60 dark:text-white/60 hover:text-[#0fe3c2]">
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
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold">Grading {submission.student_name}</h1>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#0fe3c2]">
                  {totalScore}/{maxTotalScore}
                </div>
                <div className="text-sm text-black/60 dark:text-white/60">Total Score</div>
              </div>
            </div>
            <p className="text-black/60 dark:text-white/60">
              {assignment.name} • Submission {submission.id}
            </p>
          </div>

          {/* Main Content - Side by Side Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
            {/* Left Side - PDF Viewer */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-black/10 dark:border-white/15 p-4">
              <h2 className="text-lg font-semibold mb-4">Student Submission</h2>
              <div className="h-[calc(100%-3rem)]">
                <PDFViewer filePath={submission.file_path} />
              </div>
            </div>

            {/* Right Side - Rubric and Grading */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-black/10 dark:border-white/15 p-4 overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">Grading Rubric</h2>
              <div className="space-y-6">
                {problems.map((problem) => (
                  <RubricGradingInterface
                    key={problem.id}
                    problem={problem}
                  />
                ))}
              </div>
              
              {/* Save Button */}
              {/* <div className="mt-6 pt-4 border-t border-black/10 dark:border-white/15">
                <button
                  onClick={handleSaveGrading}
                  className="w-full bg-[#0fe3c2] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#a8ffe9] transition-colors"
                >
                  Save Grading
                </button>
              </div> */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
