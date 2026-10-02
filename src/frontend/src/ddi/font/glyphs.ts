import { STROKE_FONT, type Stroke } from "../generated/strokeFont";
import { EXTRA_GLYPHS } from "./extraGlyphs";

const GLYPHS: ReadonlyMap<string, readonly Stroke[]> = new Map([
  ...Object.entries(STROKE_FONT),
  ...Object.entries(EXTRA_GLYPHS),
]);

/** Every character the glass can draw: the glyphs and the space, which draws nothing. Lower case draws upper-cased. */
export const DDI_GLYPHS: ReadonlySet<string> = new Set([...GLYPHS.keys(), " "]);

export class UnmappedCharacterError extends Error {
  constructor(character: string, text: string) {
    super(
      `No stroke glyph for ${JSON.stringify(character)} in ${JSON.stringify(text)}`,
    );
    this.name = "UnmappedCharacterError";
  }
}

/** The glyph for an upper-case character. Throws for a character neither DCS nor we define. */
export function glyph(character: string, text: string): readonly Stroke[] {
  const strokes = GLYPHS.get(character);
  if (strokes === undefined) {
    throw new UnmappedCharacterError(character, text);
  }
  return strokes;
}
