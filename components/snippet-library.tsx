"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

type SnippetLanguage = "javascript" | "python" | "java" | "cpp";

interface Snippet {
  _id: string;
  title: string;
  code: string;
  language: SnippetLanguage;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SnippetLibraryProps {
  code: string;
  language: SnippetLanguage;
  onLoadSnippet: (snippet: Snippet) => void;
}

export function SnippetLibrary({ code, language, onLoadSnippet }: SnippetLibraryProps) {
  const { isLoaded, userId } = useAuth();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [title, setTitle] = useState("Untitled Snippet");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    const loadSnippets = async () => {
      if (!isOpen || hasLoadedOnce || !isLoaded) {
        return;
      }

      if (!userId) {
        setSnippets([]);
        setHasLoadedOnce(true);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/snippets", {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to load snippets");
        }

        const data = (await response.json()) as Snippet[];
        setSnippets(data);
        setHasLoadedOnce(true);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load snippets");
      } finally {
        setIsLoading(false);
      }
    };

    loadSnippets();
  }, [isLoaded, userId, isOpen, hasLoadedOnce]);

  const handleSave = async () => {
    if (!userId) {
      setError("Sign in to save snippets.");
      return;
    }

    if (!code.trim()) {
      setError("Write some code before saving a snippet.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/snippets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          code,
          language,
          description,
          isPublic,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to save snippet");
      }

      setSnippets((current) => [payload, ...current.filter((snippet) => snippet._id !== payload._id)]);
      setHasLoadedOnce(true);
      setIsOpen(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save snippet");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!userId) {
      setError("Sign in to delete snippets.");
      return;
    }

    try {
      const response = await fetch(`/api/snippets/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Failed to delete snippet");
      }

      setSnippets((current) => current.filter((snippet) => snippet._id !== id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete snippet");
    }
  };

  return (
    <section className="rounded-[24px] border border-white/8 bg-[#141a2a] p-4 shadow-[0_16px_60px_rgba(0,0,0,0.3)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Saved Snippets</p>
          <h2 className="mt-1 text-lg font-semibold text-white">MongoDB workspace</h2>
        </div>
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
        >
          {isOpen ? "Hide" : "Show"}
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Snippet title"
          className="w-full rounded-xl border border-white/8 bg-[#0b1020] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional description"
          rows={3}
          className="w-full rounded-xl border border-white/8 bg-[#0b1020] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
        />
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(event) => setIsPublic(event.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-[#0b1020]"
          />
          Public snippet
        </label>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}

      {!isOpen ? (
        <p className="mt-4 text-xs text-slate-400">Open snippets to load your library.</p>
      ) : (
        <div className="mt-5 border-t border-white/8 pt-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
            <span>Recent</span>
            <span>{isLoading ? "Loading..." : `${snippets.length} items`}</span>
          </div>

          <div className="mt-3 space-y-3">
            {snippets.length === 0 && !isLoading && (
              <div className="rounded-xl border border-dashed border-white/10 bg-white/5 px-3 py-4 text-sm text-slate-400">
                No saved snippets yet. Save the current editor state to populate your workspace.
              </div>
            )}

            {isLoading && <p className="text-sm text-slate-400">Loading snippets...</p>}

            {snippets.map((snippet) => (
              <article key={snippet._id} className="rounded-xl border border-white/8 bg-[#0b1020] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{snippet.title}</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      {snippet.language.toUpperCase()} · {snippet.isPublic ? "Public" : "Private"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onLoadSnippet(snippet)}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:bg-white/10"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleDelete(snippet._id)}
                      className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-200 transition hover:bg-rose-500/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {snippet.description && <p className="mt-2 text-xs leading-5 text-slate-400">{snippet.description}</p>}
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
