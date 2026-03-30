import { useJsonRpc } from '@/hooks/useJsonRpc'
import { useSettingsActions } from '@/stores/devicesStore'
import { createLogger } from '@/utils/logger'
import {
  ArrowDown,
  ArrowUp,
  Command,
  Copy,
  CornerDownRight,
  MoveRight,
  Pencil,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Dialog } from '../Dialog'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { useConfirmDialog } from '../ui/confirm-dialog'
import MacroForm, { type MacroFormHandle } from './KeyboardMacroAdd'
import SettingBlock from './SettingBlock'

const logger = createLogger('KeyboardMacros')

type Step = {
  modifiers?: string[]
  keys?: string[]
  delay?: number
}

type KeySequence = {
  id: string
  name: string
  steps: Step[]
  sortOrder: number
}

const DEFAULT_DELAY = 50
const COPY_SUFFIX = 'Copy'

function genId() {
  return Math.random().toString(36).slice(2, 10)
}

function normalizeSortOrders(macros: KeySequence[]): KeySequence[] {
  return macros.map((m, idx) => ({ ...m, sortOrder: idx + 1 }))
}

type KeyboardMacrosProps = { initialMacros?: KeySequence[] }

export default function KeyboardMacros({
  initialMacros = [],
}: KeyboardMacrosProps) {
  const [macros, setMacros] = useState<KeySequence[]>(initialMacros)
  const { setDeviceSetting } = useSettingsActions()
  const [, isChannelReady, sendAsync] = useJsonRpc()
  const { confirm } = useConfirmDialog()
  const [addOpen, setAddOpen] = useState(false)
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const addFormRef = useRef<MacroFormHandle>(null)
  const editFormRef = useRef<MacroFormHandle>(null)

  const isEmpty = macros.length === 0

  const handleAdd = () => setAddOpen(true)
  const persistMacros = async (next: KeySequence[]) => {
    // Optimistic update to UI and local device store
    setMacros(next)
    setDeviceSetting('keyboardMacros', val => ({ ...val, macros: next }))
    try {
      // Persist to device via RPC
      await sendAsync(
        {
          method: 'setKeyboardMacros',
          params: { macros: next },
          successMessage: { prefix: 'Keyboard macros saved' },
          errorMessage: { prefix: 'Failed to save keyboard macros' },
        },
        { resultOnly: true }
      )
    } catch (error) {
      // Optionally, we could reload from device on failure
      // For now, just log. The toast is handled in sendAsync options.
      logger.error('Failed to persist macros', error)
    }
  }
  const handleSetMacros = (macros: KeySequence[]) => {
    void persistMacros(macros)
  }

  // Load initial macros from device when channel is ready
  useEffect(() => {
    let cancelled = false
    if (!isChannelReady) return
    ;(async () => {
      try {
        const data = await sendAsync(
          { method: 'getKeyboardMacros' },
          { resultOnly: true }
        )
        if (cancelled) return
        // Expecting shape { macros: KeySequence[] } or []
        const next: KeySequence[] = Array.isArray(data?.macros)
          ? (data.macros as KeySequence[])
          : Array.isArray(data)
            ? (data as KeySequence[])
            : []
        setMacros(normalizeSortOrders(next))
      } catch (error) {
        if (!cancelled) {
          logger.error('Failed to load keyboard macros', error)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isChannelReady, sendAsync])
  const handleAddSubmit = async (draft: Partial<KeySequence>) => {
    setAddSubmitting(true)
    try {
      const m: KeySequence = {
        id: genId(),
        name: draft.name?.trim() || `New Macro ${macros.length + 1}`,
        steps: (draft.steps as Step[]) || [
          { keys: ['K'], modifiers: ['Ctrl'], delay: DEFAULT_DELAY },
        ],
        sortOrder: macros.length + 1,
      }
      const next = normalizeSortOrders([...macros, m])
      logger.info('Macro added', { name: m.name, stepsCount: m.steps.length })
      handleSetMacros(next)
      setAddOpen(false)
    } finally {
      setAddSubmitting(false)
    }
  }

  const handleDuplicate = (macro: KeySequence) => {
    // Generate unique name for duplicate
    const generateUniqueName = (baseName: string): string => {
      const existingNames = macros.map(m => m.name)

      // If base name doesn't exist, use it directly
      if (!existingNames.includes(baseName)) {
        return baseName
      }

      // Check if already has "Copy" suffix
      const copyPattern = new RegExp(`^(.+)\\s+${COPY_SUFFIX}(?:\\s+(\\d+))?$`)
      const match = baseName.match(copyPattern)

      let originalName: string
      if (match) {
        // If already in Copy format, extract original name
        originalName = match[1]
      } else {
        // Otherwise use full name as original
        originalName = baseName
      }

      // Find available numeric suffix
      let counter = 0
      let newName: string

      do {
        if (counter === 0) {
          newName = `${originalName} ${COPY_SUFFIX}`
        } else {
          newName = `${originalName} ${COPY_SUFFIX} ${counter}`
        }
        counter++
      } while (existingNames.includes(newName))

      return newName
    }

    const uniqueName = generateUniqueName(macro.name)

    const copy: KeySequence = {
      ...macro,
      id: genId(),
      name: uniqueName,
      sortOrder: macros.length + 1,
    }
    const next = normalizeSortOrders([...macros, copy])
    logger.info('Macro duplicated', {
      original: macro.name,
      duplicate: copy.name,
    })
    handleSetMacros(next)
  }

  const handleMove = (index: number, dir: 'up' | 'down') => {
    const newIndex = dir === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= macros.length) return
    const next = [...macros]
    ;[next[index], next[newIndex]] = [next[newIndex], next[index]]
    const normalized = normalizeSortOrders(next)
    logger.info('Macro moved', { from: index, to: newIndex, direction: dir })
    handleSetMacros(normalized)
  }

  const handleDelete = async (macro: KeySequence, index: number) => {
    const confirmed = await confirm({
      title: 'Delete Macro',
      content: `Are you sure you want to delete the macro "${macro.name}"? This action cannot be undone.`,
      type: 'error',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: () => {
        const next = normalizeSortOrders(macros.filter((_, i) => i !== index))
        logger.info('Macro deleted', { name: macro.name })
        handleSetMacros(next)
      },
    })
  }

  const handleEdit = (macro: KeySequence) => {
    const idx = macros.findIndex(m => m.id === macro.id)
    if (idx === -1) return
    setEditingIndex(idx)
    setEditOpen(true)
  }

  const handleEditSubmit = async (draft: Partial<KeySequence>) => {
    if (editingIndex == null) return
    setEditSubmitting(true)
    try {
      const next = [...macros]
      const current = next[editingIndex]
      next[editingIndex] = {
        ...current,
        name: draft.name?.trim() || current.name,
        steps: (draft.steps as Step[]) || current.steps,
      }
      const normalized = normalizeSortOrders(next)
      logger.info('Macro updated', { name: next[editingIndex].name })
      await persistMacros(normalized)
      setEditOpen(false)
    } finally {
      setEditSubmitting(false)
    }
  }

  const MacroList = useMemo(
    () => (
      <div className="space-y-2">
        {macros.map((macro, index) => (
          <Card key={macro.id}>
            <CardContent className="flex items-center justify-between gap-2 p-0">
              {/* Left side: sort controls */}
              <div className="flex flex-col gap-1 px-1">
                <Button
                  size="xs"
                  onClick={() => handleMove(index, 'up')}
                  disabled={index === 0}
                  aria-label={`Move ${macro.name} up`}
                  title="Move up"
                >
                  <ArrowUp className="size-[12px]" />
                </Button>
                <Button
                  size="xs"
                  onClick={() => handleMove(index, 'down')}
                  disabled={index === macros.length - 1}
                  aria-label={`Move ${macro.name} down`}
                  title="Move down"
                >
                  <ArrowDown className="size-[12px]" />
                </Button>
              </div>

              {/* Middle: content */}
              <div className="ml-2 flex min-w-0 flex-1 flex-col justify-center">
                <h3 className="truncate text-sm text-[var(--text-color)]">
                  {macro.name}
                </h3>
                <div className="mt-1 p-[6px] text-xs font-[400]  border border-[var(--border-color)] rounded-[4px]">
                  <div className="flex flex-col items-start gap-1">
                    {macro.steps.map((step, stepIdx) => {
                      const Icon = stepIdx === 0 ? MoveRight : CornerDownRight
                      const hasKeys =
                        (Array.isArray(step.modifiers) &&
                          step.modifiers.length > 0) ||
                        (Array.isArray(step.keys) && step.keys.length > 0)
                      return (
                        <div key={stepIdx} className="inline-flex items-center">
                          <Icon className="mr-1 h-3 w-3 shrink-0 opacity-60" />
                          <span className="rounded-[2px] text-xs  border border-[var(--border-color)] bg-[var(--theme-bg-color)] px-2 py-0.5">
                            {hasKeys ? (
                              <>
                                {step.modifiers?.map((m, i) => (
                                  <span key={`m-${i}`}>
                                    <span className="text-xs font-normal">
                                      {m}
                                    </span>
                                    {i < (step.modifiers?.length ?? 0) - 1 && (
                                      <span> + </span>
                                    )}
                                  </span>
                                ))}
                                {step.modifiers?.length && step.keys?.length ? (
                                  <span> + </span>
                                ) : null}
                                {step.keys?.map((k, i) => (
                                  <span key={`k-${i}`}>
                                    <span className="text-xs font-normal text-[var(--text-color)]">
                                      {k}
                                    </span>
                                    {i < (step.keys?.length ?? 0) - 1 && (
                                      <span> + </span>
                                    )}
                                  </span>
                                ))}
                              </>
                            ) : (
                              <span className="opacity-70">Delay only</span>
                            )}
                            {step.delay && step.delay !== DEFAULT_DELAY ? (
                              <span className="ml-1 opacity-70">
                                ({step.delay}ms)
                              </span>
                            ) : null}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Right side: actions */}
              <div className="ml-2 flex items-center gap-1">
                <Button
                  size="xs"
                  onClick={() => handleEdit(macro)}
                  aria-label={`Edit macro ${macro.name}`}
                  title="Edit"
                >
                  <Pencil className="size-[12px]" />
                </Button>

                <Button
                  size="xs"
                  onClick={() => handleDuplicate(macro)}
                  aria-label={`Duplicate macro ${macro.name}`}
                  title="Duplicate"
                >
                  <Copy className="size-[12px]" />
                </Button>

                <Button
                  size="xs"
                  variant="outline"
                  status={'danger'}
                  onClick={() => handleDelete(macro, index)}
                  aria-label={`Delete macro ${macro.name}`}
                  title="Delete"
                >
                  <Trash2 className="size-[12px]" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    ),
    [macros]
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <SettingBlock
        title="Keyboard Macros"
        content={
          'Combine keystrokes into a single action for faster workflows.'
        }
      >
        <SettingBlock.Right>
          <Button size="xs" onClick={handleAdd}>
            + Add New Macro
          </Button>
        </SettingBlock.Right>
      </SettingBlock>

      {/* Body */}
      <div className="space-y-4">
        {isEmpty ? (
          <Card className="flex flex-col items-center gap-3 py-8 text-center">
            <Command className="size-7 opacity-70" />
            <div className="text-xs font-medium">Create Your First Macro</div>
            <div className="text-xs ">
              Combine keystrokes into a single action
            </div>
            <Button size="xs" onClick={handleAdd}>
              Add New Macro
            </Button>
          </Card>
        ) : (
          MacroList
        )}
      </div>

      {/* Add Macro Dialog */}
      <Dialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add New Macro"
        description="Create a new keyboard macro"
        size="xl"
        confirmText="Save Macro"
        cancelText="Cancel"
        width="570px"
        preventAutoCloseOnConfirm
        onConfirm={() => addFormRef.current?.submit()}
        confirmDisabled={addSubmitting}
        noPadding={false}
      >
        <MacroForm
          ref={addFormRef}
          initialData={{
            name: '',
            steps: [{ keys: [], modifiers: [], delay: DEFAULT_DELAY }],
          }}
          onSubmit={handleAddSubmit}
          onCancel={() => setAddOpen(false)}
          isSubmitting={addSubmitting}
          showHeader={false}
        />
      </Dialog>

      {/* Edit Macro Dialog */}
      <Dialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit Macro"
        description="Update your keyboard macro"
        size="auto"
        confirmText="Update Macro"
        cancelText="Cancel"
        preventAutoCloseOnConfirm
        onConfirm={() => editFormRef.current?.submit()}
        width="570px"
        confirmDisabled={editSubmitting}
        noPadding={false}
      >
        {editingIndex != null && macros[editingIndex] ? (
          <MacroForm
            ref={editFormRef}
            initialData={{
              name: macros[editingIndex].name,
              steps: macros[editingIndex].steps,
            }}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditOpen(false)}
            isSubmitting={editSubmitting}
            showHeader={false}
          />
        ) : null}
      </Dialog>
    </div>
  )
}

export default KeyboardMacros
