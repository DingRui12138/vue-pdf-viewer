<template>
  <IFrame :css="$options.viewerStyle" ref="iframe">
    <div class="viewer-container" ref="container">
      <div
        class="scroller catalog"
        ref="catalogScroller"
        :class="{
          visible: catalogVisible,
        }"
      >
        <div class="catalog-container">
          <div
            ref="catalogItem"
            v-for="page in pages"
            class="catalog-item"
            :key="page"
          >
            <div>
              <div
                ref="catalogItemContent"
                class="catalog-item__content"
                :class="activePage === page && 'active'"
                @click="handleSwitchPage(page)"
              >
                <RotateWrapper :src="imageList[page - 1]" :rotateDeg="rotate" />
              </div>
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
            ref="viewerItem"
            v-for="page in pages"
            :key="page"
            :style="viewerItemStyle"
            class="viewer-item"
          >
            <div :style="viewerStyle">
              <span class="placeholder"></span>
            </div>

            <!-- TODO: use rotate wrapper -->
            <!-- <RotateWrapper
              :src="viewerImageList[page - 1]"
              :rotateDeg="rotate"
              :style="viewerStyle"
              :duration="200"
            /> -->
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
import viewerStyle from '!!css-loader!!sass-loader!./Viewer.scss'
import getPageBlobList from './getPageBlobList.js'
import RotateWrapper from '../RotateWrapper/RotateWrapper.vue'
import rotateWrapperStyle from '!!css-loader!!sass-loader!../RotateWrapper/RotateWrapper.scss'

PDF.GlobalWorkerOptions.workerPort = new PDFWorker()

const MARGIN_OFFSET = 20
const NORMAL_RATIO = 2

const replacePlaceholder = (container, target) => {
  const placeholder = container.querySelector('.placeholder')

  placeholder.replaceWith(target)
}

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
  viewerStyle: viewerStyle.toString(),
  rotateWrapperStyle: rotateWrapperStyle.toString(),
  components: {
    IFrame,
    RotateWrapper,
  },
  data() {
    return {
      pdf: null,
      viewerContentHeight: 0,
      viewportHeight: 0,
      viewportWidth: 0,
      imageList: [],
      viewerImageList: [],
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
    this.$refs.iframe.appendStyle(this.$options.rotateWrapperStyle)
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
      this.$emit('update:isLoading', true)
    },
    endLoading() {
      this.$emit('update:isLoading', false)
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
        // const documentLoadingTask = PDF.getDocument({
        //   url: this.source,
        //   cMapPacked: true,
        //   cMapUrl: 'https://unpkg.com/browse/pdfjs-dist@2.2.228/cmaps/',
        // })
        documentLoadingTask.onPassword = (callback, reason) => {
          const retry = reason === PDF.PasswordResponses.INCORRECT_PASSWORD
          this.$emit('password-requested', {
            callback,
            retry,
          })
        }
        this.pdf = await documentLoadingTask.promise

        this.$emit('loaded', {
          total: this.pdf.numPages,
        })
      } catch (e) {
        this.pdf = null
        this.$emit('loading-failed', e)
      } finally {
        this.endLoading()
      }
    },
    async render() {
      if (!this.pdf) {
        return
      }
      try {
        this.$emit('update:isRendering', true)
        await this.$nextTick()

        const blobs = await getPageBlobList(this.pages, this.pdf)

        const getImage = blobData => {
          const image = document.createElement('img')
          image.className = 'placeholder'
          image.src = URL.createObjectURL(blobData.blob)

          return image
        }

        this.imageList = []
        const promiseList = blobs.map((blobData, idx) => {
          const image = getImage(blobData)
          this.imageList = [...this.imageList, image.src]
          // const catalogImg = image.cloneNode()
          // replacePlaceholder(this.$refs.catalogItemContent[idx], catalogImg)
          const viewerImg = image.cloneNode()
          this.viewerImageList = [...this.viewerImageList, viewerImg.src]
          replacePlaceholder(this.$refs.viewerItem[idx], viewerImg)

          // const catalogLoaded = new Promise(resolve => {
          //   catalogImg.onload = resolve
          // })
          const viewerLoaded = new Promise(resolve => {
            viewerImg.onload = resolve
          })

          return Promise.all([/*catalogLoaded, */ viewerLoaded])
        })

        await Promise.all(promiseList)

        this.$emit('rendered')
        this.$emit('update:isRendering', false)

        await this.$nextTick()
        this.viewerContentHeight = this.$refs.viewerContent.clientHeight
      } catch (e) {
        this.pdf = null
        this.$emit('rendering-failed', e)
      }
    },
    scrollToPage(page) {
      this.syncViewerOffset(page)
      this.syncCatalogOffset(page)
    },
    syncViewerOffset(page) {
      if (this.isScrolling) return
      this.$refs.viewerItem[page - 1].scrollIntoView()
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
