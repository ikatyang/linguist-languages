import { run } from './generate'
import { wrap } from 'jest-snapshot-serializer-raw'

const fakeLanguagesYml = `
# Defines all Languages known to GitHub.
#
# fs_name               - Optional field. Only necessary as a replacement for the sample directory name if the
#                         language name is not a valid filename under the Windows filesystem (e.g., if it
#                         contains an asterisk).
# type                  - Either data, programming, markup, prose, or nil
# aliases               - An Array of additional aliases (implicitly
#                         includes name.downcase)
# ace_mode              - A String name of the Ace Mode used for highlighting whenever
#                         a file is edited. This must match one of the filenames in http://git.io/3XO_Cg.
#                         Use "text" if a mode does not exist.
#
# Any additions or modifications (even trivial) should have corresponding
# test changes in \`test/test_blob.rb\`.
#
# Please keep this list alphabetized. Capitalization comes before lowercase.

Test1:
  type: programming
  color: "#814CCC"
  aliases:
  - hello
  extensions:
  - ".bsl"
  - ".os"
  tm_scope: source.bsl
  ace_mode: text
  language_id: 0
Test Test 2:
  type: programming
  color: "#E8274B"
  extensions:
  - ".abap"
  ace_mode: abap
  wrap: true
  language_id: 1
F*:
  fs_name: Fstar
  type: programming
  color: "#572e30"
  aliases:
  - fstar
  extensions:
  - ".fst"
  tm_scope: source.fstar
  ace_mode: text
  language_id: 336943375
`

const writes: [string, string][] = []

test('run', () => {
  run({
    clean: false,
    read: () => fakeLanguagesYml,
    write: (filename, content) => writes.push([filename, content]),
  })

  writes.forEach(([filename, content]) => {
    expect(wrap(content)).toMatchSnapshot(
      filename.replace(process.cwd(), '<cwd>'),
    )
  })
})
