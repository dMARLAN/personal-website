import { DISPLAY_MODES, KNOB_STEPS } from "../constants";
import {
  CONTROLS_STORAGE_KEY,
  DEFAULT_CONTROLS,
  VIEW_PARAM,
  VIEW_STORAGE_KEY,
  controlsStyle,
  type ControlsState,
} from "./state";

const TENTHS = Array.from({ length: KNOB_STEPS + 1 }, (_, tenths) => tenths);

/** Every value the script can set, precomputed by `controlsStyle` so the script holds no maths of its own. */
function styleTables(): {
  gain: Record<string, string[]>;
  selector: Record<string, string>;
  halo: string[];
  brtAngle: string[];
  contAngle: string[];
} {
  const style = (state: Partial<ControlsState>): Record<string, string> =>
    controlsStyle({ ...DEFAULT_CONTROLS, ...state });
  return {
    gain: Object.fromEntries(
      DISPLAY_MODES.map((mode) => [
        mode,
        TENTHS.map((brt) => style({ mode, brt })["--ddi-gain"]),
      ]),
    ),
    selector: Object.fromEntries(
      DISPLAY_MODES.map((mode) => [
        mode,
        style({ mode })["--ddi-selector-angle"],
      ]),
    ),
    halo: TENTHS.map((cont) => style({ cont })["--ddi-halo"]),
    brtAngle: TENTHS.map((brt) => style({ brt })["--ddi-brt-angle"]),
    contAngle: TENTHS.map((cont) => style({ cont })["--ddi-cont-angle"]),
  };
}

/**
 * Runs in `<head>` before first paint, so a stored OFF never flashes lit (docs/design.md section 5.5). It mirrors
 * `parseControls` and `applyControls`; `prepaint.test.ts` checks that they agree. Storage access can throw (privacy
 * modes, blocked storage), so it is wrapped: the server-rendered defaults then stay.
 */
export const PREPAINT_SCRIPT = `(function(){
var d=document.documentElement,t=${JSON.stringify(styleTables())},s=${JSON.stringify(DEFAULT_CONTROLS)};
function ok(v){return typeof v==="number"&&v%1===0&&v>=0&&v<=${KNOB_STEPS}}
try{var r=JSON.parse(localStorage.getItem(${JSON.stringify(CONTROLS_STORAGE_KEY)}));
if(r&&typeof r==="object"){if(${JSON.stringify(DISPLAY_MODES)}.indexOf(r.mode)>=0)s.mode=r.mode;if(ok(r.brt))s.brt=r.brt;if(ok(r.cont))s.cont=r.cont}}catch(e){}
d.setAttribute("data-ddi-mode",s.mode);
d.style.setProperty("--ddi-gain",t.gain[s.mode][s.brt]);
d.style.setProperty("--ddi-halo",t.halo[s.cont]);
d.style.setProperty("--ddi-selector-angle",t.selector[s.mode]);
d.style.setProperty("--ddi-brt-angle",t.brtAngle[s.brt]);
d.style.setProperty("--ddi-cont-angle",t.contAngle[s.cont]);
var q=new URLSearchParams(location.search).get(${JSON.stringify(VIEW_PARAM)}),k=${JSON.stringify(VIEW_STORAGE_KEY)},p=q==="plain";
try{if(q==="plain")localStorage.setItem(k,"plain");else if(q==="ddi")localStorage.removeItem(k);else p=localStorage.getItem(k)==="plain"}catch(e){}
if(p)d.setAttribute("data-view","plain")})()`;
