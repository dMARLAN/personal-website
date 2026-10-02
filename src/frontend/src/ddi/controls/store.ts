"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import {
  CONTROLS_STORAGE_KEY,
  DEFAULT_CONTROLS,
  VIEW_PARAM,
  VIEW_STORAGE_KEY,
  applyControls,
  controlsReducer,
  parseControls,
  type ControlsAction,
  type ControlsState,
} from "./state";

const listeners = new Set<() => void>();
let current: ControlsState | null = null;

// Storage can throw when the browser blocks it. The controls then work for this page view without persisting.
function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not persisted: see readStorage.
  }
}

function snapshot(): ControlsState {
  current ??= parseControls(readStorage(CONTROLS_STORAGE_KEY));
  return current;
}

function serverSnapshot(): ControlsState {
  return DEFAULT_CONTROLS;
}

function publish(next: ControlsState): void {
  current = next;
  applyControls(document.documentElement, next);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent): void => {
    if (event.key === CONTROLS_STORAGE_KEY) {
      publish(parseControls(event.newValue));
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function dispatchControls(action: ControlsAction): void {
  const next = controlsReducer(snapshot(), action);
  if (next === current) {
    return;
  }
  writeStorage(CONTROLS_STORAGE_KEY, JSON.stringify(next));
  publish(next);
}

/**
 * The bezel controls' state. Call it once, in the controls island. The server snapshot is the default state, so
 * hydration matches the server HTML; the pre-paint script has already drawn the stored state through CSS custom
 * properties.
 */
export function useDisplayControls(): ControlsState {
  const state = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  // React resets <html> attributes when it remounts the root layout in development, which drops what the pre-paint
  // script set. Re-apply before paint. In production this rewrites the same values.
  useLayoutEffect(() => {
    applyControls(document.documentElement, snapshot());
    const viewParam = new URLSearchParams(location.search).get(VIEW_PARAM);
    if (viewParam === "plain" || readStorage(VIEW_STORAGE_KEY) === "plain") {
      document.documentElement.dataset.view = "plain";
    }
  }, []);
  return state;
}
