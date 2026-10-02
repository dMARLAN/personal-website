export class WordTooLongError extends Error {
  constructor(word: string, maxChars: number) {
    super(`${JSON.stringify(word)} is longer than ${maxChars} characters`);
    this.name = "WordTooLongError";
  }
}

/**
 * Greedy word wrap for the fixed-pitch stroke font: every character advances the same width, so a line's width
 * follows from its length. Throws on a word that cannot fit a line, so content that overflows fails the build.
 */
export function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (word.length > maxChars) {
      throw new WordTooLongError(word, maxChars);
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
