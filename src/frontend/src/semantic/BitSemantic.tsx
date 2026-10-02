import type { Bit, BitItemKey } from "@/content/types";
import { BitSession } from "@/ddi/pages/bit/islands";
import { failingItems, liveCheck } from "@/ddi/pages/bit/screens";
import { groupStatus, INITIAL_TEST_STATE } from "@/ddi/pages/bit/status";
import { SUBLEVELS } from "@/ddi/pages/bit/structure";
import { PAGES } from "@/ddi/pages/registry";
import { SemanticPage } from "./SemanticPage";

function CheckTable({
  checks,
  items,
  caption,
}: {
  checks: Bit["checks"];
  items: readonly BitItemKey[];
  caption: string;
}): React.JSX.Element {
  return (
    <table>
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Check</th>
          <th scope="col">Status</th>
          <th scope="col">After a test</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item}>
            <th scope="row">{checks[item].name}</th>
            <td>{checks[item].status}</td>
            <td>{checks[item].afterTest}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * `/bit` as real HTML (design section 10.2). The BIT levels are in-section state, so this lists every level's
 * content: the failures, each group with its checks, and the software configuration.
 */
export function BitSemantic({
  bit: { checks, swConfig },
}: {
  bit: Bit;
}): React.JSX.Element {
  return (
    <SemanticPage heading={PAGES.bit.label}>
      <BitSession />
      <p>
        A mock of the F/A-18C built-in test page, with a software
        engineer&apos;s checks in place of aircraft systems. On the display, a
        check&apos;s button runs its test: it shows IN TEST, then its result.
      </p>
      <section>
        <h2>BIT failures</h2>
        <CheckTable
          checks={checks}
          items={failingItems(checks)}
          caption="Checks that are not passing"
        />
      </section>
      {SUBLEVELS.map((sublevel) => {
        const items = [
          ...sublevel.rows,
          ...(sublevel.extraRows ?? []).map(({ item }) => item),
        ];
        const summary = groupStatus(
          sublevel.rows.map((item) => liveCheck(checks, item)),
          INITIAL_TEST_STATE,
        );
        return (
          <section key={sublevel.id}>
            <h2>{sublevel.title}</h2>
            <p>Group status: {summary}</p>
            <CheckTable
              checks={checks}
              items={items}
              caption={`${sublevel.title} checks`}
            />
          </section>
        );
      })}
      <section>
        <h2>Software configuration</h2>
        <dl>
          {[...swConfig.left, ...swConfig.right].flatMap((entry) =>
            entry === null
              ? []
              : [
                  <div key={entry.name}>
                    <dt>{entry.name}</dt>
                    <dd>{entry.value}</dd>
                  </div>,
                ],
          )}
        </dl>
      </section>
    </SemanticPage>
  );
}
