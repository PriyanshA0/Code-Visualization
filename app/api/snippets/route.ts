import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDB } from "@/lib/mongodb";
import CodeSnippet from "@/lib/models/CodeSnippet";
import { createSnippet, listSnippets } from "@/lib/snippetStore";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateSnippetSchema = z.object({
  title: z.string().min(1).max(255),
  code: z.string().min(1),
  language: z.enum(["javascript", "python", "java", "cpp"]),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
});

export async function GET() {
  try {
    const [{ userId }, connection] = await Promise.all([auth(), connectToDB()]);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

export async function POST(request: Request) {
  try {
    const [{ userId }, body, connection] = await Promise.all([
      auth(),
      request.json(),
      connectToDB(),
    ]);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validatedData = CreateSnippetSchema.parse(body);

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
