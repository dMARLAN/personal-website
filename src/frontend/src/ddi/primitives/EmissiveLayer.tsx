export interface EmissiveLayerProps {
  /** Unique within the page: the `<use>` elements reference the geometry by this id. */
  id: string;
  /** False leaves the layer out of the optional bloom, for content that changes every frame. */
  bloom?: boolean;
  children: React.ReactNode;
}

/**
 * The DCS stroke shader as two strokes of the same geometry: a wide, translucent halo under a solid core. Under both
 * sits the optional bloom, a blurred copy that only the night theme shows (docs/design.md section 6.3). The geometry
 * exists once in the DOM. Stroke colour and widths come from `emissive.css`. Render it inside an `<svg>` whose user
 * units are DI.
 */
export function EmissiveLayer({
  id,
  bloom = true,
  children,
}: EmissiveLayerProps): React.JSX.Element {
  return (
    <>
      <defs>
        <g id={id}>{children}</g>
      </defs>
      {bloom && <use href={`#${id}`} className="ddi-bloom" />}
      <use href={`#${id}`} className="ddi-halo" />
      <use href={`#${id}`} className="ddi-core" />
    </>
  );
}
