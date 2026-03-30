type KeyOrCode = {
  key?: string
  code?: string
}

function inferFromKeyOrCode(
  arg: string | KeyOrCode,
  opts?: { shiftKey?: boolean }
) {
  // Common alias -> canonical key/code mapping
  const ALIASES: Record<string, { key?: string; code?: string }> = {
    Esc: { key: 'Escape', code: 'Escape' },
    Escape: { key: 'Escape', code: 'Escape' },
    PrtSc: { key: 'PrintScreen', code: 'PrintScreen' },
    PrintScreen: { key: 'PrintScreen', code: 'PrintScreen' },
    PgUp: { key: 'PageUp', code: 'PageUp' },
    PageUp: { key: 'PageUp', code: 'PageUp' },
    PgDn: { key: 'PageDown', code: 'PageDown' },
    PageDown: { key: 'PageDown', code: 'PageDown' },
    Bksp: { key: 'Backspace', code: 'Backspace' },
    Backspace: { key: 'Backspace', code: 'Backspace' },
    Del: { key: 'Delete', code: 'Delete' },
    Delete: { key: 'Delete', code: 'Delete' },
    Ins: { key: 'Insert', code: 'Insert' },
    Insert: { key: 'Insert', code: 'Insert' },
    Home: { key: 'Home', code: 'Home' },
    End: { key: 'End', code: 'End' },
    Space: { key: ' ', code: 'Space' },
    Tab: { key: 'Tab', code: 'Tab' },
    Enter: { key: 'Enter', code: 'Enter' },
    CapsLock: { key: 'CapsLock', code: 'CapsLock' },
    NumLock: { key: 'NumLock', code: 'NumLock' },
    ScrollLock: { key: 'ScrollLock', code: 'ScrollLock' },
    Pause: { key: 'Pause', code: 'Pause' },
    ContextMenu: { key: 'ContextMenu', code: 'ContextMenu' },
    ArrowUp: { key: 'ArrowUp', code: 'ArrowUp' },
    ArrowDown: { key: 'ArrowDown', code: 'ArrowDown' },
    ArrowLeft: { key: 'ArrowLeft', code: 'ArrowLeft' },
    ArrowRight: { key: 'ArrowRight', code: 'ArrowRight' },
  }
  // Add F1..F24
  for (let i = 1; i <= 24; i++) {
    ALIASES[`F${i}`] = { key: `F${i}`, code: `F${i}` }
  }

  let key = ''
  let code = ''
  let shift = !!opts?.shiftKey

  if (!arg) {
    // Defensive: allow simulateKeyEvent(undefined, options)
    arg = ''
  }

  if (typeof arg === 'string') {
    // If looks like a code (e.g., KeyA, Digit1, Enter), treat as code; otherwise treat as key
    const alias = ALIASES[arg]
    if (alias) {
      key = alias.key || key
      code = alias.code || code
    } else if (
      /^[A-Z][a-zA-Z]+\d*$/.test(arg) ||
      /^(Key|Digit|Numpad|Arrow|F\d+|Escape|Enter|Tab|Space|Backspace|Delete|Home|End|Page(Up|Down)|Insert|CapsLock|Shift(Left|Right)|Control(Left|Right)|Alt(Left|Right)|Meta(Left|Right)|PrintScreen|ContextMenu|NumLock|ScrollLock|Pause)$/.test(
        arg
      )
    ) {
      code = arg
    } else {
      key = arg
    }
  } else {
    const maybeAlias =
      (arg.key && ALIASES[arg.key]) || (arg.code && ALIASES[arg.code])
    key = maybeAlias?.key || arg.key || ''
    code = maybeAlias?.code || arg.code || ''
  }

  // If only key is provided, infer code for common cases
  if (!code && key) {
    if (/^[a-zA-Z]$/.test(key)) {
      const upper = key.toUpperCase()
      shift = key === upper ? true : shift // uppercase implies shift unless explicitly overridden
      code = `Key${upper}`
    } else if (/^[0-9]$/.test(key)) {
      code = `Digit${key}`
    } else if (key === ' ') {
      code = 'Space'
    } else if (key === 'Enter') {
      code = 'Enter'
    } else if (key === 'Tab') {
      code = 'Tab'
    } else if (key === 'Escape' || key === 'Esc') {
      key = 'Escape'
      code = 'Escape'
    } else if (
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)
    ) {
      code = key
    }
  }

  // If only code is provided, infer key for common cases
  if (!key && code) {
    if (/^Key[A-Z]$/.test(code)) {
      const ch = code.slice(3)
      key = shift ? ch : ch.toLowerCase()
    } else if (/^Digit[0-9]$/.test(code)) {
      key = code.replace('Digit', '')
    } else if (code === 'Space') {
      key = ' '
    } else if (
      code === 'Enter' ||
      code === 'Tab' ||
      code === 'Escape' ||
      code === 'PrintScreen' ||
      code === 'ContextMenu' ||
      code === 'NumLock' ||
      code === 'ScrollLock' ||
      code === 'Pause' ||
      code.startsWith('Arrow')
    ) {
      key = code
    }
  }

  return { key, code, shiftKey: shift } as {
    key: string
    code: string
    shiftKey: boolean
  }
}

