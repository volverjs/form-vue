# Changelog

All notable changes to this project will be documented in this file.

## [1.1.6] - 2026-09-17

### Fixed

- The ad-hoc `superRefine` is now actually applied. It was accepted as a `VvForm` prop and as an option of `validate()` and `submit()`, and documented as working, but `validate()` only ever read `options.fields` and parsed against the bare schema, so the refinement never ran. Only a `.superRefine()` declared on the schema itself had any effect. The refined schema is cached per refinement function, because rebuilding it discards the parser Zod compiled for it (measured at roughly 8x per parse, which continuous validation pays on every throttled update).
- The `superRefine` prop now reaches every entry point that validates the form. It was forwarded only by the native submit and by the continuous-validation watcher, so calling the exposed `validate()`, the one passed to the default slot, the injected one, or `VvFormWrapper.validateWrapper()` silently validated without the refinement. An explicit `superRefine` argument still wins over the prop.
- `validate()` with `validateFields` no longer leaves the form invalid when none of the parse issues belongs to the requested fields. It cleared the errors and returned `true` while `status` stayed `invalid`, so the `invalid` computed stayed `true`. `status` is now `unknown`, so no event is emitted for a partial pass and the `invalid` computed is `false`. Consumers that listen for the `invalid` event will no longer receive it in that case.
- The `submit` passed to the default slot now honours the `superRefine` and `validateFields` props, like the native submit already did. It used to bypass both.

### Changed

- Zod 3 is now supported without importing it. `zod/v3` was imported at the top of `src/utils.ts` for a single `ZodError` constructor, so every consumer pulled the Zod 3 runtime into its bundle, and the CJS and UMD builds hard-required the `zod/v3` subpath — `dist/index.umd.js` ran `require("zod/v3")` at load time and asked for a `zodV3` global that a Zod 4 consumer does not have. The class is now read off the error instance the parse already produced. Formatted error trees are unchanged, and a test asserts that neither built bundle references `zod/v3`.
- The internal `formatIssues()` helper takes the parse error as its second argument. It is not part of the package entry point, but `package.json` exposes `./src/*`, so a deep import of `@volverjs/form-vue/src/utils` would need updating.
- Updated dev dependency `zod` (`^4.4.3` → `^4.6.5`).

### Documentation

- A cross-field refinement does not run when a field failed its **type** check, on both Zod 3 and Zod 4: a type error aborts the parse of that field and Zod skips the object-level checks. It does run after a plain check failure such as `min()`. Documented in the README and in the agent skill.

## [1.1.5] - 2026-06-26

### Fixed

- `VvForm` now reliably emits the `reset` event (and runs `onReset`). Resetting the form mutated `formData`, which on a leading edge could re-trigger the throttled updates watcher and overwrite `status = reset` with `status = updated` before the event was emitted — a timing-sensitive race. The form-data reset is now wrapped in `ignoreUpdates`, so the `reset` status and event are preserved.

### Changed

- Updated dev dependencies, including `@volverjs/ui-vue` (`^0.0.12` → `^0.0.15`), Vue (`3.5.38` → `3.5.39`), `vite` (`8.0.16` → `8.1.0`) and `pnpm` (`11.7.0` → `11.9.0`).

### Added

- `volverjs-form-vue` agent skill (under `skills/`) documenting the library's API for AI coding assistants (not published to npm).

## [1.1.4] - 2026-06-16

### Fixed

- TypeScript declarations are now emitted at the `dist` root (`dist/index.d.ts`) instead of `dist/src/index.d.ts`, so the `types` entry in `package.json` resolves correctly. Consumers no longer get "Could not find a declaration file for module '@volverjs/form-vue'" (regression in `1.1.3`).

## [1.1.3] - 2026-06-15

### Added

- `defaultObjectByJSONSchema()` is now exported from the package entry point.

### Changed

- `defaultObjectBySchema()` refactored to share a single implementation between Zod v3 and v4 through an internal adapter (no behavior change), removing ~150 lines of duplicated logic.

### Fixed

- Exported `FormTemplateComponent` type now correctly references `VvFormTemplate` instead of `VvFormFieldsGroup`.
- `VvForm` external `modelValue` updates now go through the form data adapter, consistently applying schema defaults and the `class` option as on initialization (previously plain-cloned, bypassing the adapter).
- `pnpm run type-check` now passes: added ambient module declarations for `*.vue` and `@volverjs/style`.

## [1.1.2] - 2025-12-22

### Added

- `defaultObjectByJSONSchema()` support for `oneOf`, `allOf`, `const`;
- `defaultObjectByJSONSchema()` support for `type` as array (e.g. `["string", "null"]`);
- `defaultObjectByJSONSchema()` guard for empty `anyOf`/`oneOf` arrays;

### Fixed

- `defaultObjectByJSONSchema()` array without `items` now preserves `original` value instead of falling back to `schema.default`;
- `defaultObjectBySchema()` array with empty `[]` value now correctly preserved instead of being replaced with `defaultValue`;
- `defaultObjectBySchema()` array element type non-object now preserved correctly;
- `defaultObjectBySchema()` record with non-object `valueType` now preserves `originalValue` instead of being discarded;
- `defaultObjectBySchema()` `safeParse` no longer called when `originalValue` is `undefined`, avoiding unintended coercion;
- `VvFormFieldsGroup` `invalids` computed now correctly references `namesMap` instead of `namesKeysMap`;
- Dependencies update.

## [1.1.1] - 2025-09-23

### Fixed

- `ts-dot-prop` is no longer maintained, replaced with `dot-props`.
- `@volverjs/ui-vue` peer dependency updated to `^0.0.10`.

## [1.1.0] - 2025-09-16

### Added

- Support for Zod 4 from `zod@3.25.x` and `zod@4.x.x`.

