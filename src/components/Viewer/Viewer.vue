<template>
  <IFrame :css="$options.style" ref="iframe">
    <div class="viewer-container" ref="container">
      <div
        class="scroller catalog"
        ref="catalogScroller"
        :class="{
          visible: catalogVisible,
        }"
      >
        <div class="catalog-content" ref="catalogContent">
          <div
            ref="catalogItem"
            v-for="page in pages"
            class="catalog-item"
            :key="page"
          >
            <div class="test" :style="thumbnailItemStyle">
              <canvas
                ref="catalogCanvas"
                class="canvas"
                :class="activePage === page && 'active'"
                :style="thumbnailStyle"
                @click="handleSwitchPage(page)"
              />
            </div>
            <div class="catalog-index">
              {{ page }}
            </div>
          </div>
        </div>
      </div>

      <div
        class="scroller viewer"
        ref="viewerScroller"
        @scroll="handleViewerScroll"
      >
        <div class="viewer-content" ref="viewerContent">
          <div
            v-for="page in pages"
            :key="page"
            class="viewer-item"
            :style="viewerItemStyle"
          >
            <canvas ref="viewerCanvas" class="canvas" :style="viewerStyle" />
          </div>
        </div>
      </div>
    </div>
  </IFrame>
</template>

<script>
import * as PDF from 'pdfjs-dist/es5/build/pdf.js'
import PDFWorker from 'pdfjs-dist/es5/build/pdf.worker.js'
import IFrame from '../IFrame/IFrame.vue'
import throttle from '../../utils/throttle'
import style from '!!css-loader!!sass-loader!./Viewer.scss'

PDF.GlobalWorkerOptions.workerPort = new PDFWorker()

const MARGIN_OFFSET = 20
const NORMAL_RATIO = 2

