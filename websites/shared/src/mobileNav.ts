import { awaitTick } from 'luent';
import type { Router } from 'vitepress'

export function fixMobileNav($currentPath: () => string, router: Router) {
  if (typeof document === 'undefined') return
  // hack to fix Vitepress narrow screen navigation where menu closes before page loads causing a flash of the current page
  document.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof Element)) return;
    const link = target.closest('.VPLink, .VPNavBarTitle a')
    if (!link || !('href' in link)) return;
    const href = link.href
    if (typeof href !== 'string' || !href.startsWith(window.location.origin))
      return;
    if (samePage(href)) {
      const closeMenu = document.querySelector('.VPBackdrop, .VPNavBarHamburger')
      if (closeMenu && closeMenu instanceof HTMLElement) {
        closeMenu.click()
      }
      return;
    }

    const root = href.split('/')[3]
    if (!$currentPath().startsWith('/' + root)) {
      router.onAfterPageLoad = () => {
        awaitTick(() => {
          updateLocalMenu(root)
        })
      }
    }

    event.preventDefault()
    event.stopImmediatePropagation()
  }, /*capture*/true)

  function samePage(href: string) {
    return href.split('#')[0] === window.location.origin + $currentPath()
  }

  window.addEventListener('load', () => {
    updateLocalMenu(window.location.pathname.split('/')[1])
  })
}


function updateLocalMenu(root: string) {
  const menu = document.querySelector('.VPLocalNav .menu-text')
  if (!menu) return;
  menu.textContent = capitalizeFirstLetter(root);
  menu.style.opacity = 1;
}

function capitalizeFirstLetter(str: string) {
  if (!str) return str; // Handle empty strings
  return str.charAt(0).toUpperCase() + str.slice(1);
}