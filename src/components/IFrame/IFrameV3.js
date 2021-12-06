import { createVNode, ref, createApp, onMounted, onBeforeUpdate } from 'vue'
import style from '!!css-loader!!sass-loader!./iframe.scss'

export default {
  name: 'IFrame',
  props: {
    css: {
      type: String,
      default: '',
    },
  },
  setup(props, { slots, expose }) {
    const iframeRef = ref(null)
    const iframeBody = ref(null)
    const iframeHead = ref(null)
    const iframeStyle = ref(null)
    let iframeApp = null

    const appendStyle = style => {
      const cssEl = document.createElement('STYLE')
      cssEl.textContent = style

      iframeHead.value.appendChild(cssEl)

      return cssEl
    }

    const getContentWindow = () => {
      return iframeRef.value.contentWindow
    }

    expose({
      appendStyle,
      getContentWindow,
    })

    onMounted(() => {
      iframeBody.value = iframeRef.value.contentDocument.body
      iframeHead.value = iframeRef.value.contentDocument.head
      const el = document.createElement('div')
      iframeBody.value.appendChild(el)
      appendStyle(style)
      if (props.css) {
        iframeStyle.value = appendStyle(props.css)
      }

      iframeApp = createApp({
        name: 'iApp',
        setup() {
          return () => slots.default()
        },
      }).mount(el)
    })
    onBeforeUpdate(() => {
      if (!iframeApp || !iframeRef.value) {
        return
      }
      if (props.css) {
        iframeStyle.value.innerHTML = props.css
      }
    })
    return () =>
      createVNode('iframe', {
        ref: iframeRef,
        style: { width: '100%', height: '100%', border: 'none' },
      })
  },
}
