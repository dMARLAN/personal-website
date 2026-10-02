/**
 * Greedy word wrap to at most `maxChars` characters per line. Whitespace runs collapse to one space. Throws on a word
 * longer than a line: the glass has no hyphenation, so content must be fixed instead.
 */
export function wrapWords(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.trim().split(/\s+/)) {
    if (word.length > maxChars) {
      throw new Error(`"${word}" is longer than a ${maxChars}-character line`);
    }
    if (line === "") {
      line = word;
    } else if (line.length + 1 + word.length <= maxChars) {
      line = `${line} ${word}`;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line !== "") {
    lines.push(line);
  }
  return lines;
}
