import { draftMode } from "next/headers";
import { getPreviewState } from "@/content/source";
import { PREVIEW_META_NAME } from "./paths";
import { PreviewRefresher } from "./PreviewRefresher";

/**
 * In draft mode, the link between a page and the admin's preview frame (docs/design.md section 13.9): a `<meta>` with
 * the preview state, which the admin reads when the frame loads, and the refresher. Outside draft mode it renders
 * nothing and reads nothing, so public pages stay static and unchanged.
 */
export async function PreviewBridge(): Promise<React.JSX.Element | null> {
  if (!(await draftMode()).isEnabled) {
    return null;
  }
  const state = await getPreviewState();
  if (state === null) {
    throw new Error("draft mode is on but the content loaded without it");
  }
  return (
    <>
      <meta name={PREVIEW_META_NAME} content={state} />
      <PreviewRefresher state={state} renderId={crypto.randomUUID()} />
    </>
  );
}
