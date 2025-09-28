import { NextResponse } from "next/server";

type MatchSpan = {
  id: string;
  page: number;
  // Normalized [0-1] coordinates relative to page container
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
};

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const projectName = form.get("projectName");
    const rubricJson = form.get("rubric");
    const submissions = form.getAll("submissions");
    const rubric = rubricJson ? JSON.parse(String(rubricJson)) : [];

    // Simulate extraction delay
    await new Promise((r) => setTimeout(r, 800));

    // Produce a tiny set of fake spans for page 1 for demo purposes
    const spans: MatchSpan[] = [
      { id: "a1", page: 1, x: 0.12, y: 0.18, width: 0.32, height: 0.10, text: "Answer for Problem 1" },
      { id: "a2", page: 1, x: 0.14, y: 0.38, width: 0.40, height: 0.12, text: "Work for Problem 2" },
      { id: "a3", page: 1, x: 0.10, y: 0.60, width: 0.36, height: 0.10, text: "Notes / calculations" },
    ];

    // Map first two rubric problems to first two spans as an initial guess
    const initialMapping = (rubric as any[]).slice(0, spans.length).map((p, i) => ({
      problemId: p.id,
      spanId: spans[i].id,
    }));

    const response = {
      projectName: projectName || null,
      perSubmission: submissions
        .filter((f): f is File => f instanceof File)
        .map((f, idx) => ({
          submissionIndex: idx,
          filename: f.name,
          pages: [
            {
              page: 1,
              spans,
            },
          ],
          initialMapping,
        })),
    };

    return NextResponse.json(response);
  } catch (e) {
    return NextResponse.json({ error: "Failed to match" }, { status: 500 });
  }
}


