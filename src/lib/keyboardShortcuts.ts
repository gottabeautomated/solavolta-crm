type Handlers = {
  goDashboard?: () => void
  goFollowups?: () => void
  focusSearch?: () => void
  nextTask?: () => void
  prevTask?: () => void
  toggleSelect?: () => void
  openTask?: () => void
}

export function registerKeyboardShortcuts(handlers: Handlers) {
  const onKey = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
    const editing = tag === 'input' || tag === 'textarea' || (e as any).isComposing
    if (editing && e.key !== '/' ) return
    const mod = e.ctrlKey || e.metaKey
    const key = e.key.toLowerCase()
    if (!mod && key === 'g') {
      // wait for next key (d)
      let handled = false
      const onNext = (ev: KeyboardEvent) => {
        if (ev.key.toLowerCase() === 'd') { handlers.goDashboard?.(); handled = true }
        window.removeEventListener('keydown', onNext)
      }
      window.addEventListener('keydown', onNext)
      return
    }
    if (!mod && key === 'f') { handlers.goFollowups?.(); e.preventDefault(); return }
    if (!mod && key === '/') { handlers.focusSearch?.(); e.preventDefault(); return }
    if (!mod && key === 'j') { handlers.nextTask?.(); e.preventDefault(); return }
    if (!mod && key === 'k') { handlers.prevTask?.(); e.preventDefault(); return }
    if (!mod && key === 'x') { handlers.toggleSelect?.(); e.preventDefault(); return }
    if (!mod && key === 'enter') { handlers.openTask?.(); e.preventDefault(); return }
  }
  window.addEventListener('keydown', onKey)
  return () => window.removeEventListener('keydown', onKey)
}


