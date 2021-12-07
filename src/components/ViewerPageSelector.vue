<template>
  <span class="header__preview">
    <div class="start">
      <IconButton
        v-if="catalogVisible"
        name="catalog"
        @click="handleToggleCatalog"
      />
      <div class="title">
        {{ filename }}
      </div>
    </div>

    <div class="center">
      <div id="content" v-if="switchPageVisible">
        <input
          part="input"
          type="text"
          id="pageselector"
          aria-label="页码"
          :value="page"
          @blur="handleUpdatePage"
          @keyup.enter="handleUpdatePage"
        />
        <span id="divider">/</span>
        <span id="pagelength">{{ total }}</span>
      </div>

      <span class="vertical-separator"></span>
      <span id="zoom-controls" v-if="zoomVisible">
        <IconButton
          name="minus"
          :disabled="isLowest"
          @click="handleModifyZoomLevel(false)"
        />
        <input
          type="text"
          aria-label="缩放级别"
          :value="formatZoom"
          @blur="handleUpdateZoom($event.target.value)"
          @keyup.enter="handleUpdateZoom($event.target.value)"
        />
        <IconButton
          name="plus"
          :disabled="isHighest"
          @click="handleModifyZoomLevel(true)"
        />
      </span>
      <span class="vertical-separator"></span>
      <IconButton
        v-if="fullpageVisible"
        :name="mode"
        @click="handleToggleFullpage"
      />
      <IconButton v-if="rotateVisible" name="rotate" @click="handleRotate" />
    </div>
    <div class="end">
      <IconButton
        v-if="downloadVisible"
        name="download"
        @click="handleDownload"
      />
      <IconButton v-if="printVisible" name="printer" @click="handlePrint" />
      <!-- TODO: more action. (infos, fullscreen...) -->
      <!-- <IconButton v-if="moreVisible" name="dots" @click="handleToggleMore" /> -->
    </div>
  </span>
</template>

<script>
import IconButton from './IconButton.vue'
import {
  DOWNLOAD,
  PRINT,
  DOUBLE,
  FULLSCREEN,
  ABOUT,
  FULLPAGE,
  ROTATE,
  ZOOM,
  CATALOG,
  SWITCH_PAGE,
} from '../constants/controls'

const NORMAL_ZOOM_LEVEL = [
  25, 33, 50, 67, 75, 80, 90, 100, 110, 125, 150, 175, 200, 250, 300, 400, 500,
]
const string2Number = str => Number(str.replace(/[^\d]/g, '')) || 1

