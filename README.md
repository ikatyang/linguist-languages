# linguist-languages

[![npm](https://img.shields.io/npm/v/linguist-languages.svg)](https://www.npmjs.com/package/linguist-languages)
[![build](https://img.shields.io/travis/ikatyang/linguist-languages/master.svg)](https://travis-ci.com/ikatyang/linguist-languages/builds)

JSON format data from [linguist languages.yml](https://github.com/github/linguist/blob/master/lib/linguist/languages.yml)

## Install

```sh
# using npm
npm install --save-dev linguist-languages

# using yarn
yarn add --dev linguist-languages
```

## Usage

```js
const jsLang = require("linguist-languages/data/javascript");
```

or

```js
const jsLang = require("linguist-languages").JavaScript;
```

## Development

```sh
# lint
yarn run lint

# build
yarn run build

# test
yarn run test
```

## License

MIT © [Ika](https://github.com/ikatyang)
