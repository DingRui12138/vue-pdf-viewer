<script>
import Vue from 'vue'
import style from '!!css-loader!!sass-loader!./iframe.scss'

export default {
  props: {
    css: String,
  },
  render(h) {
    return h('iframe', {
      on: { load: this.renderChildren },
      style: { width: '100%', height: '100%', border: 'none' },
    })
  },

  beforeUpdate() {
    // freezing to prevent unnessessary Reactifiation of vNodes
    this.iApp.children = Object.freeze(this.$slots.default)
  },
  methods: {
    getContentWindow() {
      return this.$el.contentWindow
    },
    appendStyle(style) {
      const cssEl = document.createElement('STYLE')
      cssEl.textContent = style
      this.$el.contentDocument.head.appendChild(cssEl)
    },
    renderChildren() {
      // inject iframe styles
      this.appendStyle(style)
      if (this.css) {
        // inject component style
        this.appendStyle(this.css)
      }

      const children = this.$slots.default
      const body = this.$el.contentDocument.body
      const el = document.createElement('DIV') // we will mount or nested app to this element
      body.appendChild(el)

      const iApp = new Vue({
        name: 'iApp',
        // freezing to prevent unnessessary Reactifiation of vNodes
        data: { children: Object.freeze(children) },
        render(h) {
          return h('div', this.children)
        },
      })

      iApp.$mount(el) // mount into iframe

      this.iApp = iApp // cache instance for later updates
    },
  },
}
</script>
