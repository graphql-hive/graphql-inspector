# Change log

### vNEXT

### v4.0.0

- **action**: Fix custom rule files not found when specified as relative paths
- **action**: BREAKING CHANGE - Node engine in the action runner is now v24
  ([#2957](https://github.com/graphql-hive/graphql-inspector/pull/2957))

### v3.4.0

- **cli**: New `audit` command [#2164](https://github.com/kamilkisiela/graphql-inspector/pull/2164)

### v3.3.0

- **docker**: Publish images to the registry
- **core**: Fix `Cannot convert object to primitive value` error for defaultValue in
  `ChangeType.InputFieldDefaultValueChanged`
- **action**: Fix ignored `approve-label` for `push` events
  [#2133](https://github.com/kamilkisiela/graphql-inspector/pull/2133)
- **core**: Addition of non-nullable argument with a default is now dangerous (previously breaking)
  [#2137](https://github.com/kamilkisiela/graphql-inspector/pull/2137)

### v3.2.0

- **action**: Use GitHub REST API to retrieve the full blob content if schema is truncated
  [#2131](https://github.com/kamilkisiela/graphql-inspector/pull/2131)
- **action**: Diffing a graphql endpoint with a local .json schema file results in an error, fixed
  in [#2090](https://github.com/kamilkisiela/graphql-inspector/pull/2090)
- **core**: Fix comparison of non-nullable fields
  [#2122](https://github.com/kamilkisiela/graphql-inspector/pull/2122)
- **core**: Fix removal of a deprecated input field
  [#2103](https://github.com/kamilkisiela/graphql-inspector/pull/2103)

### v3.1.4

- **core**: Fix regression [#2128](https://github.com/kamilkisiela/graphql-inspector/issues/2128)
  introduced in [#2100](https://github.com/kamilkisiela/graphql-inspector/pull/2100)

### v3.1.3

- **core**: Fix missing export of `safeUnreachable` rule
  [#2063](https://github.com/kamilkisiela/graphql-inspector/issues/2063)
- **core**: Fix equality for objects
  [#2100](https://github.com/kamilkisiela/graphql-inspector/pull/2100)

### v3.1.2

- **core**: Make sure array of null prototype objects is printable
  [#2030](https://github.com/kamilkisiela/graphql-inspector/pull/2030)
- **cli**: Update GraphQL Yoga to v2

### v3.1.1

- **cli**: Use GraphQL Yoga in `serve` command

### v3.1.0

- **action**: Support introspection query result

### v3.0.2

- **action**: `schema` can now point to GraphQL API
- **cli**: fix missing `--onUsage` in the diff command

### v3.0.1

- **core**: prevent runtime exceptions during printing default value change
  [#2017](https://github.com/kamilkisiela/graphql-inspector/pull/2017)

### v3.0.0

- **core**: BREAKING CHANGE - `diff` is now async
- **github**: BREAKING CHANGE - `experimental_merge` is now enabled by default
- **core**: Adds `considerUsage` rule
- **core**: Adds `safeUnreachable` rule
- **core**: Fixes missing names of default root types
- **cli**, **ci**: Adds `@aws_lambda` directive
- **cli**, **ci**: Fixes missing headers in diff command

### v2.9.0

- **ci**, **cli**: Add `--ignore` to validate command

### v2.8.1

- **ci**, **cli**: `--filter` should not affect the exit code of the validate command

### v2.8.0

- **ci**, **cli**: `validate` command can output JSON result
- **ci**, **cli**: `validate` command can show only errors
- **ci**, **cli**: `validate` command can show relative file paths
- **ci**, **cli**: `validate` command has silent mode

### v2.7.0

- **core**: collect arguments in Schema Coverage
  [#1962](https://github.com/kamilkisiela/graphql-inspector/issues/1962)
- **ci**, **cli**: allow to filter results by file paths when validating documents

### v2.6.2

- **cli**: Fix missing headers

### v2.6.1

- **cli**: Revert log-symbols to v4 - brings back CJS support

### v2.6.0

- **github**: Allow for error handling
- **cli**: Adds a relevant file path to an error message
  [#1887](https://github.com/kamilkisiela/graphql-inspector/pull/1887)
- **cli**: Adds `--left-header` and `--right-header`
  [#1899](https://github.com/kamilkisiela/graphql-inspector/pull/1899)
- **core**: Add rule to make dangerous changes breaking (`dangerousBreaking`)
  [#1899](https://github.com/kamilkisiela/graphql-inspector/pull/1899)
- **core**: Make sure default argument values are printable
  [#1959](https://github.com/kamilkisiela/graphql-inspector/pull/1959)

### v2.5.0

- **action**: Accepts a GitHub Label to mark Pull Request with breaking changes as something
  expected and safe [#1852](https://github.com/kamilkisiela/graphql-inspector/pull/1852)
- **action**: Send annotations in batches
  [#1854](https://github.com/kamilkisiela/graphql-inspector/pull/1854)
- **action**: Fix missing "path" when using "endpoint"
  [#1855](https://github.com/kamilkisiela/graphql-inspector/pull/1855)
- **core**: Fix no deprecation notice for field on fragment in a different document
  [#1849](https://github.com/kamilkisiela/graphql-inspector/pull/1849)

### v2.4.0

- **cli**: Support GET method in URL loaders
  [#1797](https://github.com/kamilkisiela/graphql-inspector/pull/1797)
  [#1796](https://github.com/kamilkisiela/graphql-inspector/pull/1796)
- **cli**: Support AWS types [#1793](https://github.com/kamilkisiela/graphql-inspector/pull/1793)
- **github**: Detection of a legacy config + note in a summary
- **github**: Better error message on parsing failure
  [PR #1777](https://github.com/kamilkisiela/graphql-inspector/pull/1777)
- **github**: Introduce `summaryLimit` in Diff options
  [PR #1775](https://github.com/kamilkisiela/graphql-inspector/pull/1775)
- **action**: Support multiple GitHub Actions, new `name` input
  [PR #1770](https://github.com/kamilkisiela/graphql-inspector/pull/1770)

### v2.3.0

- **action,github**: EXPERIMENTAL - Merge Pull Request's branch with the target branch to get the
  schema. Helps to get the correct state of schema when Pull Request is behind the target branch.
  _(disabled by default)_ - [docs](https://graphql-inspector.com/docs/products/github#experimental)
- **github**: Accepts a GitHub Label to mark Pull Request with breaking changes as something
  expected and safe [PR #1711](https://github.com/kamilkisiela/graphql-inspector/pull/1711) -
  [docs](https://graphql-inspector.com/docs/products/github#approved-breaking-change-label)
- **cli**: Add support for Apollo Federation directives
  [PR #1661](https://github.com/kamilkisiela/graphql-inspector/pull/1661) - by
  [@jinhong-](https://github.com/jinhong-)

### v2.2.0

- **core**: Adds two additional change types for enum value deprecations (added and removed) to
  match behavior with fields
- **core**: Fixes the type returned by `enumValueDeprecationReasonChanged` (was
  `EnumValueDescriptionChanged`).

### v2.1.0

- Use GraphQL Tools v6
- Integration with GraphQL CLI

### v2.0.1

- **github** skip diff checks for new branches and re-check once Pull Request is opened
  [#1493](https://github.com/kamilkisiela/graphql-inspector/issues/1493)
- **action github cli ci loaders** - assume valid Schema and SDL
  [#1508](https://github.com/kamilkisiela/graphql-inspector/pull/1508)

### v2.0.0

Read ["New GraphQL Inspector"](https://the-guild.dev/blog/new-graphql-inspector) on our blog

- **github** put annotations of removed parts of schema on new schema
  [#1414](https://github.com/kamilkisiela/graphql-inspector/issues/1414)
- **ci**: improve UX [#1413](https://github.com/kamilkisiela/graphql-inspector/pull/1413)
- **github** schema change notifications on Slack, Discord and through Webhook.
- **github** **action** opt-out annotations
- **github** **action** opt-in forced success on breaking changes
- **github** **action** endpoint as source of schema
- **github** support multiple environments (production, preview etc)
- **github** remote interception of detected changes (schema check) via http
- **github** managing unrelated PRs separately
- **action** use original SHA, not SHA from `pull_request` event
  [PR #1440](https://github.com/kamilkisiela/graphql-inspector/pull/1440)
- **github** **action** assume valid schema to avoid missing directive definitions
  [PR #1440](https://github.com/kamilkisiela/graphql-inspector/pull/1440)
- **cli** **ci** fix `--header` and `--token`
  [PR #1442](https://github.com/kamilkisiela/graphql-inspector/pull/1442)
- **cli** **ci** BREAKING: don't use preceding comments as the description by default (`--comments`
  flag to enable comments) [PR #1443](https://github.com/kamilkisiela/graphql-inspector/pull/1443)
- **github** use SHA of the most recent commit on ref before the push
  [PR #1448](https://github.com/kamilkisiela/graphql-inspector/pull/1448)
- **github** send annotations in batches
  [PR #1402](https://github.com/kamilkisiela/graphql-inspector/pull/1402)
- **github** use `failure` instead of `action_required` - allows to call re-runs
- **github** reduce the number of GitHub API calls by batching file fetching calls
  [PR #1460](https://github.com/kamilkisiela/graphql-inspector/pull/1460)

### v1.30.4

- **github**: summary page with details (like in Github Action)
- **ci**: auto discovery of commands and loaders
- **ci**: fail on unknown command
- use version ranges for `@graphql-toolkit/*`
- **logger**: remove `jest` from dependencies

### v1.30.3

### v1.30.2

- **github**: bring back default export of `app`

### v1.30.1

- Support GraphQL v15
- New package: `@graphql-inspector/ci` - a lightweight version of CLI mostly for CI usage
- Modularized Commands for CLI. Each command is now a standalone package:
  - @graphql-inspector/commands (core package)
  - @graphql-inspector/coverage-command
  - @graphql-inspector/docs-command
  - @graphql-inspector/diff-command
  - @graphql-inspector/introspect-command
  - @graphql-inspector/similar-command
  - @graphql-inspector/serve-command
  - @graphql-inspector/validate-command
- Modularized Schema and Documents loading. Each loader is now a standalone package:
  - @graphql-inspector/loaders (core package)
  - @graphql-inspector/code-loader
  - @graphql-inspector/github-loader
  - @graphql-inspector/git-loader
  - @graphql-inspector/json-loader
  - @graphql-inspector/graphql-loader
  - @graphql-inspector/url-loader
- New package for internal usage: `@graphql-inspector/logger` and `@graphql-inspector/config`
- Rename package: `@graphql-inspector/action` (was `@graphql-inspector/actions`)
- **core**: introduce `removed` and `added` change types for description of Object Type (before it
  was showing all changes as `changed`)
- **github**, **action**: fix import of `chalk`
  [#1341](https://github.com/kamilkisiela/graphql-inspector/issues/1341)
- **github**, **action**: adjust annotations to show up in correct lines
  [#907](https://github.com/kamilkisiela/graphql-inspector/issues/907)
- **github**, **action**: fix an issue with `@actions/core` import
  [#1056](https://github.com/kamilkisiela/graphql-inspector/issues/1056)
- **action**: create integration test
- **cli**: fix an issue with empty descriptions when using URL pointer
  [#1378](https://github.com/kamilkisiela/graphql-inspector/issues/1378)

### v1.27.0

- **core** **cli**: introduce `keepClientFields` flag in `validate`
  [PR #783](https://github.com/kamilkisiela/graphql-inspector/pull/783)
- **core**: `UNION_MEMBER_ADDED` is no longer a breaking change but dangerous

### v1.26.0

-- **core**: add rule to ignore description changes
[PR #687](https://github.com/kamilkisiela/graphql-inspector/pull/687)
[@fabsrc](https://github.com/fabsrc) -- **cli**: custom rules from local fs
[PR #665](https://github.com/kamilkisiela/graphql-inspector/pull/665)
[@chunksnbits](https://github.com/chunksnbits)

### v1.25.0

- **action**: log more errors (in loadConfig)
  [PR #606](https://github.com/kamilkisiela/graphql-inspector/pull/606)
- **docker**: make the docker image suitable for CI and document usage
  [PR #633](https://github.com/kamilkisiela/graphql-inspector/pull/633)

### v1.24.0

- **load**: support `.graphqls` and `.gqls` extensions
  [PR #576](https://github.com/kamilkisiela/graphql-inspector/pull/576)
- **load**: include `graphql-tag-pluck`
  [PR #577](https://github.com/kamilkisiela/graphql-inspector/pull/577)
- **cli**:
  [available in Docker](https://cloud.docker.com/repository/docker/kamilkisiela/graphql-inspector)
  [PR #578](https://github.com/kamilkisiela/graphql-inspector/pull/578)
  [PR #518](https://github.com/kamilkisiela/graphql-inspector/pull/518)
- **load**: make git and github loaders accept introspection results file
  [PR #556](https://github.com/kamilkisiela/graphql-inspector/pull/556)

### v1.23.1

### v1.23.0

- **action**: fail on missing check
  [PR #504](https://github.com/kamilkisiela/graphql-inspector/pull/504)
- **cli**: Allow to supress removal of deprecated fields
  [PR #506](https://github.com/kamilkisiela/graphql-inspector/pull/506)
- **cli**: Support Apollo directives
  [PR #505](https://github.com/kamilkisiela/graphql-inspector/pull/505)

### v1.22.1

### v1.22.0

- **cli**: maximum depth of operations
  [PR #432](https://github.com/kamilkisiela/graphql-inspector/pull/432)
- **core**: maximum depth of operations
  [PR #432](https://github.com/kamilkisiela/graphql-inspector/pull/432)

### v1.21.0

- **load**: allow to load schema entirely based on `git`
  [PR #366](https://github.com/kamilkisiela/graphql-inspector/pull/366)
- **cli**: open up for every CI solution out there!
  [PR #366](https://github.com/kamilkisiela/graphql-inspector/pull/366)

### v1.20.0

- **core**: `strictFragments` and `strictDeprecated` falgs in `validate()`
  [PR #321](https://github.com/kamilkisiela/graphql-inspector/pull/321)
- **cli**: `noStrictFragments` flag
  [PR #321](https://github.com/kamilkisiela/graphql-inspector/pull/321)
- **core**: fix schema coverage by skipping `__typename`
  [PR #353](https://github.com/kamilkisiela/graphql-inspector/pull/353) - thanks to
  [@loremaps](http://github.com/loremaps)

### v1.19.0

- **core**: include Interfaces in schema coverage
  [PR #271](https://github.com/kamilkisiela/graphql-inspector/pull/271) - thanks to
  [@alx13](http://github.com/alx13)
- **cli**: add http headers [PR #281](https://github.com/kamilkisiela/graphql-inspector/pull/281)
- **cli**: support gql and graphqls files as an introspect output
  [PR #295](https://github.com/kamilkisiela/graphql-inspector/pull/295)

### v1.18.1

- **action**: show more details after file load failed
  [PR #223](https://github.com/kamilkisiela/graphql-inspector/pull/223)
- **github**: show more details after file load failed
  [PR #223](https://github.com/kamilkisiela/graphql-inspector/pull/223)

### v1.18.0

- **github**: load `.yaml` file too
  [PR #216](https://github.com/kamilkisiela/graphql-inspector/pull/216)

### v1.17.0

- **action**: Update Check Run instead of creating an extra one
  [PR #177](https://github.com/kamilkisiela/graphql-inspector/pull/177) - thanks to
  [@BeeeQueue](http://github.com/BeeeQueue)

- **core**: New optional argument or an optional input field is now treated as a dangerous change
  [PR #147](https://github.com/kamilkisiela/graphql-inspector/pull/147)

### v1.16.0

- **core**: Required field becoming nullable should be a non-breaking change
  [PR #139](https://github.com/kamilkisiela/graphql-inspector/pull/139) - thanks to
  [@filipncs](http://github.com/filipncs)

### v1.15.0

- **action**: No double check [PR #111](https://github.com/kamilkisiela/graphql-inspector/pull/111)
- **action**: Way more independent of the github package - uses `actions-toolkit` instead of
  `probot` [PR #111](https://github.com/kamilkisiela/graphql-inspector/pull/111)
- **github**: Fix location of a targeted entity
  [PR #104](https://github.com/kamilkisiela/graphql-inspector/pull/104)
- **github**: Support .github/graphql-inspector.yml config
  [PR #105](https://github.com/kamilkisiela/graphql-inspector/pull/105)
  [PR #109](https://github.com/kamilkisiela/graphql-inspector/pull/109)

### v1.14.0

- **core**: Fix how GraphQL Schema is fetched
  [PR #101](https://github.com/kamilkisiela/graphql-inspector/pull/101)
- **core**: Added diff support for arrays and objects (arguments)
  [PR #95](https://github.com/kamilkisiela/graphql-inspector/pull/95) - thanks to
  [@mkaradeniz](http://github.com/mkaradeniz)

### v0.13.3

- **load**: `graphql-toolkit` expects options to be a non-null value
  [PR #92](https://github.com/kamilkisiela/graphql-inspector/pull/92)
  [Issue #91](https://github.com/kamilkisiela/graphql-inspector/issues/91)

### v0.13.2

- **github**: annotation's `message` was empty
  [PR #87](https://github.com/kamilkisiela/graphql-inspector/pull/87)

### v0.13.1

- **cli**: bump `apollo-server@2.4.0`
  [PR #86](https://github.com/kamilkisiela/graphql-inspector/pull/86)

### v0.13.0

- **load**: use The Guild's `graphql-toolkit`
  [PR #77](https://github.com/kamilkisiela/graphql-inspector/pull/77)
- **cli**: pass `--token` to introspection
  [PR #77](https://github.com/kamilkisiela/graphql-inspector/pull/77)
- **cli**: pass `--token` to introspection command
  [PR #77](https://github.com/kamilkisiela/graphql-inspector/pull/77)

### v0.12.0

- Move `graphql` to peer dependencies
  [PR #70](https://github.com/kamilkisiela/graphql-inspector/pull/70)

### v0.11.0

- **cli**: Make `--require` accept multiple values `--require a --require b`
  [PR #67](https://github.com/kamilkisiela/graphql-inspector/pull/67)
- **cli**: Fix `--require` not loading modules
  [PR #67](https://github.com/kamilkisiela/graphql-inspector/pull/67)
- **github**: Use message as a title and reason as a message
  [PR #67](https://github.com/kamilkisiela/graphql-inspector/pull/67)

### v0.10.0

- **github**: Uses path as a title and includes a reason
  [PR #65](https://github.com/kamilkisiela/graphql-inspector/pull/65)

### v0.9.0

Initial release. We didn't track changes before this version.
