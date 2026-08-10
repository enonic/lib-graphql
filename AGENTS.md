# Agent Instructions for GraphQL Library

This repository contains GraphQL Library for Enonic XP and its canonical developer documentation.

## Scope and Audience

GraphQL Library lets XP application developers define custom GraphQL schemas and execute operations against them. The primary audience is developers building server-side JavaScript applications on Enonic XP.

This is not Guillotine. Guillotine is Enonic's ready-made GraphQL API for CMS content; this library is a toolkit for constructing application-specific GraphQL APIs. Keep that distinction explicit in documentation, examples, and issue descriptions.

## Repository Structure

* `src/main/resources/lib/graphql.js` exposes scalar constants, schema construction, type wrappers, and execution.
* `src/main/resources/lib/graphql-connection.js` exposes cursor and connection helpers.
* `src/main/resources/lib/graphql-rx.js` exposes subscription publishers and subscribers.
* `src/main/java/` implements the Java-backed behavior used by the server-side JavaScript modules.
* `src/test/` contains Java and script-level tests.
* `docs/` contains the AsciiDoc source published to the Enonic developer portal.

## Documentation Guidelines

The documentation is reference material with a compact usage guide. It should be self-contained, precise, and useful to both developers and LLMs.

* **Keep docs and exports synchronized.** Any change to a public export, accepted parameter, return shape, or observable behavior must update `docs/api.adoc` in the same change.
* **Cover every public module.** The API reference includes `/lib/graphql`, `/lib/graphql-connection`, and `/lib/graphql-rx`.
* **No empty stubs.** Every page in `docs/menu.json` must contain substantive content.
* **Use tested behavior as the source of truth.** Resolve discrepancies by checking the JavaScript facade, Java implementation, and tests—not old README examples.
* **Separate concepts from reference.** Put the smallest end-to-end example in `docs/usage.adoc`; keep exhaustive signatures and data shapes in `docs/api.adoc`.
* **Release notes are newest first.** Add user-visible features, improvements, bug fixes, deprecations, and breaking changes to `docs/release.adoc`. Do not turn release notes into a commit log.
* **Explain compatibility.** State the required XP major version on the overview and release-notes pages when it changes.

### API reference conventions

* Organize APIs by their import path and use the exact exported JavaScript name.
* State whether arguments are positional or supplied through a single `params` object.
* Treat parameters as required unless their descriptions begin with **Optional.**
* Document return values and reusable object shapes, including resolver environments and execution results.
* Use flat, borderless tables. Do not use nested AsciiDoc tables or dotted property names as a substitute for documenting a shared type.
* Prefer examples that can be verified against script tests in `src/test/resources/lib/`.

### AsciiDoc conventions

* Add new reader-facing pages to `docs/menu.json`.
* Configure published branches in `docs/versions.json` and `.github/workflows/enonic-docgen.yml` together.
* Use relative cross-document links such as `<<api#,API reference>>`.
* Do not use the `^` suffix on links; readers should control whether a link opens in a new tab.
* Use source blocks with an explicit language.
* Outside source blocks, protect identifiers containing underscores with single-plus passthrough where AsciiDoc could interpret them as emphasis.
* Prefer one sentence per line where practical to keep reviews readable.

## Code Guidelines

* Public JavaScript modules run in the XP server-side runtime. Preserve their CommonJS API and do not introduce Node-only or browser-only APIs.
* Keep Java implementation details behind the JavaScript facade unless a returned Java-backed object is intentionally part of the public behavior.
* A `SchemaGenerator` retains resolver registrations and cached connection page-info state. Related types and their schema should be created with the same generator.
* Preserve GraphQL response semantics: execution can return both partial `data` and `errors`.
* Subscription changes must be tested through the JavaScript API, including publication, filtering, delivery, completion, and cancellation where applicable.

## Build and Validation

* `./gradlew build` compiles the library and runs the full verification lifecycle.
* `./gradlew test` runs the Java and script-backed tests.
* CI build and publication are configured in `.github/workflows/enonic-gradle.yml`.
* Developer-portal documentation publication is configured in `.github/workflows/enonic-docgen.yml`.

There is no committed local documentation renderer. Use an AsciiDoc-aware IDE preview for quick inspection and the documentation workflow for publication validation.

Before finishing a change, run the narrowest relevant tests and normally `./gradlew build`. For documentation-only changes, also validate `docs/menu.json` and `docs/versions.json`, inspect cross-references, and confirm documented exports against `src/main/resources/lib/`.