export default {
  name: 'Viewer',
  props: {
    page: Number,
    total: Number,
    zoom: Number,
    rotate: Number,
    catalogVisible: Boolean,
    isFullpage: Boolean,
    source: {
      type: [Object, String],
      required: true,
    },
  },
  style: style.toString(),
  components: {
    IFrame,
  },
  data() {
    return {
      document: null,
      viewerContentHeight: 0,
      viewportHeight: 0,
      viewportWidth: 0,
    }
  },
  computed: {
    isHorizontalViewer() {
      return (this.rotate / 90) % 2 === 1
    },
    activePage() {
      return this.page
    },
    pages() {
      return [...Array(this.total + 1).keys()].slice(1)
    },
    viewerStyle() {
      return {
        // height: `${this.zoom / NORMAL_RATIO}%`,
        width: `${(this.zoom / NORMAL_RATIO / 100) * this.viewportWidth}px`,
        transform: `rotate(${this.rotate}deg)`,
      }
    },
    viewerItemStyle() {
      return this.isHorizontalViewer
        ? {
            height: `${
              (this.zoom / NORMAL_RATIO / 100) * this.viewportWidth
            }px`,
          }
        : {}
    },
    thumbnailItemStyle() {
      return this.isHorizontalViewer
        ? {
            height: `${
              (this.zoom / NORMAL_RATIO / 100) * 300 // + 14 // catalog width: 300px; index height: 14px
            }px`,
          }
        : {}
    },
    thumbnailStyle() {
      return {
        transform: `rotate(${this.rotate}deg)`,
      }
    },
  },
  watch: {
    isFullpage(n, o) {
      if (n !== o && n) {
        this.updateZoomFullpage()
      }
    },
    viewerStyle: {
      deep: true,
      async handler() {
        await this.$nextTick()

        this.viewerContentHeight = this.$refs.viewerContent.clientHeight
      },
    },
    page(n, o) {
      if (n === o) return
      this.scrollToPage(n)
    },
    source: {
      immediate: true,
      async handler() {
        await this.load()
        this.render()
      },
    },
  },
  activated() {
    this.$nextTick(() => {
      this.handleResize()
    })
    this.render()
  },
  mounted() {
    // TODO: element resize replace window resize with Observe
    this.handleResize = throttle(() => {
      this.viewportHeight = this.$refs.container.clientHeight
      this.viewportWidth = this.$refs.viewerScroller.clientWidth
    }, 100)

    window.addEventListener('resize', this.handleResize)
    this.$nextTick(() => {
      this.handleResize()
    })
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    print() {
      const contentWindow = this.$refs.iframe.getContentWindow()

      contentWindow?.print()
    },
    updateZoomFullpage() {
      const perViewerHeight = this.viewerContentHeight / this.total
      const rate = this.viewportHeight / (perViewerHeight - MARGIN_OFFSET)

      this.$emit('update:zoom', this.zoom * rate)
      this.scrollToPage(this.page)
    },
    handleViewerScroll(evt) {
      this.isScrolling = true
      const yOffset = evt.target.scrollTop
      const perHeight = (this.viewerContentHeight + MARGIN_OFFSET) / this.total
      const halfViewportOffset = (perHeight - this.viewportHeight) / 2

      const currentPosition = (yOffset - halfViewportOffset) / perHeight + 1
      const delta = currentPosition - this.page

      let pageOffset = 0
      if (delta > 0.5) {
        pageOffset += 1
      } else if (delta < -0.5) {
        pageOffset -= 1
      }

      this.$emit('update:page', this.page + pageOffset)

      this.$nextTick(() => {
        this.isScrolling = false
      })
    },
    startLoading() {
      this.$emit('isLoading', true)
    },
    endLoading() {
      this.$emit('isLoading', false)
    },
    handleSwitchPage(page) {
      this.$emit('update:page', page)
    },
    async load() {
      if (!this.source) {
        return
      }
      this.startLoading()
      try {
        const filename = PDF.getFilenameFromUrl(this.source)
        this.$emit('update:filename', filename)

        const documentLoadingTask = PDF.getDocument(this.source)
        documentLoadingTask.onPassword = (callback, reason) => {
          const retry = reason === PDF.PasswordResponses.INCORRECT_PASSWORD
          this.$emit('password-requested', {
            callback,
            retry,
          })
        }
        this.document = await documentLoadingTask.promise

        this.$emit('loaded', {
          total: this.document.numPages,
        })
      } catch (e) {
        this.document = null
        this.$emit('loading-failed', e)
      } finally {
        this.endLoading()
      }
    },
    async render() {
      if (!this.document) {
        return
      }
      try {
        await this.$nextTick()

        await Promise.all(
          this.pages.map(async (pageNum, i) => {
            const page = await this.document.getPage(pageNum)
            const pageWidth = page.view[2]
            const containerWidth = this.$el.clientWidth
            const targetWidth = containerWidth * 0.9
            const scale = targetWidth / pageWidth
            // const scale = Math.ceil(this.$el.clientWidth / page.view[2]) + 1

            const viewport = page.getViewport({
              scale: scale,
            })
            // render viewer
            const viewerCanvas = this.$refs.viewerCanvas[i]
            viewerCanvas.width = viewport.width
            viewerCanvas.height = viewport.height

            const renderViewer = page.render({
              canvasContext: viewerCanvas.getContext('2d'),
              viewport,
            }).promise

            // render catalog
            const catalogScale = 110 / pageWidth
            const catalogViewport = page.getViewport({
              scale: catalogScale,
            })
            const catalogCanvas = this.$refs.catalogCanvas[i]
            catalogCanvas.width = catalogViewport.width
            catalogCanvas.height = catalogViewport.height

            const renderCatalog = page.render({
              canvasContext: catalogCanvas.getContext('2d'),
              viewport: catalogViewport,
            })
            await Promise.all([renderViewer, renderCatalog])
          })
        )
        this.$emit('rendered')

        await this.$nextTick()
        this.viewerContentHeight = this.$refs.viewerContent.clientHeight
      } catch (e) {
        this.document = null
        this.$emit('rendering-failed', e)
      }
    },
    scrollToPage(page) {
      this.syncViewerOffset(page)
      this.syncCatalogOffset(page)
    },
    syncViewerOffset(page) {
      if (this.isScrolling) return
      this.$refs.viewerCanvas[page - 1].scrollIntoView()
    },
    syncCatalogOffset(page) {
      const target = this.$refs.catalogItem[page - 1]

      target.scrollIntoView({
        block: 'nearest',
        // FIXME: scroll smooth failed sometimes. wtf?
        // behavior: 'smooth',
      })
    },
  },
}
</script>

<style lang="scss" scoped></style>
