<template>
  <button :disabled="disabled" class="icon-btn" @click="$emit('click')">
    <Iconfont :name="name" />
  </button>
</template>

<script>
import Iconfont from './Iconfont.vue'

export default {
  name: 'IconButton',
  // vue3 triggers click event twice
  // https://github.com/vuejs/vue-next/commit/e1660f4338fbf4d2a434e13193a58e00f844379b
  inheritAttrs: false,
  components: {
    Iconfont,
  },
  props: {
    name: String,
    disabled: Boolean,
  },
}
</script>

<style lang="scss">
.icon-btn {
  margin-inline-start: 4px;
  width: 36px;
  height: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  transition: all 200ms ease;
  cursor: pointer;
  background: transparent;
  border: none;
  color: white;
  &:hover {
    background: #5c5c5c;
  }
  &:first-child {
    margin-inline-start: 0px;
  }
  &:disabled {
    background: transparent;
    cursor: not-allowed;
    color: rgb(134, 134, 134);
  }
}
</style>
