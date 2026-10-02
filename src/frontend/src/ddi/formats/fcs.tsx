import type { Point } from "../geometry";
import { StrokeBox } from "../primitives/StrokeBox";
import { StrokeLine } from "../primitives/StrokeLine";
import { StrokeSymbol } from "../primitives/StrokeSymbol";
import { StrokeText } from "../primitives/StrokeText";

// FCS.lua [pgA §4]. All positions are DCS DI.

const CELL_WIDTH = 32;
const TOP_CELL_HEIGHT = 48;
const BOTTOM_CELL_HEIGHT = 40;
/** The left top table's channel 1 column and its first row. The right table mirrors it about x = 0. */
const TOP_TABLE: Point = [-300, 440];
/** The bottom table's first row: 8 top rows below the top tables. */
const BOTTOM_TABLE_Y = TOP_TABLE[1] - 8 * TOP_CELL_HEIGHT;
const BOTTOM_LABEL_X = 88;
const BOTTOM_ROW_COUNT = 11;
const TOP_ROW_COUNT = 7;
const CHANNELS = [1, 2, 3, 4] as const;

export type FcsChannel = (typeof CHANNELS)[number];
export type FcsTable = "left" | "right" | "bottom";

/**
 * Which top-table cells exist, by row and channel. Rows 0, 3 and 4 (LEF, AIL, RUD) have two channels: 1 and 4 on the
 * left, 2 and 3 on the right. The right table is not a mirror of the left; the DCS screenshot agrees.
 */
const TOP_CELLS: Readonly<Record<"left" | "right", readonly number[][]>> = {
  left: [
    [1, 0, 0, 1],
    [1, 1, 1, 1],
    [1, 1, 1, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 1, 1, 1],
    [1, 1, 1, 1],
  ],
  right: [
    [0, 1, 1, 0],
    [1, 1, 1, 1],
    [1, 1, 1, 1],
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [1, 1, 1, 1],
    [1, 1, 1, 1],
  ],
};

/** SV1/SV2 rows of each top table. */
const SERVO_ROWS = [
  { label: "SV1", row: 1 },
  { label: "SV2", row: 2 },
  { label: "SV1", row: 5 },
  { label: "SV2", row: 6 },
] as const;

/** The surface block's row heights, in top-table rows: LEF, TEF, AIL, RUD, STAB. */
const SURFACE_ROWS = [0, 1.5, 3, 4, 5.5] as const;
/** The four rules across the surface block, in top-table rows below the first row's top edge. */
const SURFACE_RULE_ROWS = [0, 2, 3, 4] as const;
const SURFACE_RULE_LENGTH = 315;
const SURFACE_VALUE_X = { left: -86, right: 152 } as const;
const VERTICAL_ARROW_X = { left: -153, right: 82 } as const;
const HORIZONTAL_ARROW_X = { left: -158, right: 82 } as const;
/** `076-arrow-up` rotations, counter-clockwise from up. */
const ARROW_ROTATION: Readonly<Record<FcsArrowDirection, number>> = {
  up: 0,
  down: 180,
  left: 90,
  right: -90,
};

/** The right tables' channel 4 column. */
const RIGHT_TABLE_X = -TOP_TABLE[0];
/** The bottom table's rules run leftward from the left edge of its channel 1 column. */
const BOTTOM_RULE_X = RIGHT_TABLE_X - 4 * CELL_WIDTH + CELL_WIDTH / 2;
const BOTTOM_RULE_LONG = 110;
const BOTTOM_RULE_SHORT = 30;

const G_LIMIT_Y = 15;
const AOA_Y = -415;

export type FcsArrowDirection = "up" | "down" | "left" | "right";

export interface FcsSurfaceSideProps {
  value: string;
  arrow: FcsArrowDirection | null;
}

export interface FcsFormatProps {
  /** LEF, TEF, AIL, RUD and STAB, in that order. */
  surfaces: readonly {
    label: string;
    left: FcsSurfaceSideProps;
    right: FcsSurfaceSideProps;
  }[];
  /** The bottom table's 11 row labels. */
  statusRows: readonly { label: string }[];
  failures: readonly { table: FcsTable; row: number; channel: FcsChannel }[];
  gLimit: string;
  aoa: { left: string; right: string };
  blinCode: string;
}

