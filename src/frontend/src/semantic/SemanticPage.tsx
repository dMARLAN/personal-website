import { SemanticMain } from "./SemanticMain";

export interface SemanticPageProps {
  heading: string;
  children?: React.ReactNode;
}

/**
 * The page as real HTML (design section 10.2): visually hidden in DDI mode, and the readable page in plain view. It
 * says what the glass shows, so it is an accessible equivalent, not cloaking.
 */
export function SemanticPage({
  heading,
  children,
}: SemanticPageProps): React.JSX.Element {
  return (
    <SemanticMain>
      <h1>{heading}</h1>
      {children}
    </SemanticMain>
  );
}
