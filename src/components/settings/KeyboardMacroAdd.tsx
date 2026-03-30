import { IconDelete } from '@/assets/icons'

import { cn } from '@/utils/cn'
import { forwardRef, useImperativeHandle, useState } from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { MultiSelect } from '../ui/multi-select'
import { Slider } from '../ui/slider'
import { windowsKeys } from '../VirtualKeyboard/data/rows'

//src/components/VirtualKeyboard

// Mock types/constants to fit current project without external deps
export type Step = { modifiers?: string[]; keys?: string[]; delay?: number }
export type KeySequence = {
  id: string
  name: string
  steps: Step[]
  sortOrder: number
}

export const DEFAULT_DELAY = 50
export const MAX_STEPS_PER_MACRO = 10
export const MAX_KEYS_PER_STEP = 10

// Build key options from virtual keyboard rows (value=keyCode)
const KEY_OPTIONS = windowsKeys
  .flat()
  .filter(k => !k.isModifier)
  .map(k => {
    const primaryLabel = Array.isArray(k.label)
      ? (k.label[0] ?? k.keyCode)
      : (k.label ?? k.keyCode)
    return { value: k.keyCode, label: String(primaryLabel) }
  })
  .sort((a, b) => b.label.localeCompare(a.label))
// Grouped modifiers to match data schema e.g. "ControlLeft", "ShiftRight"
const MODIFIER_GROUPS = [
  {
    key: 'Control',
    label: 'Control',
    left: 'ControlLeft',
    right: 'ControlRight',
  },
  { key: 'Shift', label: 'Shift', left: 'ShiftLeft', right: 'ShiftRight' },
  { key: 'Alt', label: 'Alt', left: 'AltLeft', right: 'AltRight' },
  { key: 'Meta', label: 'Meta', left: 'MetaLeft', right: 'MetaRight' },
] as const

type ValidationErrors = {
  name?: string
  steps?: Record<number, { keys?: string; modifiers?: string; delay?: string }>
}

export type MacroFormProps = {
  initialData: Partial<KeySequence>
  onSubmit: (macro: Partial<KeySequence>) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  submitText?: string
  showHeader?: boolean
}

export type MacroFormHandle = { submit: () => void }

