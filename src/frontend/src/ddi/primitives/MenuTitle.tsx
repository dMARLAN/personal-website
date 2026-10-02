import { MENU_TITLE } from "../constants";
import { MENU_TITLE_FONT } from "../frame/legend";
import { StrokeBox } from "./StrokeBox";
import { StrokeText } from "./StrokeText";

export interface MenuTitleProps {
  name: string;
  boxed?: boolean;
}

/** `addMenuLabel` [fnd §5.5]: the TAC/SUPT title at (0, −446). Render it into the bottom edge strip. */
export function MenuTitle({
  name,
  boxed = false,
}: MenuTitleProps): React.JSX.Element {
  return (
    <>
      <StrokeText
        text={name}
        font={MENU_TITLE_FONT}
        align="CenterCenter"
        pos={MENU_TITLE.pos}
      />
      {boxed && (
        <StrokeBox
          w={MENU_TITLE.box.width}
          h={MENU_TITLE.box.height}
          pos={MENU_TITLE.pos}
        />
      )}
    </>
  );
}
