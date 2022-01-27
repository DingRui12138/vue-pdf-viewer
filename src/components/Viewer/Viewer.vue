<template>
  <CompIFrame :css="$options.viewerStyle" ref="iframe">
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
            :ref="`catalogItem_${idx}`"
            v-for="(image, idx) in imageList"
            class="catalog-item"
            :key="idx"
          >
            <div>
              <div
                ref="catalogItemContent"
                class="catalog-item__content"
                :class="activePage === idx + 1 && 'active'"
                @click="handleSwitchPage(idx + 1)"
              >
                <RotateWrapper :src="image" :rotateDeg="rotate" />
              </div>
            </div>
            <div class="catalog-index">
              {{ idx + 1 }}
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
            :ref="`viewerItem_${idx}`"
            v-for="(page, idx) in pages"
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
  </CompIFrame>
</template>

<script>
import * as Vue from 'vue'
import * as PDF from 'pdfjs-dist/legacy/build/pdf.js'
import PDFWorker from 'pdfjs-dist/legacy/build/pdf.worker.js'
import IFrameV3 from '../IFrame/IFrameV3'
import IFrame from '../IFrame/IFrame.vue'
import throttle from '../../utils/throttle'
import viewerStyle from '!!css-loader!!sass-loader!./Viewer.scss'
import getPageBlobList from './getPageBlobList.js'
import RotateWrapper from '../RotateWrapper/RotateWrapper.vue'
import rotateWrapperStyle from '!!css-loader!!sass-loader!../RotateWrapper/RotateWrapper.scss'

/**
 * vue version > 3.0 has version property
 */
const version =
  (Vue && (Vue.defalut ? Vue.defalut.version : Vue.version)) ||
  (window.Vue && window.Vue.version) ||
  '2.x'
const VUE_VERSION = Number(version.split('.')[0])
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
    CompIFrame: VUE_VERSION === 3 ? IFrameV3 : IFrame,
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
        width: `${(this.zoom / NORMAL_RATIO / 100) * this.viewportWidth - 40}px`,
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
    verticalPadding() {
      return (this.viewportWidth / this.viewportHeight) * 0
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
    catalogVisible(n, o) {
      if (n !== o) {
        this.viewportWidth = n ? this.viewportWidth - 300 : this.viewportWidth + 300
      }
      // setTimeout(() => {
      //   this.$nextTick(() => {
      //     this.handleResize()
      //   })
      // }, 500)
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
    printPDF() {
      const contentWindow = this.$refs.iframe.getContentWindow()
      contentWindow.print()
    },
    updateZoomFullpage() {
      const perViewerHeight =
        (this.viewerContentHeight - this.verticalPadding) / this.total
      const rate = this.viewportHeight / (perViewerHeight - MARGIN_OFFSET)

      this.$emit('update:zoom', this.zoom * rate)
      this.scrollToPage(this.page)
    },
    handleViewerScroll(evt) {
      this.isScrolling = true
      const yOffset = evt.target.scrollTop
      const perHeight =
        (this.viewerContentHeight + MARGIN_OFFSET - this.verticalPadding) /
        this.total
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

        // const documentLoadingTask = PDF.getDocument(this.source)
        const documentLoadingTask = PDF.getDocument({
          url: this.source,
          cMapPacked: true,
          cMapUrl: 'https://unpkg.com/browse/pdfjs-dist@2.2.228/cmaps/',
        })
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
          image.onload = e => {
            e.target.naturalWidth
          }

          return image
        }

        this.imageList = []
        this.viewerImageList = []
        const promiseList = blobs.map((blobData, idx) => {
          const image = getImage(blobData)
          const viewerImg = image.cloneNode()
          const url = URL.createObjectURL(blobData.blob)

          this.imageList = [...this.imageList, url]
          // const catalogImg = image.cloneNode()
          // replacePlaceholder(this.$refs.catalogItemContent[idx], catalogImg)
          this.viewerImageList = [...this.viewerImageList, url]

          const refs = this.$refs[`viewerItem_${idx}`]
          const target = Array.isArray(refs) ? refs[0] : refs
          replacePlaceholder(target, viewerImg)

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

        if (this.settings?.isFullWidth) {
          this.$emit('update:zoom', 200)
        }

        await this.$nextTick()
        this.viewerContentHeight = this.$refs.viewerContent.clientHeight
      } catch (e) {
        if (e instanceof Error) {
          console.error('rendering failed:', e)
        }
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

      const refs = this.$refs[`viewerItem_${page - 1}`]
      const target = Array.isArray(refs) ? refs[0] : refs
      target.scrollIntoView()
    },
    syncCatalogOffset(page) {
      const refs = this.$refs[`catalogItem_${page - 1}`]
      const target = Array.isArray(refs) ? refs[0] : refs

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
