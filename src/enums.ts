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
    datetimeLocal = 'datetime-local',
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

export enum FormStatus {
    invalid = 'invalid',
    valid = 'valid',
    submitting = 'submitting',
    reset = 'reset',
    updated = 'updated',
    unknown = 'unknown',
}
