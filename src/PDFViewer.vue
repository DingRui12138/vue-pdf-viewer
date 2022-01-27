<template>
  <div class="pdf-viewer" @contextmenu="handlePreventDefault">
    <div class="pdf-viewer__header" :class="{ 'not-ready': !isReady }">
      <ViewerPageSelector
        :total="total"
        :page="page"
        :zoom="zoom"
        :controls="controls"
        :rotate="rotate"
        :isFullpage="isFullpage"
        :filename="filename"
        :isReady="isReady"
        @toggleFullpage="handleToggleFullpage"
        @update:page="v => (page = v)"
        @update:rotate="v => (rotate = v)"
        @update:zoom="handleUpdateZoom"
        @toggleCatalog="handleToggleCatalog"
        @print="handlePrint"
        @download="handleDownload"
      />
    </div>

    <div class="pdf-viewer__body">
      <div class="loading-mask" v-if="isLoading || isRendering">
        <slot name="loading">
          <div class="loading-content" v-if="isLoading">
            {{ loadingContent }}
          </div>
        </slot>
        <slot name="rendering">
          <div class="rendering-content" v-if="isRendering">
            {{ renderingContent }}
          </div>
        </slot>
      </div>
      <Viewer
        ref="viewer"
        :source="source"
        :page="page"
        :total="total"
        :zoom="zoom"
        :catalogVisible="catalogVisible"
        :rotate="rotate"
        :style="viewerStyle"
        :isFullpage="isFullpage"
        :filename="filename"
        @update:page="v => (page = v)"
        @update:zoom="handleUpdateZoom"
        @update:isLoading="handleUpdateLoadingState"
        @update:isRendering="handleUpdateRenderingState"
        @update:filename="v => (filename = v)"
        @password-requested="handlePasswordRequest"
        @loaded="handleLoaded"
        @loading-failed="handleLoadingFailed"
        @rendered="handleDocumentRender"
        @rendering-failed="handleRenderFailed"
      />
    </div>
  </div>
</template>

<script>
import controls, { CATALOG } from './constants/controls'
import './assets/iconfont/iconfont.css'
import Viewer from './components/Viewer/Viewer.vue'
import ViewerPageSelector from './components/ViewerPageSelector.vue'

export default {
  name: 'PDFViewer',
  props: {
    source: {
      type: String,
      required: true,
    },
    controls: {
      type: Array,
      default: () => {
        return controls
      },
    },
    loadingText: {
      type: String,
      default: 'Loading',
    },
    renderingText: {
      type: String,
      default: 'Rendering',
    },
    settings: {
      type: Object,
      default: () => ({}),
    },
  },
  components: {
    Viewer,
    ViewerPageSelector,
  },
  data() {
    return {
      isLoading: true,
      isRendering: false,
      page: 1,
      total: 1,
      catalogVisible: true,
      zoom: 100,
      rotate: 0,
      isFullpage: false,
      filename: '',
      seconds: 0,
    }
  },
  computed: {
    isReady() {
      return !this.isLoading && !this.isRendering
    },
    status() {
      return [this.isLoading, this.isRendering]
    },
    loadingContent() {
      return `${this.loadingText} ${this.dotText}`
    },
    renderingContent() {
      return `${this.renderingText} ${this.dotText}`
    },
    dotText() {
      const len = (this.seconds % 3) + 1
      const dot = '.'

      return dot.repeat(len)
    },
    viewerStyle() {
      return {
        visibility: this.isLoading ? 'hidden' : 'visible',
      }
    },
  },
  watch: {
    status: {
      handler(n) {
        const [isLoading, isRendering] = n
        const startTimer = () => {
          this._timer && clearInterval(this._timer)
          this.seconds = 0

          this._timer = setInterval(() => {
            this.seconds += 1
          }, 500)
        }

        if (isLoading) {
          if (this.$slots.loading) return
          startTimer()
        } else if (isRendering) {
          if (this.$slots.rendering) return
          startTimer()
        }
      },
    },
    deep: true,
  },
  mounted() {
    this.zoom = this.settings.defaultZoom || 100
    this.catalogVisible = this.controls.includes(CATALOG)
  },
  methods: {
    handleDownload() {
      this.$emit('download', {
        src: this.source,
        filename: this.filename,
      })
    },
    handlePrint() {
      this.$refs.viewer.printPDF()
    },
    handlePreventDefault(evt) {
      evt.preventDefault()
    },
    handleSwitchPage(page) {
      this.page = page
    },
    handleUpdateZoom(zoom) {
      this.zoom = zoom
    },
    handleToggleFullpage() {
      this.isFullpage = !this.isFullpage
    },
    handleToggleCatalog() {
      this.catalogVisible = !this.catalogVisible
    },

    handleLoaded(params) {
      const { total } = params

      this.total = total
      this.$emit('loaded', params)
      this.isLoading = false
    },
    handleDocumentRender() {
      this.$emit('rendered')
    },
    handleUpdateRenderingState(isRendering) {
      this.isRendering = isRendering
    },
    handleUpdateLoadingState(isLoading) {
      this.isLoading = isLoading
    },
    handlePasswordRequest({ callback, retry }) {
      // TODO: slot dialog ?
      callback(prompt(retry ? 'Enter password again' : 'Enter password'))
    },
    handleLoadingFailed(e) {
      this.$emit('loading-failed', e)
    },
    handleRenderFailed(e) {
      this.$emit('rendering-failed', e)
    },
    reload() {
      this.$refs.viewer.load()
    },
  },
}
</script>

<style lang="scss">
.icon-btn {
  width: 36px;
  height: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  transition: all 200ms ease;
  cursor: pointer;
  &:hover {
    background: #474545;
  }
}
.pdf-viewer {
  // css-var
  --iron-icon-height: 20px;
  --iron-icon-width: 20px;
  --viewer-icon-ink-color: rgb(189, 189, 189);
  --viewer-pdf-toolbar-background-color: rgb(50, 54, 57);
  --viewer-text-input-selection-color: rgba(255, 255, 255, 0.3);
  --viewer-pdf-toolbar-height: 56px;

  background-color: #ccc;
  height: 100%;
  // max-height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 500px;
  &__header {
    flex-grow: 0;
    flex-shrink: 0;
    align-items: center;
    background-color: var(--viewer-pdf-toolbar-background-color);
    color: white;
    display: flex;
    height: var(--viewer-pdf-toolbar-height);
    padding: 0 16px;
    box-shadow: 0px 3px 10px 2px black;
    z-index: 999;
    &.not-ready {
      position: relative;
      &::after {
        content: '';
        height: 100%;
        width: 100%;
        display: inline-block;
        position: absolute;
        z-index: 1;
      }
    }
  }

  &__body {
    height: calc(100% - 56px);
    width: 100%;
    overflow: hidden;
    position: relative;
    .loading-mask {
      position: absolute;
      z-index: 999;
      top: 0;
      left: 0;
      height: 100%;
      width: 100%;
      pointer-events: none;
      background: #a9a9a9;
      .loading-content,
      .rendering-content {
        height: 100%;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
      }
    }
  }
}
</style>
