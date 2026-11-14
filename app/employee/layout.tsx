import type { ReactNode } from "react";

/** URLs antigas: as pages filhas redirecionam para /servicedesk/*. */
export default function LegacyEmployeeLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
