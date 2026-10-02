import type { LabelValue, Profile } from "@/content/types";
import { SITE_NAME } from "@/lib/site";

function withoutColon(label: string): string {
  return label.replace(/:$/, "");
}

function Rows({ rows }: { rows: readonly LabelValue[] }): React.JSX.Element {
  return (
    <dl>
      {rows.map(({ label, value }) => (
        <div key={label}>
          <dt>{withoutColon(label)}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** About as real HTML: everything the TGT DATA card shows, in reading order (design section 10.2). */
export function AboutSemantic({
  profile,
}: {
  profile: Profile;
}): React.JSX.Element {
  return (
    <>
      <p>
        {SITE_NAME}. {profile.badge}.
      </p>
      <p>{profile.bio}</p>
      <h2>Profile</h2>
      <Rows rows={profile.status} />
      <h2>Loadout</h2>
      <ul>
        {profile.loadout.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p>{profile.footer}</p>
      <h2>Identification</h2>
      <Rows rows={profile.tags} />
    </>
  );
}
