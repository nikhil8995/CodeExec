const INDENT = '    '

function getLineStart(text, index) {
  const lastBreak = text.lastIndexOf('\n', Math.max(0, index - 1))
  return lastBreak === -1 ? 0 : lastBreak + 1
}

function getCurrentLinePrefix(text, index) {
  const lineStart = getLineStart(text, index)
  return text.slice(lineStart, index)
}

function getPreviousLine(text, index) {
  const lineStart = getLineStart(text, index)
  if (lineStart === 0) return ''

  const prevLineEnd = lineStart - 1
  const prevLineStart = text.lastIndexOf('\n', Math.max(0, prevLineEnd - 1))
  const start = prevLineStart === -1 ? 0 : prevLineStart + 1
  return text.slice(start, prevLineEnd)
}

function leadingSpaces(text) {
  const m = text.match(/^ */)
  return m ? m[0] : ''
}

export function applyCodeEditorKey({ value, selectionStart, selectionEnd, key }) {
  const start = Math.max(0, selectionStart)
  const end = Math.max(start, selectionEnd)

  if (key === 'Tab') {
    const next = `${value.slice(0, start)}${INDENT}${value.slice(end)}`
    const caret = start + INDENT.length
    return { handled: true, value: next, selectionStart: caret, selectionEnd: caret }
  }

  if (key === 'Enter') {
    const linePrefix = getCurrentLinePrefix(value, start)
    const prevLine = getPreviousLine(value, start)

    let indent = leadingSpaces(linePrefix)
    if (linePrefix.trim().length === 0 && prevLine) {
      indent = leadingSpaces(prevLine)
      if (prevLine.trimEnd().endsWith('{')) {
        indent += INDENT
      }
    } else if (linePrefix.trimEnd().endsWith('{')) {
      indent += INDENT
    }

    const insertion = `\n${indent}`
    const next = `${value.slice(0, start)}${insertion}${value.slice(end)}`
    const caret = start + insertion.length
    return { handled: true, value: next, selectionStart: caret, selectionEnd: caret }
  }

  if (key === '}') {
    if (start !== end) return { handled: false }

    const linePrefix = getCurrentLinePrefix(value, start)
    if (!/^ *$/.test(linePrefix)) return { handled: false }

    const reducedPrefix = linePrefix.replace(/ {1,4}$/, '')
    const lineStart = getLineStart(value, start)
    const before = value.slice(0, lineStart)
    const after = value.slice(start)
    const next = `${before}${reducedPrefix}}${after}`
    const caret = lineStart + reducedPrefix.length + 1
    return { handled: true, value: next, selectionStart: caret, selectionEnd: caret }
  }

  return { handled: false }
}

export function handleTextareaCodeEditorKeyDown(event, onValueChange) {
  const { key, target } = event
  if (target?.tagName !== 'TEXTAREA') return false

  if (key !== 'Tab' && key !== 'Enter' && key !== '}') return false

  const result = applyCodeEditorKey({
    value: target.value,
    selectionStart: target.selectionStart,
    selectionEnd: target.selectionEnd,
    key
  })

  if (!result.handled) return false

  event.preventDefault()
  onValueChange(result.value)

  requestAnimationFrame(() => {
    if (document.activeElement === target) {
      target.setSelectionRange(result.selectionStart, result.selectionEnd)
    }
  })

  return true
}

function getTextOffset(root, node, nodeOffset) {
  let offset = 0
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let current = walker.nextNode()

  while (current) {
    if (current === node) {
      return offset + nodeOffset
    }
    offset += current.textContent.length
    current = walker.nextNode()
  }

  return offset
}

function findNodeAtOffset(root, offset) {
  let remaining = offset
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let current = walker.nextNode()

  while (current) {
    const len = current.textContent.length
    if (remaining <= len) {
      return { node: current, offset: remaining }
    }
    remaining -= len
    current = walker.nextNode()
  }

  const fallback = root.lastChild
  if (fallback?.nodeType === Node.TEXT_NODE) {
    return { node: fallback, offset: fallback.textContent.length }
  }

  const textNode = document.createTextNode('')
  root.appendChild(textNode)
  return { node: textNode, offset: 0 }
}

export function handleContentEditableCodeEditorKeyDown(event, onValueChange) {
  const { key, target } = event
  if (!target?.isContentEditable) return false
  if (key !== 'Tab' && key !== 'Enter' && key !== '}') return false

  const selection = globalThis.getSelection()
  if (!selection || selection.rangeCount === 0) return false

  const range = selection.getRangeAt(0)
  const start = getTextOffset(target, range.startContainer, range.startOffset)
  const end = getTextOffset(target, range.endContainer, range.endOffset)
  const value = target.textContent || ''

  const result = applyCodeEditorKey({
    value,
    selectionStart: start,
    selectionEnd: end,
    key
  })

  if (!result.handled) return false

  event.preventDefault()
  onValueChange(result.value)

  requestAnimationFrame(() => {
    target.textContent = result.value
    const nextSelection = globalThis.getSelection()
    if (!nextSelection) return

    const nextRange = document.createRange()
    const pos = findNodeAtOffset(target, result.selectionStart)
    nextRange.setStart(pos.node, pos.offset)
    nextRange.collapse(true)
    nextSelection.removeAllRanges()
    nextSelection.addRange(nextRange)
  })

  return true
}