function dispatch(target: Document | HTMLElement, e: KeyboardEvent) {
  target.dispatchEvent(e)
}

function maybeMutateTextValue(
  target: EventTarget | null,
  key: string
): boolean {
  const el = target as any
  const isText =
    el && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
  if (!isText) return false
  const input = el as HTMLInputElement | HTMLTextAreaElement
  const start = (input as any).selectionStart ?? input.value.length
  const end = (input as any).selectionEnd ?? input.value.length

  // Handle basic editing keys
  if (key === 'Backspace') {
    if (start === end && start > 0) {
      input.value = input.value.slice(0, start - 1) + input.value.slice(end)
      ;(input as any).selectionStart = (input as any).selectionEnd = start - 1
      return true
    } else if (start !== end) {
      input.value = input.value.slice(0, start) + input.value.slice(end)
      ;(input as any).selectionStart = (input as any).selectionEnd = start
      return true
    }
    return false
  }
  if (key === 'Delete') {
    if (start === end && end < input.value.length) {
      input.value = input.value.slice(0, start) + input.value.slice(end + 1)
      ;(input as any).selectionStart = (input as any).selectionEnd = start
      return true
    } else if (start !== end) {
      input.value = input.value.slice(0, start) + input.value.slice(end)
      ;(input as any).selectionStart = (input as any).selectionEnd = start
      return true
    }
    return false
  }
  if (key === 'Enter') {
    if (input instanceof HTMLTextAreaElement) {
      const insert = '\n'
      input.value =
        input.value.slice(0, start) + insert + input.value.slice(end)
      ;(input as any).selectionStart = (input as any).selectionEnd =
        start + insert.length
      return true
    }
    return false
  }
  if (key === 'Tab') {
    const insert = '\t'
    input.value = input.value.slice(0, start) + insert + input.value.slice(end)
    ;(input as any).selectionStart = (input as any).selectionEnd =
      start + insert.length
    return true
  }
  // Printable single character
  if (key.length === 1) {
    input.value = input.value.slice(0, start) + key + input.value.slice(end)
    ;(input as any).selectionStart = (input as any).selectionEnd = start + 1
    return true
  }
  return false
}

export function simulateKeyEvent(
  arg: string | KeyOrCode,
  options: {
    shiftKey?: boolean
    ctrlKey?: boolean
    altKey?: boolean
    metaKey?: boolean
    key?: string
    code?: string
    keyCode?: number
    target?: Document | HTMLElement
    pressDurationMs?: number
    fireKeypress?: boolean
    mutateValue?: boolean
    eventType?: 'keydown' | 'keyup' | 'both'
  } = {}
) {
  const inferred = inferFromKeyOrCode(
    options.code ? { code: options.code, key: options.key } : arg,
    { shiftKey: options.shiftKey }
  )
  const key = options.key ?? inferred.key
  const code = options.code ?? inferred.code
  const shiftKey = !!(options.shiftKey ?? inferred.shiftKey)
  const ctrlKey = !!options.ctrlKey
  const altKey = !!options.altKey
  const metaKey = !!options.metaKey
  const keyCode =
    options.keyCode ?? (key.length === 1 ? key.toUpperCase().charCodeAt(0) : 0)
  const target = options.target ?? document
  const eventType = options.eventType ?? 'both'

  // Ensure element focus when target is HTMLElement
  if (target instanceof HTMLElement && typeof target.focus === 'function') {
    try {
      target.focus()
    } catch {}
  }

  const eventProps = {
    key,
    code,
    keyCode,
    bubbles: true,
    cancelable: true,
    shiftKey,
    ctrlKey,
    altKey,
    metaKey,
  }

  if (eventType === 'keydown' || eventType === 'both') {
    const down = new KeyboardEvent('keydown', eventProps)
    dispatch(target, down)

    const printable = key.length === 1
    const shouldKeypress = options.fireKeypress ?? printable
    if (shouldKeypress && eventType === 'both') {
      const pressEvt = new KeyboardEvent('keypress', eventProps)

      dispatch(target, pressEvt)
    }

    if (eventType === 'both') {
      const mutated =
        (options.mutateValue ?? true)
          ? maybeMutateTextValue((target as any).activeElement ?? target, key)
          : false
      if (mutated) {
        try {
          const inputEvt = new InputEvent('input', {
            bubbles: true,
            cancelable: false,
            data: printable ? key : null,
          })
          ;(target as any).activeElement?.dispatchEvent(inputEvt) ||
            (target as HTMLElement).dispatchEvent(inputEvt)
        } catch {}
      }
    }
  }

  const doKeyUp = () => {
    if (eventType === 'keyup' || eventType === 'both') {
      const up = new KeyboardEvent('keyup', eventProps)
      dispatch(target, up)
    }
  }

  if (eventType === 'keydown') {
    return
  } else if (eventType === 'keyup') {
    doKeyUp()
  } else {
    if (options.pressDurationMs && options.pressDurationMs > 0) {
      window.setTimeout(doKeyUp, options.pressDurationMs)
    } else {
      doKeyUp()
    }
  }
}
