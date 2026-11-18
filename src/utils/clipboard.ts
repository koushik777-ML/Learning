export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return
  } catch {
    const active = document.activeElement
    const input = document.createElement('textarea')
    input.value = text
    input.readOnly = true
    input.style.cssText = 'position:fixed;top:0;left:0;opacity:0'
    document.body.append(input)
    input.select()
    try {
      if (!document.execCommand('copy')) throw new Error('Clipboard access failed.')
    } finally {
      input.remove()
      if (active instanceof HTMLElement) active.focus()
    }
  }
}
