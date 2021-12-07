<script>
import Vue from 'vue'
import style from '!!css-loader!!sass-loader!./iframe.scss'

export default {
  props: {
    css: String,
  },
  render(h) {
    return h('iframe', {
      on: { load: this.handleRenderChildren },
      style: { width: '100%', height: '100%', border: 'none' },
    })
  },

  beforeUpdate() {
    // freezing to prevent unnessessary Reactifiation of vNodes
    if (this.iApp) {
      this.iApp.children = Object.freeze(this.$slots.default)
    }
  },
  methods: {
    getContentWindow() {
      return this.$el.contentWindow
    },
    appendHead() {
      const metaList = [
        {
          'http-equiv': 'content-type',
          content: 'text/html; charset=UTF-8',
        },
        {
          name: 'referrer',
          content: 'no-referrer-when-downgrade',
        },
      ]

      metaList.forEach(meta => {
        const metaEl = document.createElement('META')

        Object.keys(meta).forEach(k => {
          metaEl[k] = meta[k]
        })

        this.$el.contentDocument.head.appendChild(metaEl)
      })
    },
    appendStyle(style) {
      const cssEl = document.createElement('STYLE')
      cssEl.textContent = style

      this.$el.contentDocument.head.appendChild(cssEl)
    },
    handleRenderChildren() {
      this.appendHead()
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

      const Constructor = Vue || window.Vue

      const iApp = new Constructor({
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