export const MacroForm = forwardRef<MacroFormHandle, MacroFormProps>(
  function MacroForm(
    {
      initialData,
      onSubmit,
      onCancel,
      isSubmitting = false,
      submitText = 'Save Macro',
      showHeader = true,
    }: MacroFormProps,
    ref
  ) {
    const [macro, setMacro] = useState<Partial<KeySequence>>({
      name: '',
      steps: [{ keys: [], modifiers: [], delay: DEFAULT_DELAY }],
      ...initialData,
    })
    const [errors, setErrors] = useState<ValidationErrors>({})
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const showTemporaryError = (message: string) => {
      setErrorMessage(message)
      setTimeout(() => setErrorMessage(null), 3000)
    }

    const validateForm = (): boolean => {
      const newErrors: ValidationErrors = {}
      if (!macro.name?.trim()) newErrors.name = 'Name is required'
      if (!macro.steps?.length) {
        newErrors.steps = { 0: { keys: 'At least one step is required' } }
      } else {
        const hasKeyOrModifier = macro.steps.some(
          s => (s.keys?.length || 0) > 0 || (s.modifiers?.length || 0) > 0
        )
        if (!hasKeyOrModifier)
          newErrors.steps = {
            0: { keys: 'At least one step must have keys or modifiers' },
          }
      }
      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
      if (!validateForm()) {
        showTemporaryError('Please fix the validation errors')
        return
      }
      await onSubmit(macro)
    }

    useImperativeHandle(ref, () => ({ submit: handleSubmit }), [
      macro,
      isSubmitting,
    ])

    const updateStep = (idx: number, patch: Partial<Step>) => {
      const steps = [...(macro.steps || [])]
      steps[idx] = { ...(steps[idx] || {}), ...patch }
      setMacro(prev => ({ ...prev, steps }))
    }

    const addKeyToStep = (idx: number, key: string) => {
      const current = macro.steps?.[idx]?.keys || []
      if (current.length >= MAX_KEYS_PER_STEP) {
        showTemporaryError(
          `Maximum of ${MAX_KEYS_PER_STEP} keys per step allowed`
        )
        return
      }
      updateStep(idx, { keys: Array.from(new Set([...(current || []), key])) })
    }

    const removeKeyFromStep = (idx: number, key: string) => {
      const current = macro.steps?.[idx]?.keys || []
      updateStep(idx, { keys: current.filter(k => k !== key) })
    }

    const toggleModifier = (idx: number, modCode: string) => {
      const current = new Set(macro.steps?.[idx]?.modifiers || [])
      if (current.has(modCode)) current.delete(modCode)
      else current.add(modCode)
      updateStep(idx, { modifiers: Array.from(current) })
    }

    const moveStep = (idx: number, dir: 'up' | 'down') => {
      const steps = [...(macro.steps || [])]
      const ni = dir === 'up' ? idx - 1 : idx + 1
      if (ni < 0 || ni >= steps.length) return
      ;[steps[idx], steps[ni]] = [steps[ni], steps[idx]]
      setMacro(prev => ({ ...prev, steps }))
    }

    const addStep = () => {
      const count = macro.steps?.length || 0
      if (count >= MAX_STEPS_PER_MACRO) {
        showTemporaryError(
          `You can only add a maximum of ${MAX_STEPS_PER_MACRO} steps per macro.`
        )
        return
      }
      setMacro(prev => ({
        ...prev,
        steps: [
          ...(prev.steps || []),
          { keys: [], modifiers: [], delay: DEFAULT_DELAY },
        ],
      }))
      setErrors({})
    }

    const deleteStep = (idx: number) => {
      const steps = [...(macro.steps || [])]
      if (steps.length <= 1) return
      steps.splice(idx, 1)
      setMacro(prev => ({ ...prev, steps }))
    }

    const isMaxStepsReached = (macro.steps?.length || 0) >= MAX_STEPS_PER_MACRO

    return (
      <div className="space-y-6">
        {/* Header */}
        {showHeader && (
          <div>
            <div className="text-lg font-semibold">Add New Macro</div>
            <div className="text-xs ">Create a new keyboard macro</div>
          </div>
        )}

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="macro-name">Macro Name</Label>
          <Input
            id="macro-name"
            placeholder="Macro Name"
            value={macro.name || ''}
            onChange={e =>
              setMacro(prev => ({ ...prev, name: e.target.value }))
            }
            aria-invalid={!!errors.name}
          />
          {errors.name ? (
            <div className="text-xs text-destructive">{errors.name}</div>
          ) : null}
        </div>

        {/* Steps */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="text-xs font-medium">Steps</div>
            <span className="">
              {macro.steps?.length || 0}/{MAX_STEPS_PER_MACRO} steps
            </span>
          </div>
          {errors.steps?.[0]?.keys && (
            <div className="text-xs text-destructive">
              {errors.steps[0].keys}
            </div>
          )}

          <div className="space-y-4">
            {(macro.steps || []).map((step, idx) => (
              <Card key={idx} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-[10px]">
                    <span
                      className={cn(
                        'bg-[var(--btn-outline-text)] inline-flex size-6 items-center justify-center rounded-full  text-xs text-[var(--bg-primary)]'
                      )}
                    >
                      {`${idx < 9 ? '0' : ''}${idx + 1}`}
                    </span>
                    <Button
                      size="xs"
                      variant="default"
                      onClick={() => moveStep(idx, 'up')}
                      disabled={idx === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      size="xs"
                      variant="default"
                      onClick={() => moveStep(idx, 'down')}
                      disabled={idx === (macro.steps?.length || 0) - 1}
                    >
                      ↓
                    </Button>
                  </div>

                  <Button
                    size="xs"
                    status="danger"
                    variant="outline"
                    onClick={() => deleteStep(idx)}
                    disabled={(macro.steps?.length || 0) <= 1}
                  >
                    <IconDelete className="text-[var(--text-color)] size-[12px]"></IconDelete>
                  </Button>
                </div>

                {/* Modifiers (grouped Left/Right) */}
                <div className="space-y-2">
                  <div className="text-xs font-medium">Modifiers</div>
                  <div className="flex flex-wrap gap-3">
                    {MODIFIER_GROUPS.map(group => {
                      const selected = new Set(step.modifiers || [])
                      return (
                        <div
                          key={group.key}
                          className="rounded-md border border-[var(--border-color)] p-2"
                        >
                          <div className="text-xs  mb-2">{group.label}</div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="xs"
                              variant={
                                selected.has(group.left) ? 'outline' : 'default'
                              }
                              onClick={() => toggleModifier(idx, group.left)}
                            >
                              Left
                            </Button>
                            <Button
                              type="button"
                              size="xs"
                              variant={
                                selected.has(group.right)
                                  ? 'outline'
                                  : 'default'
                              }
                              onClick={() => toggleModifier(idx, group.right)}
                            >
                              Right
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Keys */}
                <div className="space-y-2">
                  <div className="text-xs font-medium">Keys</div>
                  <div className="text-xs ">
                    Maximum {MAX_KEYS_PER_STEP} keys per step.
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {step.keys && step.keys.length > 0 && (
                      <>
                        {step.keys.map(k => (
                          <Button
                            key={k}
                            size="xs"
                            variant="outline"
                            onClick={() => removeKeyFromStep(idx, k)}
                            title="Click to remove"
                          >
                            {k} ×
                          </Button>
                        ))}
                      </>
                    )}
                    <MultiSelect
                      options={KEY_OPTIONS}
                      size="xs"
                      value={step.keys || []}
                      maxSelections={MAX_KEYS_PER_STEP}
                      onChange={vals => {
                        updateStep(idx, { keys: vals })
                      }}
                      placeholder="Search or pick keys..."
                    />
                  </div>
                </div>

                {/* Delay */}
                <div className="space-y-2">
                  <div className="text-xs font-medium">Step Duration</div>
                  <div className="text-xs ">
                    Time to wait before executing the next step.
                  </div>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[step.delay ?? DEFAULT_DELAY]}
                      min={0}
                      max={1000}
                      step={50}
                      onValueChange={v => updateStep(idx, { delay: v[0] })}
                      className="w-[260px]"
                    />
                    <span className="text-xs  w-12 text-right">
                      {step.delay ?? DEFAULT_DELAY}ms
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Button
            variant="default"
            className="w-full"
            onClick={addStep}
            disabled={isMaxStepsReached}
          >
            + Add Step {isMaxStepsReached ? `(${MAX_STEPS_PER_MACRO} max)` : ''}
          </Button>
        </div>

        {errorMessage && (
          <div className="text-xs text-destructive">{errorMessage}</div>
        )}

        {/* <div className="flex items-center gap-2">
        <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? "Saving..." : submitText}</Button>
        <Button variant="default" onClick={onCancel}>Cancel</Button>
      </div> */}
      </div>
    )
  }
)

export default MacroForm
