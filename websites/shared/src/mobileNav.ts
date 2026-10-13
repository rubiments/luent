export function fixMobileNav($currentPath: () => string) {
  if (typeof document === 'undefined') return
  // hack to fix Vitepress mobile navigation where menu closes before page loads causing a flash of the current page
  document.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof Element)) return;
    const link = target.closest('.VPLink')
    if (!link || !('href' in link)) return;
    const href = link.href
    if (typeof href !== 'string' || !href.startsWith(window.location.origin)) return;
    if (samePage(href)) {
      const backdrop = document.querySelector('.VPBackdrop')
      if (backdrop && backdrop instanceof HTMLElement) {
        backdrop.click()
      }
      return;
    }

    event.preventDefault()
    event.stopImmediatePropagation()
  }, /*capture*/true)

  function samePage(href: string) {
    return href.split('#')[0] === window.location.origin + $currentPath()
  }
}