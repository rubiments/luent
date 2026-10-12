<script lang="ts" setup>
import type { DefaultTheme } from 'vitepress/theme'
import { computed } from 'vue'
import { useData } from 'vitepress'
import { isActive } from 'vitepress/dist/client/shared.js'
import VPLink from 'vitepress/dist/client/theme-default/components/VPLink.vue'

const props = defineProps<{
	item: DefaultTheme.NavItemWithLink
}>()

const { page } = useData()

if (typeof window === 'undefined') {
	console.log('OVERRIDE_VPNAVSCREENMENUGROUPLINK_LOADED')
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

function onLinkClick(event: MouseEvent) {
	// Step 1 diagnostic: fully swallow mobile menu link clicks so the menu cannot close.
	event.preventDefault()
	event.stopPropagation()
}
</script>

<template>
	<VPLink
		:class="{ VPNavScreenMenuGroupLink: true, active: isActiveLink }"
		:href
		:target="item.target"
		:rel="item.rel"
		:no-icon="item.noIcon"
		@click="onLinkClick"
	>
		<span v-html="item.text"></span>
	</VPLink>
</template>

<style scoped>
.VPNavScreenMenuGroupLink {
	display: block;
	margin-left: 12px;
	line-height: 32px;
	font-size: 14px;
	font-weight: 400;
	color: var(--vp-c-text-1);
	transition: color 0.25s;
}

.VPNavScreenMenuGroupLink:hover {
	color: var(--vp-c-brand-1);
}

.VPNavScreenMenuGroupLink.active {
	color: var(--vp-c-brand-1);
}
</style>