export class FcsCellError extends Error {
  constructor(table: FcsTable, row: number, channel: FcsChannel) {
    super(`FCS ${table} table has no cell at row ${row}, channel ${channel}`);
    this.name = "FcsCellError";
  }
}

/** Whether a channel table has a cell at `row` and `channel`. */
export function fcsCellExists(
  table: FcsTable,
  row: number,
  channel: FcsChannel,
): boolean {
  if (table === "bottom") {
    return Number.isInteger(row) && row >= 0 && row < BOTTOM_ROW_COUNT;
  }
  return TOP_CELLS[table][row]?.[channel - 1] === 1;
}

/** A cell's centre. Channel 1 is the left table's outer column and the right tables' inner column. */
export function fcsCellCentre(
  table: FcsTable,
  row: number,
  channel: FcsChannel,
): Point {
  if (!fcsCellExists(table, row, channel)) {
    throw new FcsCellError(table, row, channel);
  }
  const [leftX, topY] = TOP_TABLE;
  if (table === "left") {
    return [leftX + (channel - 1) * CELL_WIDTH, topY - row * TOP_CELL_HEIGHT];
  }
  const x = RIGHT_TABLE_X - (4 - channel) * CELL_WIDTH;
  return table === "right"
    ? [x, topY - row * TOP_CELL_HEIGHT]
    : [x, BOTTOM_TABLE_Y - row * BOTTOM_CELL_HEIGHT];
}

function cellKey(table: FcsTable, row: number, channel: FcsChannel): string {
  return `${table}-${row}-${channel}`;
}

function ChannelTables({
  failures,
}: Pick<FcsFormatProps, "failures">): React.JSX.Element {
  const failed = new Set(
    failures.map(({ table, row, channel }) => {
      if (!fcsCellExists(table, row, channel)) {
        throw new FcsCellError(table, row, channel);
      }
      return cellKey(table, row, channel);
    }),
  );
  const cells: { table: FcsTable; row: number; channel: FcsChannel }[] = [];
  for (const table of ["left", "right"] as const) {
    for (let row = 0; row < TOP_ROW_COUNT; row++) {
      for (const channel of CHANNELS) {
        if (fcsCellExists(table, row, channel)) {
          cells.push({ table, row, channel });
        }
      }
    }
  }
  for (let row = 0; row < BOTTOM_ROW_COUNT; row++) {
    for (const channel of CHANNELS) {
      cells.push({ table: "bottom", row, channel });
    }
  }
  return (
    <>
      {cells.map(({ table, row, channel }) => {
        const centre = fcsCellCentre(table, row, channel);
        const key = cellKey(table, row, channel);
        return (
          <g key={key}>
            <StrokeBox
              w={CELL_WIDTH}
              h={table === "bottom" ? BOTTOM_CELL_HEIGHT : TOP_CELL_HEIGHT}
              pos={centre}
            />
            {failed.has(key) && <StrokeSymbol id="151-cross" pos={centre} />}
          </g>
        );
      })}
    </>
  );
}

function TableLabels({
  statusRows,
}: Pick<FcsFormatProps, "statusRows">): React.JSX.Element {
  const [leftX, topY] = TOP_TABLE;
  const columnLabelY = topY - TOP_ROW_COUNT * TOP_CELL_HEIGHT;
  return (
    <>
      {(["left", "right"] as const).flatMap((table) =>
        CHANNELS.map((channel) => (
          <StrokeText
            key={`${table}-${channel}`}
            text={String(channel)}
            font="F120"
            align="CenterCenter"
            pos={[
              table === "left"
                ? leftX + (channel - 1) * CELL_WIDTH
                : RIGHT_TABLE_X - (4 - channel) * CELL_WIDTH,
              columnLabelY,
            ]}
          />
        )),
      )}
      {SERVO_ROWS.flatMap(({ label, row }) => [
        <StrokeText
          key={`left-${row}`}
          text={label}
          font="F120_FCS"
          align="RightCenter"
          pos={[leftX - CELL_WIDTH, topY - row * TOP_CELL_HEIGHT]}
        />,
        <StrokeText
          key={`right-${row}`}
          text={label}
          font="F120_FCS"
          align="LeftCenter"
          pos={[RIGHT_TABLE_X + CELL_WIDTH, topY - row * TOP_CELL_HEIGHT]}
        />,
      ])}
      {statusRows.map(({ label }, row) => (
        <StrokeText
          key={`status-${row}`}
          text={label}
          font="F120"
          align="LeftCenter"
          pos={[BOTTOM_LABEL_X, BOTTOM_TABLE_Y - row * BOTTOM_CELL_HEIGHT]}
        />
      ))}
    </>
  );
}

