"""What the DDI can draw: the stroke font's glyph set and the fixed-pitch word wrap (docs/design.md section 7).

These mirror `src/frontend/src/ddi/font/` so the admin cannot save text that fails to render.
"""

from dataclasses import dataclass
from typing import Final

from pydantic import AfterValidator

# The DCS stroke font (`ddi/generated/strokeFont.ts`) plus our `@` (`ddi/font/extraGlyphs.ts`). A space draws nothing.
# Text is upper-cased before drawing, so lower case is fine on input.
_GLYPHS: Final[frozenset[str]] = frozenset("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-+'()*%,°./\\?:#=_^@ ")


def check_glyphs(text: str) -> str:
    upper = text.upper()
    if len(upper) != len(text):
        raise ValueError("upper-casing changes the text's length; the DDI draws upper case only")
    if missing := sorted({character for character in upper if character not in _GLYPHS}):
        raise ValueError(f"the DDI font has no glyph for {''.join(missing)!r}")
    return text


GLYPHS: Final[AfterValidator] = AfterValidator(check_glyphs)


class WordTooLongError(ValueError):
    def __init__(self, word: str, max_chars: int) -> None:
        super().__init__(f"{word!r} is longer than {max_chars} characters, so it cannot wrap")


def wrap_text(text: str, max_chars: int) -> list[str]:
    """Greedy word wrap for the fixed-pitch font, as `wrapText` in `ddi/font/wrap.ts`."""
    lines: list[str] = []
    line = ""
    for word in text.split():
        if len(word) > max_chars:
            raise WordTooLongError(word, max_chars)
        if not line:
            line = word
        elif len(line) + 1 + len(word) <= max_chars:
            line = f"{line} {word}"
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


@dataclass(frozen=True, slots=True)
class FitsRows:
    """A Pydantic validator: `text` word-wraps to at most `rows` rows of `chars` characters."""

    chars: int
    rows: int

    def __call__(self, text: str) -> str:
        if (count := len(wrap_text(text, self.chars))) > self.rows:
            raise ValueError(f"wraps to {count} rows; the slot fits {self.rows} rows of {self.chars} characters")
        return text
