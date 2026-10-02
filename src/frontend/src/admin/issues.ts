import type { ValidationIssue } from "./api";

/** A field's place in a section document, as the API's 422 `loc` names it after `body`. */
export type FieldPath = readonly (string | number)[];

function documentPath(issue: ValidationIssue): FieldPath {
  return issue.loc[0] === "body" ? issue.loc.slice(1) : issue.loc;
}

/** "status 3 value", one-based, for people. */
export function describePath(path: FieldPath): string {
  if (path.length === 0) {
    return "The document";
  }
  return path
    .map((part) => (typeof part === "number" ? String(part + 1) : part))
    .join(" › ");
}

export function describeIssue(issue: ValidationIssue): string {
  return `${describePath(documentPath(issue))}: ${issue.msg}`;
}

/** The messages for exactly this field. */
export function issuesAt(
  issues: readonly ValidationIssue[],
  path: FieldPath,
): string[] {
  return issues
    .filter((issue) => {
      const at = documentPath(issue);
      return (
        at.length === path.length && at.every((part, i) => part === path[i])
      );
    })
    .map((issue) => issue.msg);
}
