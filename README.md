This tool radically upgrade all your dependencies (in package.json) to latest version.

:warning: This tool does not provide any way to _downgrade_ or _ignore_ specific packages.

### Usage

```bash
# upgrade all packages in "dependencies"
npx @hyrious/up
# "dependencies" + "devDependencies"
npx @hyrious/up -D
```

Behind the scene:

```bash
# check the latest version info at https://data.jsdelivr.com/v1/package/npm/vue
# it uses jsdelivr for now, maybe add registry later
# find out which tag is currently being used, e.g. "next"
npm uninstall vue
npm install vue@next
# if we can not fetch the info, just do nothing
```

It also supports `yarn` and `pnpm`. In that case, commands are:

```bash
yarn remove vue
yarn add vue@next
```

```bash
pnpm remove vue
pnpm add vue@next
```

### License

The MIT license.
