/**
 * Illustrative content types for NextPress.js.
 *
 * This is a TypeScript contract only. Add runtime validation (for example, with
 * Zod) before accepting documents from clients or persisting production content.
 */

export type ContentStatus = "draft" | "published" | "scheduled" | "archived";

export type ContentBlock = {
  id: string;
  type: string;
  version: number;
  props: Record<string, unknown>;
  children?: ContentBlock[];
};

export type ContentDocument = {
  schemaVersion: number;
  blocks: ContentBlock[];
};

export type ContentSummary = {
  id: string;
  title: string;
  slug: string;
  status: ContentStatus;
  updatedAt: string;
};
