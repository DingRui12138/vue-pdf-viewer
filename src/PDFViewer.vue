<template>
  <div class="pdf-viewer" @contextmenu="handlePreventDefault">
    <div class="pdf-viewer__header">
      <ViewerPageSelector
        :total="total"
        :page.sync="page"
        :zoom="zoom"
        :controls="controls"
        :rotate.sync="rotate"
        :isFullpage="isFullpage"
        :filename="filename"
        @toggleFullpage="handleToggleFullpage"
        @update:zoom="handleUpdateZoom"
        @toggleCatalog="handleToggleCatalog"
        @print="handlePrint"
        @download="handleDownload"
      />
    </div>

    <div class="pdf-viewer__body">
      <div class="loading-mask" v-if="isLoading">
        <slot name="loading">
          <div class="loading-content">Loading {{dotText}}</div>
        </slot>
      </div>
      <Viewer
        ref="viewer"
        :source="source"
        :page.sync="page"
        :total="total"
        :zoom="zoom"
        :catalogVisible="catalogVisible"
        :rotate="rotate"
        :style="viewerStyle"
        :isFullpage="isFullpage"
        :filename.sync="filename"
        @update:zoom="handleUpdateZoom"
        @update:isLoading="handleUpdateLoadingState"
        @password-requested="handlePasswordRequest"
        @loaded="handleLoaded"
        @loading-failed="handleLoadingFailed"
        @rendered="handleDocumentRender"
      />
    </div>
  </div>
</template>

<script>
import './assets/iconfont/iconfont.css'
import Viewer from './components/Viewer/Viewer.vue'
// import Viewer from './Viewer.vue'
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
        return [
          'download',
          'print',
          'double',
          'fullscreen',
          'abort',
          'fullpage',
          'rotate',
          'zoom',
          'catalog',
          'switchPage',
        ]
      },
    },
  },
  components: {
    Viewer,
    ViewerPageSelector,
  },
  data() {
    return {
      isLoading: true,
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
    dotText() {
      const len = this.seconds % 3 + 1
      const dot = '.'

      return dot.repeat(len)
    },
    viewerStyle() {
      return {
        visibility: this.isLoading ? 'hidden' : 'visible',
      }
    },
  },
  methods: {
    handleDownload() {
      this.$emit('download', this.source)
    },
    handlePrint() {
      this.$refs.viewer.print()
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
    },
    handleDocumentRender() {
      this.isLoading = false
      this.$emit('rendered')
    },
    handleUpdateLoadingState(isLoading) {
      this.isLoading = isLoading
      
      if (this.$slots.loading) return
      this._timer && clearInterval(this._timer)
      if (isLoading) {
        this.seconds = 0
        this._timer = setInterval(() => {
          this.seconds += 1
        }, 500)
      }
    },
    handlePasswordRequest({ callback, retry }) {
      // TODO: slot dialog ?
      callback(prompt(retry ? 'Enter password again' : 'Enter password'))
    },
    handleLoadingFailed(e) {
      this.$emit('loading-failed', e)
    },
    reload() {
      this.$refs.viewer.load()
    },
  },
}
</script>

<style lang="scss" scoped>
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
      .loading-content {
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
