# Volver Form Skill for Claude Code

Agent skill that helps Claude Code build Vue 3 forms with [@volverjs/form-vue](https://github.com/volverjs/form-vue), the library that turns a [Zod](https://zod.dev) object schema into a validated form rendered with [@volverjs/ui-vue](https://github.com/volverjs/ui-vue) components.

## Installation

```bash
npx skills add volverjs/form-vue
```

This adds the skill to your Claude Code configuration.

## What This Skill Covers

The skill is specialized for real `@volverjs/form-vue` implementation patterns:

- **Setup**: the plugin (`createForm()`) vs the composable (`useForm()`), shared default options, and the inheritance between them.
- **`VvForm`**: the `<form>` wrapper — `v-model` data binding (throttled), `v-model:readonly`, the `submit`/`valid`/`invalid`/`reset` events, programmatic `submit()`/`validate()`/`reset()`/`clear()`, and the default slot scope.
- **`VvFormField`**: binding a field by `name` (dot notation), the built-in `type` → `@volverjs/ui-vue` input mapping, custom components via `:is`, fully custom markup via the default slot (`modelValue`/`onUpdate`/`invalid`/`invalidLabel`), and nested fields for group validation.
- **`VvFormFieldsGroup`**: binding several fields at once via `names` (array or `{ vModel: 'path' }` map) and custom group components.
- **`VvFormWrapper`**: section-level aggregated validation state, nestable into a validation tree, and the `wrappers` map.
- **`VvFormTemplate`**: declarative, schema-driven forms — `vvName`/`vvType`/`vvChildren`/`vvIf`/`vvElseIf`/`vvSlots`, conditional rendering, and function items.
- **Validation**: Zod 3 (3.25+) and Zod 4 support, cross-field rules with `superRefine`, continuous vs on-submit validation, `FormStatus`, and the formatted error shape.
- **Defaults**: `defaultObjectBySchema` and `defaultObjectByJSONSchema` to seed populated forms.

## Usage

Once installed, Claude Code should automatically use this skill when you ask to:

- Build a Vue 3 form from a Zod schema (login, signup, settings, profile…).
- Render fields with `VvFormField`, group them, or section them with `VvFormWrapper`.
- Generate a form declaratively with a `VvFormTemplate` schema.
- Add conditional fields, nested objects, or cross-field validation.
- Submit/validate/reset a form programmatically, or seed it with default values.

### Example Prompts

```text
Build a signup form with @volverjs/form-vue from a Zod schema (email, password, confirm password) and validate on submit.
```

```text
Add a VvFormField for an address with nested street/city/zip using dot-notation names.
```

```text
Render this form from a VvFormTemplate: show a "username" field only when the "hasUsername" checkbox is checked, otherwise show "email".
```

```text
Make the form validate continuously as the user types, and show per-field error messages.
```

```text
Seed this form's v-model with defaults from the Zod schema so it starts populated.
```

```text
Wrap the contact fields in a VvFormWrapper and show a section-level error when any of them is invalid.
```

## Source of Truth

When coding, verify implementation details directly from the library source:

- `src/index.ts` — `createForm`, `useForm`, exports, the form context
- `src/VvForm.ts` — props, events, exposed methods, validation/submit flow
- `src/VvFormField.ts` — field binding, `type`/`is` rendering, slot scope
- `src/VvFormFieldsGroup.ts` — multi-field binding
- `src/VvFormWrapper.ts` — aggregated wrapper validation
- `src/VvFormTemplate.ts` — template item rendering
- `src/utils.ts` — `defaultObjectBySchema`, `defaultObjectByJSONSchema`, Zod 3/4 detection
- `src/enums.ts` — `FormFieldType`, `FormStatus`

## Documentation

- [Volver Form Repository](https://github.com/volverjs/form-vue)
- [Skill Specification](./SKILL.md)
- [Zod](https://zod.dev) and [@volverjs/ui-vue](https://github.com/volverjs/ui-vue) (underlying libraries)

## License

MIT