/** One long rule above the bottom table, four short ones under the CAS sub-rows, then seven long ones. */
function BottomRules(): React.JSX.Element {
  const topY = BOTTOM_TABLE_Y + BOTTOM_CELL_HEIGHT / 2;
  const lengths = [
    BOTTOM_RULE_LONG,
    ...Array<number>(4).fill(BOTTOM_RULE_SHORT),
    ...Array<number>(7).fill(BOTTOM_RULE_LONG),
  ];
  return (
    <>
      {lengths.map((length, index) => (
        <StrokeLine
          key={index}
          len={length}
          pos={[BOTTOM_RULE_X, topY - index * BOTTOM_CELL_HEIGHT]}
          rot={90}
        />
      ))}
    </>
  );
}

function SurfaceBlock({
  surfaces,
}: Pick<FcsFormatProps, "surfaces">): React.JSX.Element {
  const topY = TOP_TABLE[1];
  const ruleTop = topY - TOP_CELL_HEIGHT / 2;
  return (
    <>
      {SURFACE_RULE_ROWS.map((rows) => (
        <StrokeLine
          key={rows}
          len={SURFACE_RULE_LENGTH}
          pos={[SURFACE_RULE_LENGTH / 2, ruleTop - rows * TOP_CELL_HEIGHT]}
          rot={90}
        />
      ))}
      {surfaces.map((surface, index) => {
        const y = topY - SURFACE_ROWS[index] * TOP_CELL_HEIGHT;
        return (
          <g key={surface.label}>
            <StrokeText
              text={surface.label}
              font="F120_FCS"
              align="CenterCenter"
              pos={[0, y]}
            />
            {(["left", "right"] as const).map((side) => {
              const { value, arrow } = surface[side];
              const arrowX =
                arrow === "left" || arrow === "right"
                  ? HORIZONTAL_ARROW_X[side]
                  : VERTICAL_ARROW_X[side];
              return (
                <g key={side}>
                  <StrokeText
                    text={value}
                    font="F120_FCS"
                    align="RightCenter"
                    pos={[SURFACE_VALUE_X[side], y]}
                  />
                  {arrow !== null && (
                    <StrokeSymbol
                      id="076-arrow-up"
                      pos={[arrowX, y]}
                      rot={ARROW_ROTATION[arrow]}
                    />
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </>
  );
}

/** The FCS format: channel tables, the surface block, G-LIM, the BLIN code slot and the AOA row. */
export function FcsFormat({
  surfaces,
  statusRows,
  failures,
  gLimit,
  aoa,
  blinCode,
}: FcsFormatProps): React.JSX.Element {
  return (
    <>
      <ChannelTables failures={failures} />
      <TableLabels statusRows={statusRows} />
      <BottomRules />
      <SurfaceBlock surfaces={surfaces} />
      <StrokeText
        text="G-LIM    G"
        font="F200"
        align="LeftCenter"
        pos={[-422, G_LIMIT_Y]}
      />
      <StrokeText
        text={gLimit}
        font="F200"
        align="LeftCenter"
        pos={[-206, G_LIMIT_Y]}
      />
      {blinCode !== "" && (
        <StrokeText
          text={blinCode}
          font="F120"
          align="LeftCenter"
          pos={[-345, -190]}
        />
      )}
      <StrokeBox w={194} h={35} pos={[-3, AOA_Y]} />
      <StrokeText
        text="AOA"
        font="F120"
        align="LeftCenter"
        pos={[-83, AOA_Y]}
      />
      <StrokeText
        text="-99.9"
        font="F120"
        align="RightCenter"
        pos={[83, AOA_Y]}
      />
      <StrokeText text="L" font="F120" align="LeftCenter" pos={[-300, AOA_Y]} />
      <StrokeText
        text={aoa.left}
        font="F120"
        align="RightCenter"
        pos={[-196, AOA_Y]}
      />
      <StrokeText text="R" font="F120" align="LeftCenter" pos={[180, AOA_Y]} />
      <StrokeText
        text={aoa.right}
        font="F120"
        align="RightCenter"
        pos={[284, AOA_Y]}
      />
    </>
  );
}
