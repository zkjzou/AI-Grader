import { NextResponse } from "next/server";

type RubricCriterion = {
  id: string;
  description: string;
  points: number;
};

type ProblemWithRubric = {
  id: string;
  title: string;
  prompt: string;
  maxPoints: number;
  rubric: RubricCriterion[];
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const projectName = form.get("projectName");
    const problemFiles = form.getAll("problems");
    const rubricFiles = form.getAll("rubrics");

    // Simulate parsing time
    await sleep(1200);

    const problemNames = problemFiles
      .filter((f): f is File => f instanceof File)
      .map((f) => f.name);
    const rubricNames = rubricFiles
      .filter((f): f is File => f instanceof File)
      .map((f) => f.name);

    const items: ProblemWithRubric[] = [
      {
        id: "p1",
        title: "Problem 1: Derivatives",
        prompt:
          "Compute the derivative of f(x) = 3x^2 + 2x - 5. Show all steps.",
        maxPoints: 10,
        rubric: [
          { id: "p1c1", description: "Correct differentiation rules applied", points: 4 },
          { id: "p1c2", description: "Algebraic simplification is correct", points: 3 },
          { id: "p1c3", description: "Final derivative is correct", points: 3 },
        ],
      },
      {
        id: "p2",
        title: "Problem 2: Concept Explanation",
        prompt:
          "Explain the difference between supervised and unsupervised learning with examples.",
        maxPoints: 15,
        rubric: [
          { id: "p2c1", description: "Defines supervised learning clearly", points: 5 },
          { id: "p2c2", description: "Defines unsupervised learning clearly", points: 5 },
          { id: "p2c3", description: "Provides relevant examples for both", points: 5 },
        ],
      },
    ];

    return NextResponse.json({
      // Echo back filenames to show the API received them (useful for debugging)
      received: {
        problems: problemNames,
        rubrics: rubricNames,
      },
      projectName: projectName || null,
      items,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to parse uploads" },
      { status: 500 }
    );
  }
}


