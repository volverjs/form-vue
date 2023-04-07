# Changelog

All notable changes to this project will be documented in this file.

## [0.0.10] - 2023-04-07

### Fixed

- `VvFormWrapper` default slot `formData` and `errors` properties;
- `defaultObjectBySchema` support for nested `ZodEffects`.

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

[0.0.9]: https://github.com/volverjs/form-vue/compare/v0.0.5...v0.0.9
[0.0.5]: https://github.com/volverjs/form-vue/compare/v0.0.4...v0.0.5
[0.0.4]: https://github.com/volverjs/form-vue/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/volverjs/form-vue/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/volverjs/form-vue/compare/v0.0.1...v0.0.2
