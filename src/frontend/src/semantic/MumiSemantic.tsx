import { Fragment } from "react";
import type { MissionData } from "@/content/types";
import { MumiSession } from "@/ddi/pages/mumi/islands";
import { ADMIN_PATH, LOAD_LEGEND } from "@/ddi/pages/mumi/structure";

/** The MUMI page as HTML (design section 10.2): the mission data, and the load as a plain link. */
export function MumiSemantic({
  data: { muId, idFields, mc, sms, errors },
}: {
  data: MissionData;
}): React.JSX.Element {
  const rows = [
    muId,
    ...idFields,
    mc,
    sms,
    { meaning: "Errors from the last load", value: errors.meaning },
  ];
  return (
    <>
      <MumiSession />
      <p>
        The memory unit mission initialization page, drawn as in the Hornet,
        with the site&apos;s deployment in place of mission data.
      </p>
      <dl>
        {rows.map(({ meaning, value }) => (
          <Fragment key={meaning}>
            <dt>{meaning}</dt>
            <dd>{value}</dd>
          </Fragment>
        ))}
      </dl>
      <p>
        <a href={ADMIN_PATH}>{LOAD_LEGEND.label}</a>
      </p>
    </>
  );
}
