# VvFormField

## Prop type in detail

```typescript
export enum FormFieldType {
	text = 'text',
	number = 'number',
	email = 'email',
	password = 'password',
	tel = 'tel',
	url = 'url',
	search = 'search',
	date = 'date',
	time = 'time',
	datetimeLocal = 'datetimeLocal',
	month = 'month',
	week = 'week',
	color = 'color',
	select = 'select',
	checkbox = 'checkbox',
	radio = 'radio',
	textarea = 'textarea',
	radioGroup = 'radioGroup',
	checkboxGroup = 'checkboxGroup',
	combobox = 'combobox',
	custom = 'custom',
}

```

## Map type with ui-vue component
    
```typescript
switch (props.type) {
    case FormFieldType.select:
        component = resolveComponent('VvSelect')
        break
    case FormFieldType.checkbox:
        component = resolveComponent('VvCheckbox')
        break
    case FormFieldType.radio:
        component = resolveComponent('VvRadio')
        break
    case FormFieldType.textarea:
        component = resolveComponent('VvTextarea')
        break
    case FormFieldType.radioGroup:
        component = resolveComponent('VvRadioGroup')
        break
    case FormFieldType.checkboxGroup:
        component = resolveComponent('VvCheckboxGroup')
        break
    case FormFieldType.combobox:
        component = resolveComponent('VvCombobox')
        break
    default:
        component = resolveComponent('VvInputText')
}
```

