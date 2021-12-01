<template>
  <i v-if="isFontClass" :class="className" @click="$emit('click')">
    <slot />
  </i>
  <svg v-else class="icon" aria-hidden="true">
    <use :xlink:href="icon" />
  </svg>
</template>

<script>
export default {
  props: {
    name: {
      type: String,
      required: true,
    },
    useSymbol: {
      type: Boolean,
      default: false,
    },
    prefix: {
      type: String,
      default: 'pdf-viewer--',
    },
  },
  computed: {
    icon() {
      return this.useSymbol
        ? `#icon-${this.name}`
        : `${this.prefix}${this.name}`
    },
    className() {
      return `iconfont ${this.icon}`
    },
    isFontClass() {
      return !this.useSymbol
    },
  },
}
</script>

<style lang="scss" scoped>
.icon {
  width: 1em;
  height: 1em;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
}
.iconfont {
  font-size: 14px;
}
</style>
