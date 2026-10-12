<script lang="ts" setup>
import type { DefaultTheme } from 'vitepress/theme'
import { computed, ref, watch } from 'vue'
import { useData, useRoute } from 'vitepress'
import { isActive } from 'vitepress/dist/client/shared'
import VPLink from 'vitepress/dist/client/theme-default/components/VPLink.vue'

const props = defineProps<{
  item: DefaultTheme.NavItemWithLink
}>()

const { page } = useData()
const route = useRoute()
const shouldCloseOnNextRouteChange = ref(false)

function closeMobileMenu() {
  const hamburger = document.querySelector<HTMLButtonElement>(
    '.VPNavBarHamburger.hamburger[aria-controls="VPNavScreen"]'
  )

  if (hamburger?.getAttribute('aria-expanded') === 'true') {
    hamburger.click()
  }
}

const href = computed(() =>
  typeof props.item.link === 'function'
    ? props.item.link(page.value)
    : props.item.link
)

const isActiveLink = computed(() =>
  isActive(
    page.value.relativePath,
    props.item.activeMatch || href.value,
    !!props.item.activeMatch
  )
)

function onMobileMenuLinkClick() {
  shouldCloseOnNextRouteChange.value = true
}

watch(
  () => route.path,
  (nextPath: string, previousPath: string) => {
    if (!shouldCloseOnNextRouteChange.value || nextPath === previousPath) return

    shouldCloseOnNextRouteChange.value = false

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        closeMobileMenu()
      })
    })
  }
)
</script>

<template>
  <VPLink
    :class="{ VPNavScreenMenuLink: true, active: isActiveLink }"
    :href
    :target="item.target"
    :rel="item.rel"
    :no-icon="item.noIcon"
    @click="onMobileMenuLinkClick"
  >
    <span v-html="item.text"></span>
  </VPLink>
</template>

<style scoped>
.VPNavScreenMenuLink {
  display: block;
  border-bottom: 1px solid var(--vp-c-divider);
  padding: 12px 0 11px;
  line-height: 24px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  transition:
    border-color 0.25s,
    color 0.25s;
}

.VPNavScreenMenuLink:hover {
  color: var(--vp-c-brand-1);
}

.VPNavScreenMenuLink.active {
  color: var(--vp-c-brand-1);
}
</style>
