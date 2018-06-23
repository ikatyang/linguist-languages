import assert = require("assert");
import camelcase = require("camelcase");
import rm = require("del");
import * as fs from "fs";
import * as jsYaml from "js-yaml";
import mkdir = require("make-dir");
import * as path from "path";
import { getFieldType, Field, indent } from "./utils";

const OUTPUT_LIB_DIRNAME = path.resolve(__dirname, "../lib");
const OUTPUT_DATA_DIRNAME = path.resolve(__dirname, "../data");

const LANGUAGES_FILEPATH = "./node_modules/linguist/lib/linguist/languages.yml";
const NAME_FIELD = "name";

export function run(options?: {
  clean?: boolean;
  read?: (filename: string) => string;
  write?: (filename: string, content: string) => void;
}) {
  // istanbul ignore next
  const {
    clean = true,
    read = (filename: string) => fs.readFileSync(filename, "utf8"),
    write = (filename: string, content: string) =>
      fs.writeFileSync(filename, content + "\n")
  } =
    options || {};

  // istanbul ignore if
  if (clean) {
    rm.sync([OUTPUT_LIB_DIRNAME, OUTPUT_DATA_DIRNAME]);
    mkdir.sync(OUTPUT_LIB_DIRNAME);
    mkdir.sync(OUTPUT_DATA_DIRNAME);
  }

  const languagesContent = read(LANGUAGES_FILEPATH);

  interface Language {
    name: string;
    [key: string]: any;
  }

  const languages = (rawLanguage =>
    Object.keys(rawLanguage).map(
      (name: keyof typeof rawLanguage): Language => {
        const language = rawLanguage[name];

        assert(
          !(NAME_FIELD in language),
          `Conflict field ${NAME_FIELD} in ${name}`
        );

        return Object.keys(language).reduce(
          (reduced, fieldName) =>
            Object.assign(
              reduced,
              fieldName === "alias"
                ? { aliases: [].concat(language[fieldName]) }
                : { [camelcase(fieldName)]: language[fieldName] }
            ),
          { name }
        );
      }
    ))(jsYaml.safeLoad(languagesContent) as Record<string, any>);

  /**
   * - true: required
   * - false: optional
   */
  const fieldRequireds: Record<string, boolean> = {};

  languages.forEach(language => {
    Object.keys(language).forEach(fieldName => {
      // find all fields
      fieldRequireds[fieldName] = true;
    });
  });

  languages.forEach(language => {
    Object.keys(fieldRequireds).forEach(fieldName => {
      if (!(fieldName in language)) {
        // mark optional fields
        fieldRequireds[fieldName] = false;
      }
    });
  });

  const fieldTypes: Record<string, Field> = {};

  languages.forEach(language => {
    Object.keys(language).forEach(fieldName => {
      const fieldType = getFieldType(language[fieldName]);
      if (!(fieldName in fieldTypes)) {
        fieldTypes[fieldName] = fieldType;
      }

      assert.deepEqual(
        fieldType,
        fieldTypes[fieldName],
        `Unmatched field type for ${fieldName} in ${language.name}:\n\n` +
          `${JSON.stringify(fieldName, null, 2)}`
      );
    });
  });

  //---------------------------------write-file---------------------------------

  const interfaceIndentifier = "Language";

  write(
    path.resolve(OUTPUT_LIB_DIRNAME, "index.js"),
    `module.exports = {\n${languages
      .map(
        language =>
          `  ${JSON.stringify(language.name)}: require(${JSON.stringify(
            path.join(
              path.relative(OUTPUT_LIB_DIRNAME, OUTPUT_DATA_DIRNAME),
              getDataBasename(language)
            )
          )})`
      )
      .join(",\n")}\n};`
  );

  (() => {
    const namespaceIndentifier = "LinguistLanguages";
    const languageNameIdentifier = "LanguageName";
    write(
      path.resolve(OUTPUT_LIB_DIRNAME, "index.d.ts"),
      [
        `type ${languageNameIdentifier} =\n${indent(
          languages
            .map(language => `| ${JSON.stringify(language.name)}`)
            .join("\n")
        )};`,
        `declare const ${namespaceIndentifier}: Record<${languageNameIdentifier}, ${namespaceIndentifier}.${interfaceIndentifier}>;`,
        `declare namespace ${namespaceIndentifier} {\n${indent(
          createInterface()
        )}\n}`,
        `export = ${namespaceIndentifier};`
      ].join("\n\n")
    );

    function createInterface() {
      return `interface ${interfaceIndentifier} {\n${indent(
        Object.keys(fieldTypes)
          .map(
            fieldName =>
              `${fieldName}${
                fieldRequireds[fieldName] ? "" : "?"
              }: ${createFieldDefinition(fieldTypes[fieldName])};`
          )
          .join("\n")
      )}\n}`;
    }
    function createFieldDefinition(field: Field) {
      return field.type === "array" ? `${field.subType}[]` : field.type;
    }
  })();

  languages.forEach(language => {
    const basename = getDataBasename(language);
    write(
      path.resolve(OUTPUT_DATA_DIRNAME, `${basename}.json`),
      JSON.stringify(language, null, 2)
    );
  });

  function getDataBasename(language: Language) {
    return language.name.replace(/ /g, "-").toLowerCase();
  }
}

// istanbul ignore if
if (module.parent === null) {
  run();
}
