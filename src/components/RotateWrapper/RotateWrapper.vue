<template>
  <div class="rotate-wrapper" :style="loaded && contentStyle">
    <!-- TODO: slot content (MutationObserver) -->
    <img
      v-if="src"
      class="image"
      ref="img"
      :src="src"
      :style="imageStyle"
      @load="handleLoaded"
    />
  </div>
</template>

<script>
export default {
  name: 'RotateWrapper',
  props: {
    src: String,
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
