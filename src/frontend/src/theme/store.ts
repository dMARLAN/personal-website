"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { densityFor, themeMaterials } from "./materials";
import {
  NIGHT_QUERY,
  THEME_STORAGE_KEY,
  applyTheme,
  otherTheme,
  parseThemeOverride,
  resolveTheme,
  type Theme,
} from "./theme";

/** (ours) The longest a theme switch waits for the new theme's materials before it flips anyway. */
const MATERIALS_WAIT_MS = 400;

const listeners = new Set<() => void>();

// Storage can throw when the browser blocks it. The toggle then works for this page view without persisting.
function readOverride(): Theme | null {
  try {
    return parseThemeOverride(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return null;
  }
}

function writeOverride(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Not persisted: see readOverride.
  }
}

let override: Theme | undefined | null;

function snapshot(): Theme {
  if (override === undefined) {
    override = readOverride();
  }
  return resolveTheme(override, matchMedia(NIGHT_QUERY).matches);
}

function serverSnapshot(): Theme {
  return "day";
}

/**
 * Fetches and decodes a theme's materials, so the switch draws them at once instead of flashing the bare bezel
 * colour. A failed image must not block the switch (a decode can reject, for one, when the browser lacks AVIF), and
 * a slow network waits at most MATERIALS_WAIT_MS.
 */
function materialsReady(theme: Theme): Promise<unknown> {
  const decoded = themeMaterials(theme, densityFor(devicePixelRatio)).map(
    (url) => {
      const image = new Image();
      image.src = url;
      return Promise.resolve().then(() => image.decode());
    },
  );
  return Promise.race([
    Promise.allSettled(decoded),
    new Promise((resolve) => setTimeout(resolve, MATERIALS_WAIT_MS)),
  ]);
}

/** Only the DDI draws the baked materials. The homepage has no bezel, so it switches at once. */
function readyToSwitch(theme: Theme): Promise<unknown> {
  return document.querySelector(".ddi-frame") === null
    ? Promise.resolve()
    : materialsReady(theme);
}

// Only the latest switch applies, so two quick presses never land out of order.
let latestSwitch = 0;

function publish(): void {
  const theme = snapshot();
  const thisSwitch = ++latestSwitch;
  void readyToSwitch(theme).then(() => {
    if (thisSwitch === latestSwitch) {
      applyTheme(document.documentElement, theme);
    }
  });
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const query = matchMedia(NIGHT_QUERY);
  const onStorage = (event: StorageEvent): void => {
    if (event.key === THEME_STORAGE_KEY) {
      override = parseThemeOverride(event.newValue);
      publish();
    }
  };
  query.addEventListener("change", publish);
  window.addEventListener("storage", onStorage);
  // The mount applied the theme in a layout effect, and React subscribes later, in a passive effect. An OS change in
  // between fired no listener, so read the theme again now that one is attached.
  if (document.documentElement.dataset.theme !== snapshot()) {
    publish();
  }
  return () => {
    listeners.delete(listener);
    query.removeEventListener("change", publish);
    window.removeEventListener("storage", onStorage);
  };
}

/** Flips the theme and stores the choice as an override, which then wins over the OS colour scheme. */
export function toggleTheme(): void {
  override = otherTheme(snapshot());
  writeOverride(override);
  publish();
}

/**
 * The current theme. The server snapshot is day, so hydration matches the server HTML; the pre-paint script has
 * already set `data-theme`, and the CSS draws from that attribute, not from this value. A switch updates this value at
 * once and `data-theme` once the new theme's materials are decoded.
 */
export function useTheme(): Theme {
  const theme = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  // React resets <html> attributes when it remounts the root layout in development, which drops what the pre-paint
  // script set. Re-apply before paint. In production this rewrites the same value.
  useLayoutEffect(() => {
    applyTheme(document.documentElement, snapshot());
  }, []);
  return theme;
}
