import { run } from "./generate";
import { wrap } from "jest-snapshot-serializer-raw";

const fakeLanguagesYml = `
Test1:
  type: programming
  color: "#814CCC"
  alias:
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
