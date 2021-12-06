<template>
  <div class="rotate-wrapper" :style="loaded && contentStyle">
    <!-- TODO: slot content (MutationObserver) -->
    <img
      class="image"
      ref="img"
      :src="src"
      :style="imageStyle"
      @load="handleLoaded('template')"
    />
    <!-- FIXME: img load event never triggered -->
  </div>
</template>

<script>
export default {
  name: 'RotateWrapper',
  props: {
    src: {
      type: String,
    },
    rotateDeg: Number,
    duration: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      loaded: false,
      imageRect: {},
    }
  },
  computed: {
    contentStyle() {
      return {
        '--content-width': `${this.imageRect.width}px`,
        '--content-height': `${this.imageRect.height}px`,
      }
    },
    imageStyle() {
      return {
        transform: `rotate(${this.rotateDeg}deg)`,
        transitionDuration: `${this.duration}ms`,
        marginTop:
          this.imageRect.width > this.imageRect.height
            ? `-${(this.imageRect.width - this.imageRect.height) / 2}px`
            : 0,
      }
    },
  },
  watch: {
    src: {
      immediate: true,
      handler(n) {
        this.loaded = false
        if (n) {
          const image = document.createElement('img')
          image.src = n

          const tmp = image.cloneNode()
          // blob src does not fire onload
          tmp.onload = async () => {
            await this.$nextTick()
            this.handleLoaded()
          }
        }
      },
    },
    async rotateDeg() {
      await this.$nextTick()
      this._timer = setInterval(() => {
        this.updateImageRect()
      }, 20)
      setTimeout(() => {
        clearInterval(this._timer)
      }, this.duration + 20)
    },
  },
  methods: {
    handleLoaded() {
      this.loaded = true
      this.updateImageRect()
    },
    updateImageRect() {
      const { width, height } = this.$refs.img.getBoundingClientRect()
      this.imageRect = {
        width,
        height,
      }
    },
  },
}
</script>

<style lang="scss" scoped>
@import './RotateWrapper.scss';
</style>
