import { NextResponse } from "next/server";

type Criterion = { id: string; description: string; points: number };
type Problem = {
  id: string;
  title: string;
  prompt: string;
  maxPoints: number;
  rubric: Criterion[];
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const projectName = form.get("projectName");
    const rubricJson = form.get("rubric");
    const submissionFiles = form.getAll("submissions");

    const rubric: Problem[] = rubricJson
      ? JSON.parse(String(rubricJson))
      : [];

    // Simulate grading time
    await sleep(1400);

    // Make a simple fake result per submission: evenly distribute points
    const students = submissionFiles
      .filter((f): f is File => f instanceof File)
      .map((file, idx) => {
        const problems = rubric.map((p) => {
          const max = p.rubric.reduce((s, c) => s + (c.points || 0), 0);
          const criteria = p.rubric.map((c, cidx) => ({
            id: c.id,
            pointsAwarded: Math.max(0, Math.min(c.points, c.points - (cidx % 2))),
            maxPoints: c.points,
            comment:
              cidx % 2 === 0
                ? "Good work on this criterion."
                : "Minor inaccuracies observed; consider revisiting the steps.",
          }));
          const score = criteria.reduce((s, c) => s + c.pointsAwarded, 0);
          return {
            problemId: p.id,
            title: p.title,
            score,
            maxPoints: max,
            criteria,
            comment:
              score === max
                ? "Excellent solution. All criteria satisfied."
                : "Partially correct. Review highlighted steps and fix calculation errors.",
          };
        });
        const total = problems.reduce((s, pr) => s + pr.score, 0);
        return {
          id: `s${idx + 1}`,
          name: `Student ${idx + 1}`,
          filename: file.name,
          total,
          problems,
        };
      });

    return NextResponse.json({ projectName: projectName || null, students });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to grade submissions" },
      { status: 500 }
    );
  }
}


