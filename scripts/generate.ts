import assert from 'node:assert'
import * as fs from 'node:fs'
import * as path from 'node:path'
import camelcase from 'camelcase'
import { deleteSync } from 'del'
import mkdir from 'make-dir'
import { parse } from 'yaml'
import { getFieldType, Field, indent } from './utils.js'

const OUTPUT_LIB_DIRNAME = path.resolve(__dirname, '../lib')
const OUTPUT_DATA_DIRNAME = path.resolve(__dirname, '../data')

const LANGUAGES_FILEPATH = './vendor/linguist/lib/linguist/languages.yml'
const NAME_FIELD = 'name'

export function run(options?: {
  clean?: boolean
  read?: (filename: string) => string
  write?: (filename: string, content: string) => void
}) {
  /* c8 ignore start */
  const {
    clean = true,
    read = (filename: string) => fs.readFileSync(filename, 'utf8'),
    write = (filename: string, content: string) =>
      fs.writeFileSync(filename, content + '\n'),
  } = options || {}
  /* c8 ignore stop */

  /* c8 ignore start */
  if (clean) {
    deleteSync([OUTPUT_LIB_DIRNAME, OUTPUT_DATA_DIRNAME])
    mkdir.sync(OUTPUT_LIB_DIRNAME)
    mkdir.sync(OUTPUT_DATA_DIRNAME)
  }
  /* c8 ignore stop */

  const languagesContent = read(LANGUAGES_FILEPATH)

  interface Language {
    name: string
    fsName?: string
    [key: string]: any
  }

  const descriptions = languagesContent
    .match(/#\n((?:#.+\n)+?)#\n/)![1]
    .split('\n')
    .map(x => x.slice(2))
    .join('\n')
    .split(/^(\w+)/m)
    .slice(1)
    .reduce(
      (descriptions, content, index, contents) => {
        if (index % 2 === 1) {
          const fieldName = contents[index - 1]
          const alignmentLength = content.indexOf('-') + 2
          descriptions[camelcase(fieldName)] = content
            .trimRight()
            .split('\n')
            .map((x, i) =>
              x.slice(
                i === 0 ? alignmentLength : alignmentLength + fieldName.length,
              ),
            )
            .join('\n')
        }
        return descriptions
      },
      {} as { [fieldName: string]: string },
    )

  const languages = (rawLanguage =>
    Object.keys(rawLanguage).map((name: keyof typeof rawLanguage): Language => {
      const language = rawLanguage[name]

      assert(
        !(NAME_FIELD in language),
        `Conflict field ${NAME_FIELD} in ${name}`,
      )

      return Object.keys(language).reduce(
        (reduced, fieldName) =>
          Object.assign(reduced, {
            [camelcase(fieldName)]: language[fieldName],
          }),
        { name },
      )
    }))(parse(languagesContent) as Record<string, any>)

  /**
   * - true: required
   * - false: optional
   */
  const fieldRequireds: Record<string, boolean> = {}

  languages.forEach(language => {
    Object.keys(language).forEach(fieldName => {
      // find all fields
      fieldRequireds[fieldName] = true
    })
  })

  languages.forEach(language => {
    Object.keys(fieldRequireds).forEach(fieldName => {
      if (!(fieldName in language)) {
        // mark optional fields
        fieldRequireds[fieldName] = false
      }
    })
  })

  const fieldTypes: Record<string, Field> = {}

  languages.forEach(language => {
    Object.keys(language).forEach(fieldName => {
      const fieldType = getFieldType(language[fieldName])
      if (!(fieldName in fieldTypes)) {
        fieldTypes[fieldName] = fieldType
      }

      assert.deepEqual(
        fieldType,
        fieldTypes[fieldName],
        `Unmatched field type for ${fieldName} in ${language.name}:\n\n` +
          `${JSON.stringify(fieldName, null, 2)}`,
      )
    })
  })

  //---------------------------------write-file---------------------------------

  const interfaceIdentifier = 'Language'

  // FIXME: use named export once supported
  // Ref: https://github.com/microsoft/TypeScript/issues/40594

  write(
    path.resolve(OUTPUT_LIB_DIRNAME, 'index.js'),
    [
      ...languages.map(
        (_, i) =>
          `import _${i} from ${JSON.stringify(
            `${path.join(
              path.relative(OUTPUT_LIB_DIRNAME, OUTPUT_DATA_DIRNAME),
              encodeURIComponent(getDataBasename(_)),
            )}.js`,
          )}`,
      ),
      `export default {`,
      ...languages.map((_, i) => `  ${JSON.stringify(_.name)}: _${i},`),
      `}`,
    ].join('\n'),
  )
  ;(() => {
    const languageNameIdentifier = 'LanguageName'
    write(
      path.resolve(OUTPUT_LIB_DIRNAME, 'index.d.ts'),
      [
        `type ${languageNameIdentifier} =\n${indent(
          languages
            .map(language => `| ${JSON.stringify(language.name)}`)
            .join('\n'),
        )}`,
        `export ${createInterface()}`,
        `declare const languages: Record<${languageNameIdentifier}, ${interfaceIdentifier}>`,
        `export default languages`,
      ].join('\n\n'),
    )

    function createInterface() {
      return `interface ${interfaceIdentifier} {\n${indent(
        Object.keys(fieldTypes)
          .map(
            fieldName =>
              (fieldName in descriptions
                ? '/**\n' +
                  descriptions[fieldName]
                    .split('\n')
                    .map(x => ` * ${x}`)
                    .join('\n') +
                  '\n */\n'
                : '') +
              `${fieldName}${
                fieldRequireds[fieldName] ? '' : '?'
              }: ${createFieldDefinition(fieldTypes[fieldName])}`,
          )
          .join('\n'),
      )}\n}`
    }
    function createFieldDefinition(field: Field) {
      return field.type === 'array' ? `${field.subType}[]` : field.type
    }
  })()

  languages.forEach(language => {
    const basename = getDataBasename(language)
    write(
      path.resolve(OUTPUT_DATA_DIRNAME, `${basename}.js`),
      `export default ${JSON.stringify(language, null, 2)}`,
    )
  })

  function getDataBasename(language: Language) {
    return language.fsName || language.name
  }
}

/* c8 ignore start */
if (process.argv[2] === 'run') {
  run()
}
/* c8 ignore stop */
