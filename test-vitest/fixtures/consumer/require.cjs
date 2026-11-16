// Run by `package.test.ts` with Node, as a CommonJS consumer: `require()` has to return
// the package exports. It used to load the UMD build as an ES module, which exported
// nothing and assigned the library to `globalThis['@volverjs/form-vue']` instead.
const process = require('node:process')
const formVue = require('@volverjs/form-vue')

process.stdout.write(JSON.stringify({
    exports: Object.keys(formVue).sort(),
    global: typeof globalThis['@volverjs/form-vue'],
}))
