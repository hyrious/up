This tool radically upgrade all your dependencies (in package.json) to latest version.

:warning: This tool does not provide any way to _downgrade_ or _ignore_ specific packages.

### Usage

```bash
# upgrade all packages in "dependencies"
npx @hyrious/up
# upgrade all packages in "devDependencies"
npx @hyrious/up -D
# upgrade all packages in "dependencies" and "devDependencies"
npx @hyrious/up +D
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

#### Full command options list

```bash
up [-D|+D] [--npm|--yarn|--pnpm]
           upgrade dependencies by default
        -D upgrade devDependencies
        +D upgrade dependencies and devDependencies
     --npm force using npm, in case it can not figure out which pm you are using
    --yarn force using yarn
    --pnpm force using pnpm
```

### License

The MIT license.
