# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2023-09-27

### Added

- `submit()` and `validate()` methods are now exposed directly by `useForm()`;
- `ignoreUpdates()` and `stopUpdatesWatch()` methods are now exposed by `useForm()` and in `VvForm` component default slot scope;
- `VvForm` component `tag` prop;
- `invalid` ref is now exposed by `useForm()`;
- `readonly` prop in `VvForm` component;
- support for zod async refines with [`safeParseAsync()`](https://zod.dev/?id=safeparseasync).
- `VvFormTemplate` default slot scope for vvChildren;

### Changed

- `VvForm` prop `updateThrottle` is not used anymore, use `updateThrottle` option of `useForm()` instead;
- `submit()` and `validate()` methods of `VvForm` component now return a `Promise` of `boolean` instead of `boolean` directly.

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

- `continuosValidation` prop/option;
- Nested `VvFormField`.

## [0.0.3] - 2023-03-15

### Fixed

- Manage Zod `superRefine` validation.

### Added

- Continuos validation feature available with `continuosValidation` option.

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
