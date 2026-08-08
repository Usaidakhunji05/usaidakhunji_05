---
name: Babel generator symlink fix
description: react-native-worklets babel plugin fails to find @babel/generator after @babel/core upgrade; requires manual symlink to root node_modules
---

## The Rule

After any `@babel/core` upgrade (7.29+), you must ensure `@babel/generator` is symlinked to the root `node_modules/@babel/generator` directory, because `react-native-worklets`'s bundled Babel plugin requires it directly.

**Why:** pnpm's strict isolation prevents `react-native-worklets` (which bundles its babel plugin into a single file) from reaching `@babel/generator` via normal transitive resolution. The package is in the pnpm store but not linked where the plugin can find it.

**How to apply:** After any pnpm install that upgrades `@babel/core`, run:
```bash
mkdir -p /home/runner/workspace/node_modules/@babel
ln -sf /home/runner/workspace/node_modules/.pnpm/@babel+generator@<VERSION>/node_modules/@babel/generator /home/runner/workspace/node_modules/@babel/generator
```

Also added `public-hoist-pattern[]=@babel/generator` to root `.npmrc` so future full reinstalls will hoist it automatically (but the symlink is needed immediately without a full reinstall).

The `@babel/generator` version in the store can be checked with:
```bash
ls /home/runner/workspace/node_modules/.pnpm/ | grep "@babel+generator"
```
