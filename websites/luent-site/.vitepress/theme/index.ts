// https://vitepress.dev/guide/custom-theme
import { type Theme, useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import './style.css'
import CustomHome from './CustomHome.vue'
import { islands, fixMobileNav, mountIslands, smoothScrollHomepage, installVitePressScrollRestoration } from '../../src/luent-islands'

export default {
  extends: DefaultTheme,
  Layout() {
    const { frontmatter } = useData()
    if (frontmatter.value?.layout === 'home') {
      return h(DefaultTheme.Layout, null, {
        'home-hero-before': () => h(CustomHome)
      })
    }
    return h(DefaultTheme.Layout)
  },
  enhanceApp({ router }) {
    let previousPage = router.route.path
    const prevBeforeRouteChange = router.onBeforeRouteChange

    router.onBeforeRouteChange = async (to) => {
      previousPage = router.route.path
      if (!prevBeforeRouteChange) return
      return prevBeforeRouteChange(to)
    }

    installVitePressScrollRestoration(router, {
      onAfterRouteChange: (page) => {
        if (typeof document === 'undefined') return
        mountIslands(islands, page)
        smoothScrollHomepage(document.documentElement, page, previousPage)
      }
    })

    fixMobileNav(() => previousPage)
  }
} satisfies Theme

