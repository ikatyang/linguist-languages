import { run } from "./generate";
import { wrap } from "jest-snapshot-serializer-raw";

const fakeLanguagesYml = `
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
`;

const writes: [string, string][] = [];

test("run", () => {
  run({
    clean: false,
    read: () => fakeLanguagesYml,
    write: (filename, content) => writes.push([filename, content])
  });

  writes.forEach(([filename, content]) => {
    expect(wrap(content)).toMatchSnapshot(
      filename.replace(process.cwd(), "<cwd>")
    );
  });
});
