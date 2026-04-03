import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import CodeSnippet from "@/lib/models/CodeSnippet";
import { createSnippet, listSnippets } from "@/lib/snippetStore";
import { z } from "zod";

const CreateSnippetSchema = z.object({
  title: z.string().min(1).max(255),
  code: z.string().min(1),
  language: z.enum(["javascript", "python"]),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
});

function getUserId(request: NextRequest) {
  return request.headers.get("x-user-id") || "local-dev-user";
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const connection = await connectToDB();

    if (!connection) {
      return NextResponse.json(listSnippets(userId));
    }

    const snippets = await CodeSnippet.find({ userId }).sort({ createdAt: -1 });

    return NextResponse.json(snippets);
  } catch (error) {
    console.error("Error fetching snippets:", error);
    return NextResponse.json(
      { error: "Failed to fetch snippets" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);

    const body = await request.json();
    const validatedData = CreateSnippetSchema.parse(body);

    const connection = await connectToDB();

    if (!connection) {
      return NextResponse.json(createSnippet(userId, validatedData), {
        status: 201,
      });
    }

    const snippet = new CodeSnippet({
      userId,
      ...validatedData,
    });

    await snippet.save();

    return NextResponse.json(snippet, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Error creating snippet:", error);
    return NextResponse.json(
      { error: "Failed to create snippet" },
      { status: 500 }
    );
  }
}