export default {
  name: 'ViewerPageSelector',
  components: {
    IconButton,
  },
  props: {
    total: Number,
    page: Number,
    zoom: Number,
    rotate: Number,
    controls: Array,
    isFullpage: Boolean,
    filename: String,
  },
  data() {
    return {
      tmpZoom: null,
    }
  },
  computed: {
    formatZoom() {
      return parseInt(this.zoom)
    },
    mode() {
      return !this.isFullpage ? 'fullpage' : 'auto-width'
    },
    lowestValue() {
      return NORMAL_ZOOM_LEVEL[0]
    },
    highestValue() {
      return NORMAL_ZOOM_LEVEL[NORMAL_ZOOM_LEVEL.length - 1]
    },
    isLowest() {
      return this.zoom <= this.lowestValue
    },
    isHighest() {
      return this.zoom >= this.highestValue
    },
    catalogVisible() {
      return this.controls.includes(CATALOG)
    },
    downloadVisible() {
      return this.controls.includes(DOWNLOAD)
    },
    printVisible() {
      return this.controls.includes(PRINT)
    },
    doubleVisible() {
      return this.controls.includes(DOUBLE)
    },
    fullscreenVisible() {
      return this.controls.includes(FULLSCREEN)
    },
    aboutVisible() {
      return this.controls.includes(ABOUT)
    },
    fullpageVisible() {
      return this.controls.includes(FULLPAGE)
    },
    rotateVisible() {
      return this.controls.includes(ROTATE)
    },
    zoomVisible() {
      return this.controls.includes(ZOOM)
    },
    switchPageVisible() {
      return this.controls.includes(SWITCH_PAGE)
    },
    moreVisible() {
      return [
        this.doubleVisible,
        this.aboutVisible,
        this.fullscreenVisible,
      ].some(i => i)
    },
  },
  methods: {
    handleToggleFullpage() {
      // Make a copy for recovery
      if (!this.isFullpage) {
        this.tmpZoom = this.zoom
      } else {
        this.handleUpdateZoom(this.tmpZoom)
      }
      this.$emit('toggleFullpage')
    },
    handleRotate() {
      this.$emit('update:rotate', this.rotate + 90)
    },
    handleDownload() {
      this.$emit('download')
    },
    handlePrint() {
      this.$emit('print')
    },
    handleToggleMore() {
      // TODO: toggle more
    },
    handleFullscreen() {
      // TODO: fullscreen
    },
    handleModifyZoomLevel(isLevelUp) {
      const targetLevel = NORMAL_ZOOM_LEVEL.reduce((target, zoom, i) => {
        if (target) {
          return target
        }

        const next = NORMAL_ZOOM_LEVEL[i + 1]

        const condition = isLevelUp
          ? zoom <= this.zoom && this.zoom < next
          : zoom < this.zoom && this.zoom <= next

        if (condition) {
          if (isLevelUp) {
            return next
          } else {
            return zoom
          }
        }
        return null
      }, null)

      this.handleUpdateZoom(targetLevel)
    },
    handleToggleCatalog() {
      this.$emit('toggleCatalog')
    },
    handleUpdatePage(evt) {
      const value = string2Number(evt.target.value)

      this.$emit('update:page', value > this.total ? this.total : value)
    },
    handleUpdateZoom(value) {
      if (typeof value !== 'number') {
        value = string2Number(value)
      }
      const finalValue =
        value > this.highestValue
          ? this.highestValue
          : value < this.lowestValue
          ? this.lowestValue
          : value

      this.$emit('update:zoom', finalValue)
    },
  },
}
</script>

<style lang="scss">
.header__preview {
  --page-length-digits: 1;
  display: flex;
  width: 100%;
  .start,
  .end {
    flex: 1;
  }
  .start {
    align-items: center;
    display: flex;
    overflow: hidden;
    padding-inline-end: 20px;
    min-width: 36px;
    .title {
      font-size: 13px;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-align: left;
    }
    .catalog-icon {
      > svg {
        pointer-events: none;
        display: block;
        width: 20px;
        height: 20px;
        position: relative;
        vertical-align: middle;
        fill: var(--iron-icon-fill-color, currentcolor);
        stroke: var(--iron-icon-stroke-color, none);
        width: var(--iron-icon-width, 24px);
        height: var(--iron-icon-height, 24px);
      }
    }
  }
  .center {
    align-items: center;
    display: flex;

    #content {
      align-items: center;
      color: #fff;
      direction: ltr;
      display: flex;
      font-size: 0.81rem;
      text-align: center;
      --page-selector-spacing: 4px;
      #pageselector::selection {
        background-color: var(--viewer-text-input-selection-color);
      }

      input,
      #pagelength {
        width: calc(max(2, var(--page-length-digits)) * 1ch + 1px);
      }

      input {
        background: rgba(0, 0, 0, 0.5);
        border: none;
        color: white;
        font-family: inherit;
        line-height: inherit;
        outline: none;
        padding: 0 var(--page-selector-spacing);
        text-align: center;
        max-height: var(--viewer-pdf-toolbar-height);
        font-size: 13px;
      }

      #divider {
        margin: 0 var(--page-selector-spacing);
      }
    }

    #zoom-controls {
      align-items: center;
      display: flex;
      padding: 0 4px;
      input {
        background: rgba(0, 0, 0, 0.5);
        border: none;
        caret-color: currentColor;
        color: inherit;
        font-family: inherit;
        line-height: inherit;
        margin-left: 4px;
        outline: none;
        padding: 0 4px;
        text-align: center;
        width: 5ch;
        font-size: 13px;
      }
    }
  }
  .end {
    display: flex;
    justify-content: flex-end;
    padding-inline-start: 20px;
    text-align: end;
    white-space: nowrap;
  }
}

@media screen and (max-width: 500) {
  .header__preview {
    .start {
      display: none;
    }
  }
}
</style>
