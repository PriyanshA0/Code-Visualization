export type SnippetLanguage = "javascript" | "python" | "java" | "cpp";

export interface LocalSnippet {
  _id: string;
  userId: string;
  title: string;
  code: string;
  language: SnippetLanguage;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

const store = new Map<string, LocalSnippet>();

export function listSnippets(userId: string) {
  return Array.from(store.values())
    .filter((snippet) => snippet.userId === userId)
    .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
}

export function createSnippet(
  userId: string,
  payload: {
    title: string;
    code: string;
    language: SnippetLanguage;
    description?: string;
    isPublic?: boolean;
  }
) {
  const now = new Date().toISOString();
  const snippet: LocalSnippet = {
    _id: crypto.randomUUID(),
    userId,
    title: payload.title,
    code: payload.code,
    language: payload.language,
    description: payload.description ?? "",
    isPublic: Boolean(payload.isPublic),
    createdAt: now,
    updatedAt: now,
  };

  store.set(snippet._id, snippet);
  return snippet;
}

export function getSnippet(id: string) {
  return store.get(id) ?? null;
}

export function deleteSnippet(id: string) {
  return store.delete(id);
}
