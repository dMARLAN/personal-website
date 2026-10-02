"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import {
  NIGHT_QUERY,
  THEME_STORAGE_KEY,
  applyTheme,
  otherTheme,
  parseThemeOverride,
  resolveTheme,
  type Theme,
} from "./theme";

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

function publish(): void {
  applyTheme(document.documentElement, snapshot());
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
 * already set `data-theme`, and the CSS draws from that attribute, not from this value.
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
