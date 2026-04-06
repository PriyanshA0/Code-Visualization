import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDB } from "@/lib/mongodb";
import CodeSnippet from "@/lib/models/CodeSnippet";
import { deleteSnippet, getSnippet } from "@/lib/snippetStore";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const connection = await connectToDB();

    if (!connection) {
      const snippet = getSnippet(id);

      if (!snippet) {
        return NextResponse.json(
          { error: "Snippet not found" },
          { status: 404 }
        );
      }

      if (snippet.userId !== userId && !snippet.isPublic) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      return NextResponse.json(snippet);
    }

    const snippet = await CodeSnippet.findById(id);

    if (!snippet) {
      return NextResponse.json(
        { error: "Snippet not found" },
        { status: 404 }
      );
    }

    // Check authorization (viewer must be owner or snippet must be public)
    if (snippet.userId !== userId && !snippet.isPublic) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(snippet);
  } catch (error) {
    console.error("Error fetching snippet:", error);
    return NextResponse.json(
      { error: "Failed to fetch snippet" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const connection = await connectToDB();

    if (!connection) {
      const snippet = getSnippet(id);

      if (!snippet) {
        return NextResponse.json(
          { error: "Snippet not found" },
          { status: 404 }
        );
      }

      if (snippet.userId !== userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      deleteSnippet(id);
      return NextResponse.json({ message: "Snippet deleted successfully" });
    }

    const snippet = await CodeSnippet.findById(id);

    if (!snippet) {
      return NextResponse.json(
        { error: "Snippet not found" },
        { status: 404 }
      );
    }

    if (snippet.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await CodeSnippet.findByIdAndDelete(id);

    return NextResponse.json({ message: "Snippet deleted successfully" });
  } catch (error) {
    console.error("Error deleting snippet:", error);
    return NextResponse.json(
      { error: "Failed to delete snippet" },
      { status: 500 }
    );
  }
}
