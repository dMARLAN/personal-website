import {
  BRIGHTNESS_CURVE,
  HALO_BOOST,
  HALO_OPACITY,
  KNOB_DIVISIONS,
  KNOB_SWEEP,
} from "../constants";
import { firstPaintMaterials } from "@/theme/materials";
import { NIGHT_QUERY, THEMES, THEME_STORAGE_KEY } from "@/theme/theme";
import {
  CONTROLS_STORAGE_KEY,
  DEFAULT_CONTROLS,
  VIEW_PARAM,
  VIEW_STORAGE_KEY,
} from "./state";

const j = JSON.stringify;

/** Each theme's first-paint materials at each density, for the script to preload (docs/design.md section 4.5). */
const FIRST_PAINT = Object.fromEntries(
  THEMES.map((theme) => [
    theme,
    {
      "@2x": firstPaintMaterials(theme, "@2x"),
      "@3x": firstPaintMaterials(theme, "@3x"),
    },
  ]),
);

/**
 * Runs in `<head>` before first paint, so neither the stored knobs nor the theme flash (docs/design.md sections 4.8
 * and 5.5). The knobs are continuous, so the script cannot look values up in a table: it repeats `parseControls`,
 * `clampKnob`, `controlsStyle`, `parseThemeOverride` and `resolveTheme` in plain ES5. `prepaint.test.ts` checks that
 * both agree. Storage access can throw (privacy modes, blocked storage), so it is wrapped: the server-rendered
 * defaults and the OS colour scheme then apply. Outside the plain view it then preloads the resolved theme's
 * first-paint materials at the density `densityFor` picks, so the bezel textures race the stylesheet, not follow it.
 */
export const PREPAINT_SCRIPT = `(function(){
var d=document.documentElement,s=${j(DEFAULT_CONTROLS)},n=${KNOB_DIVISIONS};
function k(v,f){return typeof v==="number"&&isFinite(v)?Math.min(1,Math.max(0,Math.round(v*n)/n)):f}
function c(v){return String(Math.round(v*10000)/10000)}
try{var r=JSON.parse(localStorage.getItem(${j(CONTROLS_STORAGE_KEY)}));
if(r&&typeof r==="object"){s.brt=k(r.brt,s.brt);s.cont=k(r.cont,s.cont)}}catch(e){}
var h=${HALO_OPACITY.soft}-${HALO_OPACITY.range}*s.cont,f=${BRIGHTNESS_CURVE.floor};
d.style.setProperty("--ddi-gain",c(Math.min(1,f+(1-f)*2*s.brt)));
d.style.setProperty("--ddi-halo",c(h+(1-h)*${HALO_BOOST}*Math.max(0,2*s.brt-1)));
d.style.setProperty("--ddi-brt-angle",c(${KNOB_SWEEP}*(2*s.brt-1))+"deg");
d.style.setProperty("--ddi-cont-angle",c(${KNOB_SWEEP}*(2*s.cont-1))+"deg");
var t=null;try{t=localStorage.getItem(${j(THEME_STORAGE_KEY)})}catch(e){}
if(${j(THEMES)}.indexOf(t)<0)t=matchMedia(${j(NIGHT_QUERY)}).matches?"night":"day";
d.setAttribute("data-theme",t);
var q=new URLSearchParams(location.search).get(${j(VIEW_PARAM)}),u=${j(VIEW_STORAGE_KEY)},p=q==="plain";
try{if(q==="plain")localStorage.setItem(u,"plain");else if(q==="ddi")localStorage.removeItem(u);else p=localStorage.getItem(u)==="plain"}catch(e){}
if(p)d.setAttribute("data-view","plain");
else{var m=${j(FIRST_PAINT)}[t][window.devicePixelRatio>1?"@3x":"@2x"];
for(var i=0;i<m.length;i++){var e=document.createElement("link");e.rel="preload";e.as="image";e.type="image/avif";e.href=m[i];document.head.appendChild(e)}}})()`;
