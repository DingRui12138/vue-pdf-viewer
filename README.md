# 📄 pdf-viewer-vue

PDF viewer component for Vue 2 and Vue 3

[![npm](https://img.shields.io/npm/v/pdf-viewer-vue)](https://npmjs.com/package/pdf-viewer-vue) [![npm](https://img.shields.io/npm/dw/pdf-viewer-vue)](https://npmjs.com/package/pdf-viewer-vue) [![Github Repo stars](https://img.shields.io/github/stars/DingRui12138/vue-pdf-viewer)](https://github.com/DingRui12138/vue-pdf-viewer) [![npm](https://img.shields.io/npm/l/pdf-viewer-vue)](https://github.com/DingRui12138/vue-pdf-viewer/blob/master/LICENSE)

## Compatibility

This package is compatible with both Vue 2 and Vue 3. The default exported build is for Vue 3, but `dist` directory also contains a build for Vue 2 (`dist/vue2-pdf-viewer.js`). See the example in [Usage](#usage) section.

## Installation

Depending on the environment, the package can be installed in one of the following ways:

```shell

npm install pdf-viewer-vue

```

```shell

yarn add pdf-viewer-vue

```

```html
<script src="https://unpkg.com/pdf-viewer-vue"></script>
```

## Usage

```vue
<template>
  <div>
    <h1>File</h1>

    <PDFViewer
      :source="url"
      style="height: 100vh; width: 100vw"
      @download="handleDownload"
    />

    <h1>Base64</h1>

    <PDFViewer
      :source="base64"
      style="height: 100vh; width: 100vw"
      @download="handleDownload"
    />
  </div>
</template>

<script>
import PDFViewer from 'pdf-viewer-vue'

// OR THE FOLLOWING IMPORT FOR VUE 2
// import PDFViewer from 'pdf-viewer-vue/dist/vue2-pdf-viewer'

export default {
  components: {
    PDFViewer,
  },

  data() {
    return {
      url: '<PDF_URL>',
      base64: '<BASE64_ENCODED_PDF>',
    }
  },
}
</script>
```

### Props

| Name           | Type                      | Accepted values                                                                                                 | Description        |
| -------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------ |
| source         | `string`                  | document `URL` or `Base64`                                                                                      | source of document |
| controls       | `string[]`                | `[`<br/>`'download',`<br/>`'print',`<br/>`'rotate',`<br/>`'zoom',`<br/>`'catalog',`<br/>`'switchPage',`<br/>`]` | visible controls   |
| loading-text   | `string`                  | -                                                                                                               | loading text       |
| rendering-text | `string`                  | -                                                                                                               | rendering text     |
| settings       | `{ defaultZoom: number }` | -                                                                                                               | default settings   |

### Events

| Name             | Value                                 | Description                     |
| ---------------- | ------------------------------------- | ------------------------------- |
| download         | `{source: string; filename: string;}` | pdf file base info              |
| loaded           | `{total: number}`                     | document load completed         |
| loading-failed   | `Error`                               | failed to load document         |
| rendered         | -                                     | finished rendering the document |
| rendering-failed | `Error`                               | failed to render document       |

## Examples

```
TODO: CodeSandbox or JSFiddle
```

## License

MIT License. Please see [LICENSE file](LICENSE) for more information.