### Fixed

- `VvFormFieldGroup` initial value;

## [1.0.0] - 2025-07-21

### Added

- `submit()` and `validate()` methods are now exposed directly by `useForm()`;
- `ignoreUpdates()` and `stopUpdatesWatch()` methods are now exposed by `useForm()` and in `VvForm` component default slot scope;
- `VvForm` component `tag` prop;
- `invalid` ref is now exposed by `useForm()`;
- `readonly` prop in `VvForm` component;
- `readonly` prop in `VvFormWrapper` component;
- Support for zod async refines with [`safeParseAsync()`](https://zod.dev/?id=safeparseasync).
- `VvFormTemplate` default slot scope for vvChildren;
- `reset()` method to `VvForm` component and `useForm()` to reset form values;
- `clear()` method to `VvForm` component and `useForm()` to clear errors;
- `VvFormWrapper` component `validateWrapper()` method for partial validation;
- `VvFormFieldsGroup` component for grouping fields;
- Custom form object constructor with `class` option in `useForm()` and `createForm()`;
- Expose `wrappers` Map in `useForm()` and `createForm()` to manage form wrappers;
- Singleton form with `scope` option in `useForm()` and `createForm()`.

### Changed

- `VvForm` prop `updateThrottle` is not available anymore, use `updateThrottle` option of `useForm()` instead;
- `submit()` and `validate()` methods of `VvForm` component now return a `Promise` of `boolean` instead of `boolean` directly;
- `continuos-validation` option is now `continuous-validation`.

## [0.0.14] - 2023-08-03

### Added

- Pass default slot to `VvFormTemplate` component from `VvForm` component with `template` prop;
- Expose type `FormSchema`;
- `template` prop to `VvForm` component;
- `template` option to `createForm()` and `useForm()` functions;
- Replace `vue-tsc` with `vite-plugin-dts` for types generation.

### Fixed

- `defaultObjectBySchema()` improved support for `ZodDefault` and `ZodArray`;
- Dependencies update.

## [0.0.13] - 2023-05-19

### Fixed

- `VvFormTemplate` and `VvFormField` support for `ref()` props;
- `VvFormField` datetime correct type is `datetime-local`.

### Added

- `@volverjs/ui-vue` to `v0.0.8-beta.4` and added to peerDependencies

## [0.0.12] - 2023-05-16

### Fixed

- `defaultObjectBySchema()` support for nested `ZodOptional`;

## [0.0.11] - 2023-05-16

### Fixed

- `VvFormField` type `select`

## [0.0.10] - 2023-05-03

### Fixed

- `VvForm` bug with emit update on zod parsed result;
- `defaultObjectBySchema()` support for nested `ZodEffects`;
- `defaultObjectBySchema()` safe parse of `ZodEffects`;
- `formFactory()` deprecated, use `useForm()` instead;
- Experimental components slots types;
- Typescript improvements.

### Added

- `validate()` method is now exposed by `VvForm` component;
- Add `formData` and `errors` to `VvFormWrapper` default slot scope;
- Add `validate()` and `submit()` to `VvFormWrapper` and `VvFormField` default slot scope;
- `VvFormTemplate` component for template based forms;
- `formFactory()` now export `errors`, `status` and `formData`;

## [0.0.9] - 2023-03-23

### Added

- Test: VvForm, VvFormWrapper, VvFormField

## [0.0.5] - 2023-03-17

### Fixed

- `defaultObjectBySchema` original value handling and validation;
- Dependency update;
- tsconfig.json new property `verbatimModuleSyntax` replaces `isolatedModules`, `preserveValueImports` and `importsNotUsedAsValues`.

### Added

- `defaultObjectBySchema` tests.

## [0.0.4] - 2023-03-16

### Doc

Update docs with:

- `continuousValidation` prop/option;
- Nested `VvFormField`.

## [0.0.3] - 2023-03-15

### Fixed

- Manage Zod `superRefine` validation.

### Added

- Continuous validation feature available with `continuousValidation` option.

## [0.0.2] - 2023-03-10

### Fixed

- Remove of unused dependencies.

### Added

- Types of components.

## 0.0.1 - 2023-03-09

### Added

- `createForm` function to create a Vue 3 plugin for a set of globally defined options and components.
- `useForm` function to create a form from a Zod schema inside a component.
- `formFactory` function to create a form from a Zod schema outside of a component.
- README, CHANGELOG and LICENSE files.

[1.1.5]: https://github.com/volverjs/form-vue/compare/v1.1.4...v1.1.5
[1.1.4]: https://github.com/volverjs/form-vue/compare/v1.1.3...v1.1.4
[1.1.3]: https://github.com/volverjs/form-vue/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/volverjs/form-vue/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/volverjs/form-vue/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/volverjs/form-vue/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/volverjs/form-vue/compare/v0.0.14...v1.0.0
[0.0.14]: https://github.com/volverjs/form-vue/compare/v0.0.13...v0.0.14
[0.0.13]: https://github.com/volverjs/form-vue/compare/v0.0.12...v0.0.13
[0.0.12]: https://github.com/volverjs/form-vue/compare/v0.0.11...v0.0.12
[0.0.11]: https://github.com/volverjs/form-vue/compare/v0.0.10...v0.0.11
[0.0.10]: https://github.com/volverjs/form-vue/compare/v0.0.9...v0.0.10
[0.0.9]: https://github.com/volverjs/form-vue/compare/v0.0.5...v0.0.9
[0.0.5]: https://github.com/volverjs/form-vue/compare/v0.0.4...v0.0.5
[0.0.4]: https://github.com/volverjs/form-vue/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/volverjs/form-vue/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/volverjs/form-vue/compare/v0.0.1...v0.0.2
