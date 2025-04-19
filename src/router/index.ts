import { createRouter, createWebHashHistory } from 'vue-router'
import ControlPanel from '../views/ControlPanel.vue'
import QueueDisplay from '../views/QueueDisplay.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: ControlPanel
    },
    {
      path: '/queue',
      component: QueueDisplay
    }
  ]
})

export default router 