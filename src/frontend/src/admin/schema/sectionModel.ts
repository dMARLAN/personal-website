import { buildSectionFields, type FieldNode } from "./fields";
import {
  OPENAPI_SCHEMAS,
  sectionSchemaName,
  type JsonValue,
  type SchemaRoot,
} from "./jsonSchema";
import { hintIssues, SchemaValidator, type FieldIssue } from "./validate";

/** Everything the editor derives from one section's schema. */
export interface SectionModel {
  schemaName: string;
  fields: FieldNode;
  /** The schema's issues with `document`, plus the rules its `x-` keys describe. */
  validate(document: JsonValue): FieldIssue[];
}

export function createSectionModels(
  root: SchemaRoot,
): (section: string) => SectionModel {
  const validator = new SchemaValidator(root);
  const models = new Map<string, SectionModel>();
  return (section) => {
    let model = models.get(section);
    if (model === undefined) {
      const schemaName = sectionSchemaName(root, section);
      const fields = buildSectionFields(root, schemaName);
      model = {
        schemaName,
        fields,
        validate: (document) => {
          const hints = hintIssues(fields, document, document);
          const charsetPointers = new Set(
            hints
              .filter((issue) => issue.keyword === "x-ddi-charset")
              .map((issue) => issue.pointer),
          );
          // A stroke-font string's `pattern` is the glyph set: the charset message names the characters instead.
          return [
            ...validator
              .validate(schemaName, document)
              .filter(
                (issue) =>
                  !(
                    issue.keyword === "pattern" &&
                    charsetPointers.has(issue.pointer)
                  ),
              ),
            ...hints,
          ].map(({ pointer, message }) => ({ pointer, message }));
        },
      };
      models.set(section, model);
    }
    return model;
  };
}

/** The models for the API's committed schemas. */
export const sectionModel = createSectionModels(OPENAPI_SCHEMAS);
