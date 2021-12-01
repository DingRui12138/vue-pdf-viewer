<template>
  <button :disabled="disabled" class="icon-btn" @click="$emit('click')">
    <Iconfont :name="name" />
  </button>
</template>

<script>
import Iconfont from './Iconfont.vue'

export default {
  name: 'IconButton',
  components: {
    Iconfont,
  },
  props: {
    name: String,
    disabled: Boolean,
  },
}
</script>

<style lang="scss" scoped>
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
