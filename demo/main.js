import Vue, { createApp } from 'vue'

import App from './App.vue'

if (typeof createApp === 'function') {
  createApp(App).mount('#app')
} else {
  new Vue({
    el: '#app',
    render: h => h(App),
  })
}
