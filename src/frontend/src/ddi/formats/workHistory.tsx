import type { FontId } from "../constants";
import { wrapText } from "../font/wrap";
import { pbAnchor, type Point } from "../geometry";
import { StrokeBox } from "../primitives/StrokeBox";
import { StrokeLine } from "../primitives/StrokeLine";
import { StrokeSymbol } from "../primitives/StrokeSymbol";
import { StrokeText } from "../primitives/StrokeText";

/**
 * (ours) The work history layout, built from DCS ingredients (docs/pages/work.md). No DCS page holds a work history,
 * so this follows the conventions of HSI DATA WYPT [pgB §9], TGT DATA GROUP [pgB §11] and BIT [pgB §3].
 */
export const WORK_HISTORY = {
  /** Text and rules span x = ±400, the width of the TGT DATA frame box. */
  half: 400,
  /** The employer name: 150 %, centred under the tab row. */
  header: { y: 410, font: "F150" as FontId },
  /** Location (left) and span (right), 120 %. */
  subline: { y: 360, font: "F120" as FontId },
  /**
   * Full-width rules, as under the MUMI title and above the HSI DATA WYPT TOT line: one under the subline, and one
   * `gap` below the last role, so the highlights follow the list.
   */
  rules: { topY: 335, gap: 41 },
  /** The role list: TGT DATA GROUP's 46 DI row pitch leaves room for a selection box between rows. */
  roles: {
    firstY: 295,
    pitch: 46,
    max: 4,
    font: "F120" as FontId,
    spanX: -380,
    titleX: -160,
    /** Around the selected role, as UFC BU's 480 × 50 box marks its channel. 36 high, like a boxed legend. */
    box: { width: 790, height: 36 },
  },
  /** The selected role's highlights in the BIT list grid: 37 DI pitch, `-` marker, hanging indent. */
  bullets: {
    /** The first row sits this far below the lower rule. */
    gap: 40,
    pitch: 37,
    /** The lowest row's centre: its text clears the bottom legends (y ≥ −476) by 58 DI. */
    lowestY: -406,
    font: "F120" as FontId,
    markerX: -400,
    textX: -370,
  },
  /** The role stepper: `124-arrow` up and down on PB12 and PB13, the number between at (505, 60), 100 % [pgB §9]. */
  stepper: {
    up: 12 as const,
    down: 13 as const,
    number: { pos: [505, 60] as Point, font: "F100" as FontId },
  },
} as const;

/** Characters per highlight line: from the text indent to x = +400 at 120 % (20 DI advance, last glyph 14). */
export const WORK_BULLET_CHARS = Math.floor(
  (WORK_HISTORY.half - WORK_HISTORY.bullets.textX + 6) / 20,
);

export interface BulletRow {
  /** True on a highlight's first line, which carries the `-` marker. */
  first: boolean;
  text: string;
}

/** Each highlight wrapped to `WORK_BULLET_CHARS`, one row per line. */
export function bulletRows(bullets: readonly string[]): BulletRow[] {
  return bullets.flatMap((bullet) =>
    wrapText(bullet, WORK_BULLET_CHARS).map((text, index) => ({
      first: index === 0,
      text,
    })),
  );
}

export function roleRowY(index: number): number {
  return WORK_HISTORY.roles.firstY - WORK_HISTORY.roles.pitch * index;
}

/** The lower rule, `rules.gap` below the last of `roleCount` roles. */
export function lowerRuleY(roleCount: number): number {
  return roleRowY(roleCount - 1) - WORK_HISTORY.rules.gap;
}

export function bulletRowY(roleCount: number, index: number): number {
  const { gap, pitch } = WORK_HISTORY.bullets;
  return lowerRuleY(roleCount) - gap - pitch * index;
}

/** How many highlight rows fit under a list of `roleCount` roles: 14 under the longest list. */
export function bulletCapacity(roleCount: number): number {
  const { lowestY, pitch } = WORK_HISTORY.bullets;
  return Math.floor((bulletRowY(roleCount, 0) - lowestY) / pitch) + 1;
}

export interface WorkHistoryProps {
  name: string;
  location: string;
  span: string;
  roles: readonly { title: string; span: string }[];
  /** The selected role's index in `roles`. */
  selected: number;
  bullets: readonly string[];
}

/** One employer with one role selected. Draw it in the symbology square. */
export function WorkHistory({
  name,
  location,
  span,
  roles,
  selected,
  bullets,
}: WorkHistoryProps): React.JSX.Element {
  const { half, header, subline, rules, roles: list } = WORK_HISTORY;
  const font = WORK_HISTORY.bullets.font;
  return (
    <>
      <StrokeText
        text={name}
        font={header.font}
        align="CenterCenter"
        pos={[0, header.y]}
      />
      <StrokeText
        text={location}
        font={subline.font}
        align="LeftCenter"
        pos={[-half, subline.y]}
      />
      <StrokeText
        text={span}
        font={subline.font}
        align="RightCenter"
        pos={[half, subline.y]}
      />
      {[rules.topY, lowerRuleY(roles.length)].map((y) => (
        <StrokeLine key={y} len={2 * half} pos={[-half, y]} rot={-90} />
      ))}
      {roles.map((role, index) => (
        <g key={`${index}-${role.title}`}>
          <StrokeText
            text={role.span}
            font={list.font}
            align="LeftCenter"
            pos={[list.spanX, roleRowY(index)]}
          />
          <StrokeText
            text={role.title}
            font={list.font}
            align="LeftCenter"
            pos={[list.titleX, roleRowY(index)]}
          />
        </g>
      ))}
      <StrokeBox
        w={list.box.width}
        h={list.box.height}
        pos={[0, roleRowY(selected)]}
      />
      {bulletRows(bullets).map((row, index) => (
        <g key={`${index}-${row.text}`}>
          {row.first && (
            <StrokeText
              text="-"
              font={font}
              align="LeftCenter"
              pos={[
                WORK_HISTORY.bullets.markerX,
                bulletRowY(roles.length, index),
              ]}
            />
          )}
          <StrokeText
            text={row.text}
            font={font}
            align="LeftCenter"
            pos={[WORK_HISTORY.bullets.textX, bulletRowY(roles.length, index)]}
          />
        </g>
      ))}
    </>
  );
}

/**
 * The role stepper's edge content: the up and down arrows at their PBs and the role number between them, as HSI DATA
 * WYPT steps waypoints [pgB §9]. Draw it in the right edge strip.
 */
export function WorkRoleStepper({
  number,
}: {
  number: number;
}): React.JSX.Element {
  const { up, down, number: label } = WORK_HISTORY.stepper;
  return (
    <>
      <StrokeSymbol id="124-arrow-up" pos={pbAnchor(up)} />
      <StrokeSymbol id="124-arrow-up" pos={pbAnchor(down)} rot={180} />
      <StrokeText
        text={String(number)}
        font={label.font}
        align="RightCenter"
        pos={label.pos}
      />
    </>
  );
}
