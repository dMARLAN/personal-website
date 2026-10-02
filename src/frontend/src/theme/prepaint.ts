import { NIGHT_QUERY, THEMES, THEME_STORAGE_KEY } from "./theme";

const j = JSON.stringify;

/**
 * The homepage's pre-paint script: only the theme, since the homepage has no DDI controls or materials. It repeats
 * `parseThemeOverride` and `resolveTheme` in plain ES5 and sets `data-theme` before first paint, so a reload never
 * flashes. `prepaint.test.ts` checks that both agree. Storage access can throw, so the OS colour scheme then decides.
 */
export const THEME_PREPAINT_SCRIPT = `(function(){
var t=null;try{t=localStorage.getItem(${j(THEME_STORAGE_KEY)})}catch(e){}
if(${j(THEMES)}.indexOf(t)<0)t=matchMedia(${j(NIGHT_QUERY)}).matches?"night":"day";
document.documentElement.setAttribute("data-theme",t)})()`;
