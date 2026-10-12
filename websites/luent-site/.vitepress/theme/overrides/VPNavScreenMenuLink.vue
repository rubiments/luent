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
	console.log('OVERRIDE_VPNAVSCREENMENULINK_LOADED')
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
		:class="{ VPNavScreenMenuLink: true, active: isActiveLink }"
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
