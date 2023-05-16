# Changelog

All notable changes to this project will be documented in this file.

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

[0.0.12]: https://github.com/volverjs/form-vue/compare/v0.0.11...v0.0.12
[0.0.11]: https://github.com/volverjs/form-vue/compare/v0.0.10...v0.0.11
[0.0.10]: https://github.com/volverjs/form-vue/compare/v0.0.9...v0.0.10
[0.0.9]: https://github.com/volverjs/form-vue/compare/v0.0.5...v0.0.9
[0.0.5]: https://github.com/volverjs/form-vue/compare/v0.0.4...v0.0.5
[0.0.4]: https://github.com/volverjs/form-vue/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/volverjs/form-vue/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/volverjs/form-vue/compare/v0.0.1...v0.0.2
