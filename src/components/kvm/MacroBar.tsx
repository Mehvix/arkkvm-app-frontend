/**
 * @Purpose: Macro bar component for keyboard macro execution
 * @Description: Displays and executes keyboard macros
 * @version:
 * @Author: zhanglei
 * @Date: 2025-10-27 16:25:25
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-01-31 19:59:03
 */
import { useJsonRpc } from '@/hooks/useJsonRpc';
import { createLogger } from '@/utils/logger';

import { cn } from '@/lib/utils';
import {
  useActiveDeviceSettings,
  type KeySequence,
} from '@/stores/devicesStore';
import { Command } from 'lucide-react';
import { Button } from '../ui/button';
import { toHidReport } from '../VirtualKeyboard';

const logger = createLogger('MacroBar');

interface MacroBarProps {
  onExecuteMacro?: (macroId: string, macroName: string, steps: KeySequence['steps']) => void
  className?: string
}
export default function MacroBar({ className: _className }: MacroBarProps) {
  const currentSettings = useActiveDeviceSettings();

  const macros = currentSettings?.keyboardMacros?.macros || [];
  const [send, isChannelReady] = useJsonRpc();

  const handleMacroClick = async (macro: KeySequence) => {
    const { steps } = macro;
    if (!steps?.length) return;
    for (const step of steps) {
      const { delay, keys, modifiers } = step;
      setTimeout(async () => {
        for (const modifier of modifiers) {
          const report = toHidReport(modifier);
          logger.debug('Modifier report', { modifier, report });
        }
        logger.debug('Processing keys', { keys });
        for (const key of keys) {
          const report1 = toHidReport(key);
          send({ method: 'keyboardReport', params: report1 });
        }
        send({
          method: 'keyboardReport',
          params: {
            keys: [0, 0, 0, 0, 0, 0],
            modifier: 0,
          },
        });
      }, delay);
    }
  };

  if (macros?.length === 0) return <></>;
  return (
    <div className={cn('flex flex-col gap-2 w-full')}>
      {/* Macro button bar */}
      <div className={cn('flex items-center gap-2  pr-[16px] pl-[32px]')}>
        <div className={cn('flex items-center gap-2')}>
          <Command className={cn('w-4 h-4 text-[var(--text-secondary)]')} />
        </div>

        {macros.map(macro => {
          return (
            <Button
              key={macro.id}
              size="sm"
              variant="default"
              onClick={() => handleMacroClick(macro)}
              disabled={!isChannelReady}
              title={`Execute macro: ${macro.name}\nSteps: ${macro.steps?.length || 0}`}
            >
              {macro.name}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
