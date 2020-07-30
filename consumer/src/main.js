import Vue from 'vue'
import App from './App.vue'
import Reset from './Reset.vue'

// Vue.config.productionTip = false

// new Vue({
//   render: h => h(App),
// }).$mount('#app')


const NotFound = { template: '<p>Page not found</p>' }



const routes = {
  '/App': App,
  '/Reset': Reset
}

new Vue({
  el: '#app',
  data: {
    currentRoute: window.location.pathname
  },
  computed: {
    ViewComponent () {
      return routes[this.currentRoute] || NotFound
    }
  },
  render (h) { return h(this.ViewComponent) }
})
