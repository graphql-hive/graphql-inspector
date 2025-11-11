[![Inspector](https://user-images.githubusercontent.com/25294569/64163641-50cc9f80-ce4a-11e9-89b0-248c7d12142f.gif)](https://graphql-inspector.com/)

[![npm version](https://badge.fury.io/js/%40graphql-inspector%2Fcli.svg)](https://npmjs.com/package/@graphql-inspector/cli)
[![Docker Pulls](https://img.shields.io/docker/pulls/kamilkisiela/graphql-inspector)](https://hub.docker.com/r/kamilkisiela/graphql-inspector)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![renovate-app badge](https://img.shields.io/badge/renovate-app-blue.svg)](https://renovateapp.com/)
[![Discord Chat](https://img.shields.io/discord/625400653321076807)](https://discord.gg/xud7bH9)

**GraphQL Inspector** outputs a list of changes between two GraphQL schemas. Every change is
precisely explained and marked as breaking, non-breaking or dangerous. It helps you validate
documents and fragments against a schema and even find similar or duplicated types.

> You may like [GraphQL Hive](https://graphql-hive.com) as well!
>
> It's an open-source performance monitoring tool and schema registry for GraphQL.
>
> GraphQL Hive is currently available as a hosted service but it offers self-hosting as well.

Use GraphQL Inspector however you want:

- [**GitHub Application**](https://graphql-inspector.com/install)
- [**GitHub Action**](https://github.com/marketplace/actions/graphql-inspector)
- [**CLI**](https://graphql-inspector.com/docs/installation#cli)
- [**Programmatic API**](https://graphql-inspector.com/docs/installation#programmatic-api)

## Features

- **Compares schemas**
- **Detect breaking or dangerous changes**
- **Schema change notifications**
- **Use serverless functions validate changes**
- **Validates Operations and Fragments against a schema**
- **Finds similar / duplicated types**
- **Schema coverage based on Operations and Fragments**
- **Serves a GraphQL server with faked data and GraphiQL**
- **Docker Image**

## Use on GitHub

![Github](./website/public/assets/img/github/app-action.jpg)

## Use everywhere

![Example](./packages/cli/demo.gif)

## Installation and Usage

Visit our website [**graphql-inspector.com**](https://graphql-inspector.com/) to learn more about
the project.

## Documentation

Documentation is available at
[**graphql-inspector.com/docs**](https://www.graphql-inspector.com/docs).

## Related

Some part of the library was ported to NodeJS from
[Ruby's GraphQL Schema Comparator](https://github.com/xuorig/graphql-schema_comparator)

## Contributions

Contributions, issues and feature requests are very welcome. If you are using this package and fixed
a bug for yourself, please consider submitting a PR!

And if this is your first time contributing to this project, please do read our
[Contributor Workflow Guide](https://github.com/the-guild-org/Stack/blob/master/CONTRIBUTING.md)
before you get started off.

### Code of Conduct

Help us keep GraphQL Inspector open and inclusive. Please read and follow our
[Code of Conduct](https://github.com/the-guild-org/Stack/blob/master/CODE_OF_CONDUCT.md) as adopted
from [Contributor Covenant](https://www.contributor-covenant.org/)

## License

[MIT](https://github.com/graphql-hive/graphql-inspector/blob/master/LICENSE) © Kamil Kisiela
