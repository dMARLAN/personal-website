"use client";

import type { SectionDocuments, ValidationIssue } from "./api";
import { RowIssues, TextField, withItem } from "./fields";

type Profile = SectionDocuments["profile"];

/** About → TGT DATA OWNSHIP. The header slot is the site name, so it is not here. */
export function ProfileForm({
  profile,
  onChange,
  issues,
}: {
  profile: Profile;
  onChange(profile: Profile): void;
  issues: readonly ValidationIssue[];
}): React.JSX.Element {
  return (
    <>
      <TextField
        label="Badge (top right, ≤ 18)"
        value={profile.badge}
        onChange={(badge) => onChange({ ...profile, badge })}
        issues={issues}
        path={["badge"]}
      />
      <fieldset>
        <legend>Status rows (label ≤ 7 with the colon, value ≤ 9)</legend>
        {profile.status.map((row, index) => (
          <div key={index} className="admin-row">
            <TextField
              label={`Status ${index + 1} label`}
              value={row.label}
              onChange={(label) =>
                onChange({
                  ...profile,
                  status: withItem(profile.status, index, { ...row, label }),
                })
              }
              issues={issues}
              path={["status", index, "label"]}
            />
            <TextField
              label={`Status ${index + 1} value`}
              value={row.value}
              onChange={(value) =>
                onChange({
                  ...profile,
                  status: withItem(profile.status, index, { ...row, value }),
                })
              }
              issues={issues}
              path={["status", index, "value"]}
            />
          </div>
        ))}
      </fieldset>
      <fieldset>
        <legend>Loadout (≤ 17 each)</legend>
        {profile.loadout.map((line, index) => (
          <TextField
            key={index}
            label={`Loadout ${index + 1}`}
            value={line}
            onChange={(value) =>
              onChange({
                ...profile,
                loadout: withItem(profile.loadout, index, value),
              })
            }
            issues={issues}
            path={["loadout", index]}
          />
        ))}
      </fieldset>
      <TextField
        label="Footer (≤ 19)"
        value={profile.footer}
        onChange={(footer) => onChange({ ...profile, footer })}
        issues={issues}
        path={["footer"]}
      />
      <fieldset>
        <legend>Tags (label, a space and value ≤ 18)</legend>
        {profile.tags.map((row, index) => (
          <div key={index} className="admin-row">
            <TextField
              label={`Tag ${index + 1} label`}
              value={row.label}
              onChange={(label) =>
                onChange({
                  ...profile,
                  tags: withItem(profile.tags, index, { ...row, label }),
                })
              }
              issues={issues}
              path={["tags", index, "label"]}
            />
            <TextField
              label={`Tag ${index + 1} value`}
              value={row.value}
              onChange={(value) =>
                onChange({
                  ...profile,
                  tags: withItem(profile.tags, index, { ...row, value }),
                })
              }
              issues={issues}
              path={["tags", index, "value"]}
            />
            <RowIssues issues={issues} path={["tags", index]} />
          </div>
        ))}
      </fieldset>
      <TextField
        label="Bio (wrapped to 9 rows of 18)"
        value={profile.bio}
        onChange={(bio) => onChange({ ...profile, bio })}
        issues={issues}
        path={["bio"]}
        multiline
      />
    </>
  );
}
