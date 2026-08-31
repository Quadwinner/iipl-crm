/** Radix modals can leave overflow:hidden on body if closed while still opening. */
export function unlockBodyScroll(): void {
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
  document.documentElement.style.overflow = ''
  document.documentElement.style.paddingRight = ''
  document.body.removeAttribute('data-scroll-locked')
}
