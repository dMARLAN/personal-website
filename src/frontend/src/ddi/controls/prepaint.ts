import {
  BRIGHTNESS_CURVE,
  DISPLAY_MODES,
  HALO_BOOST,
  HALO_OPACITY,
  KNOB_DIVISIONS,
  KNOB_SWEEP,
  MODE_SCALE,
  SELECTOR_ANGLES,
} from "../constants";
import {
  CONTROLS_STORAGE_KEY,
  DEFAULT_CONTROLS,
  VIEW_PARAM,
  VIEW_STORAGE_KEY,
} from "./state";

const j = JSON.stringify;

/**
 * Runs in `<head>` before first paint, so a stored OFF never flashes lit (docs/design.md section 5.5). The knobs are
 * continuous, so the script cannot look values up in a table: it repeats `parseControls`, `clampKnob` and
 * `controlsStyle` in plain ES5. `prepaint.test.ts` checks that both agree across the whole range. Storage access can
 * throw (privacy modes, blocked storage), so it is wrapped: the server-rendered defaults then stay.
 */
export const PREPAINT_SCRIPT = `(function(){
var d=document.documentElement,s=${j(DEFAULT_CONTROLS)},n=${KNOB_DIVISIONS};
function k(v,f){return typeof v==="number"&&isFinite(v)?Math.min(1,Math.max(0,Math.round(v*n)/n)):f}
function c(v){return String(Math.round(v*10000)/10000)}
try{var r=JSON.parse(localStorage.getItem(${j(CONTROLS_STORAGE_KEY)}));
if(r&&typeof r==="object"){if(${j(DISPLAY_MODES)}.indexOf(r.mode)>=0)s.mode=r.mode;s.brt=k(r.brt,s.brt);s.cont=k(r.cont,s.cont)}}catch(e){}
var h=${HALO_OPACITY.soft}-${HALO_OPACITY.range}*s.cont,f=${BRIGHTNESS_CURVE.floor};
d.setAttribute("data-ddi-mode",s.mode);
d.style.setProperty("--ddi-gain",c(${j(MODE_SCALE)}[s.mode]*Math.min(1,f+(1-f)*2*s.brt)));
d.style.setProperty("--ddi-halo",c(h+(1-h)*${HALO_BOOST}*Math.max(0,2*s.brt-1)));
d.style.setProperty("--ddi-selector-angle",${j(SELECTOR_ANGLES)}[s.mode]+"deg");
d.style.setProperty("--ddi-brt-angle",c(${KNOB_SWEEP}*(2*s.brt-1))+"deg");
d.style.setProperty("--ddi-cont-angle",c(${KNOB_SWEEP}*(2*s.cont-1))+"deg");
var q=new URLSearchParams(location.search).get(${j(VIEW_PARAM)}),u=${j(VIEW_STORAGE_KEY)},p=q==="plain";
try{if(q==="plain")localStorage.setItem(u,"plain");else if(q==="ddi")localStorage.removeItem(u);else p=localStorage.getItem(u)==="plain"}catch(e){}
if(p)d.setAttribute("data-view","plain")})()`;
