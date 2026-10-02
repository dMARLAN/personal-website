import re

import pytest

from content.text import GLYPH_PATTERN, FitsRows, WordTooLongError, check_glyphs, wrap_text


@pytest.mark.parametrize("text", ["HELLO", "lower case is fine", "A/C WT 1° NU", "me@example.com", "#=_^\\?*%()'+-,.:"])
def test_check_glyphs_accepts_drawable_text(text: str) -> None:
    assert check_glyphs(text) == text


@pytest.mark.parametrize("text", ["HI!", "x < y", "café", "tab\there", "two\nlines", "[box]"])
def test_check_glyphs_rejects_characters_the_font_lacks(text: str) -> None:
    with pytest.raises(ValueError, match="no glyph"):
        check_glyphs(text)


def test_check_glyphs_rejects_text_that_grows_when_upper_cased() -> None:
    with pytest.raises(ValueError, match="no glyph for 'ß'"):
        check_glyphs("straße")


def test_glyph_pattern_accepts_exactly_what_check_glyphs_accepts() -> None:
    # Arrange: every character up to the end of the Latin Extended blocks, and a few beyond.
    characters = [chr(code) for code in range(0x250)] + ["ı", "ſ", "K", "€", "\u2028"]
    pattern = re.compile(GLYPH_PATTERN)

    # Act
    disagreements = []
    for character in characters:
        try:
            check_glyphs(character)
            accepted = True
        except ValueError:
            accepted = False
        if accepted != bool(pattern.fullmatch(character)):
            disagreements.append(character)

    # Assert
    assert disagreements == []


def test_wrap_text_fills_lines_greedily() -> None:
    assert wrap_text("aa bb cc dd", 5) == ["aa bb", "cc dd"]


def test_wrap_text_collapses_whitespace() -> None:
    assert wrap_text("  one   two  ", 20) == ["one two"]


def test_wrap_text_rejects_a_word_longer_than_a_line() -> None:
    with pytest.raises(WordTooLongError):
        wrap_text("supercalifragilistic", 10)


def test_fits_rows_rejects_text_that_wraps_too_far() -> None:
    with pytest.raises(ValueError, match="wraps to 3 rows"):
        FitsRows(chars=5, rows=2).check("aa bb cc dd ee")


def test_fits_rows_max_length_is_the_longest_text_that_fits() -> None:
    fits = FitsRows(chars=5, rows=2)
    longest = "aaaaa bbbbb"

    assert fits.check(longest) == longest
    assert fits.max_length == len(longest)
