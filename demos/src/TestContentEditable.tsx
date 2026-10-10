import { NodeRef, ion, observe } from "luent"

export function TestContentEditable() {
  const $text = ion('Write something...')
  const $div = NodeRef('div')
  
  let selectionStart = 0
  let selectionEnd = 0

  function captureSelection(root: HTMLElement) {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return

    const start = document.createRange()
    start.selectNodeContents(root)
    start.setEnd(range.startContainer, range.startOffset)

    const end = document.createRange()
    end.selectNodeContents(root)
    end.setEnd(range.endContainer, range.endOffset)

    selectionStart = start.toString().length
    selectionEnd = end.toString().length
  }

  function resolveTextPosition(root: Node, targetOffset: number) {
    let consumed = 0
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    let node = walker.nextNode()
    while (node) {
      const len = node.textContent?.length ?? 0
      if (consumed + len >= targetOffset) {
        return { node, offset: Math.max(0, targetOffset - consumed) }
      }
      consumed += len
      node = walker.nextNode()
    }

    if (root.lastChild) {
      return { node: root.lastChild, offset: root.lastChild.textContent?.length ?? 0 }
    }

    return { node: root, offset: 0 }
  }

  function restoreSelection(root: HTMLElement) {
    const selection = window.getSelection()
    if (!selection) return

    const startPos = resolveTextPosition(root, selectionStart)
    const endPos = resolveTextPosition(root, selectionEnd)
    const range = document.createRange()
    range.setStart(startPos.node, startPos.offset)
    range.setEnd(endPos.node, endPos.offset)

    selection.removeAllRanges()
    selection.addRange(range)
  }

  observe($text, () => {
    console.log('$text', $text())
    const node = $div()
    if (!node || document.activeElement !== node) return
    queueMicrotask(() => {
      if (document.activeElement === node) {
        restoreSelection(node)
      }
    })
  })
  return <>
    <div
      contenteditable='true'
      ref={$div}
      on:input={e => {
        const target = e.currentTarget as HTMLDivElement
        captureSelection(target)
        $text.value = target.innerHTML
      }}
    >{{ html: $text }}</div>
  </>
}