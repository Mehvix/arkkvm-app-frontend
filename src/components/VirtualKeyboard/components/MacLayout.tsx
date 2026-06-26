/**
 * Mac Keyboard Layout Component
 * Includes main keyboard area + arrow keys at the bottom right
 */
import React from 'react';
import Key from './Key';
import type { KeyRow } from '../data/keyboard-types';
import type { VirtualKeyboardModifierState } from '../utils/modifierStateManager';

export interface MacLayoutProps {
  keyRows: KeyRow[]
  specialKeys: KeyRow
  arrowKeys: KeyRow
  safeModifierKeys: VirtualKeyboardModifierState
  getDisplayLabel: (key: unknown) => string | string[] | undefined
  checkKeyPressed: (keyCode: string) => boolean
  handleModifierKeyDown: (keyCode: string, label?: string) => void
  handleKeyDown: (keyCode: string, label?: string) => void
  handleKeyUp: (keyCode: string, label?: string) => void
  pressedKeyColor: string
}

const MacLayout: React.FC<MacLayoutProps> = ({
  keyRows,
  specialKeys,
  arrowKeys,
  safeModifierKeys,
  getDisplayLabel,
  checkKeyPressed,
  handleModifierKeyDown,
  handleKeyDown,
  handleKeyUp,
  pressedKeyColor,
}) => {
  return (
    <div className="relative z-0 keyboard-container w-full flex flex-1 self-stretch">
      <div className="flex-1 flex flex-col gap-[0]">
        {/* Keyboard Rows */}
        {keyRows.map((keys, i) => (
          <div className="flex flex-wrap" key={`keyRow${i}`}>
            {keys.map(key => {
              const isModifier = key.isModifier;
              const displayLabel = key.showDualState
                ? key.label
                : getDisplayLabel(key);
              const globalKeyState = isModifier
                ? safeModifierKeys[
                    key.keyCode as keyof typeof safeModifierKeys
                  ] || false
                : false;
              const isKeyPressed = checkKeyPressed(key.keyCode);

              return (
                <Key
                  key={key.keyCode}
                  keyCode={key.keyCode}
                  label={displayLabel}
                  width={key.width}
                  onKeyDown={isModifier ? handleModifierKeyDown : handleKeyDown}
                  onKeyUp={isModifier ? undefined : handleKeyUp}
                  isActive={globalKeyState}
                  isPressed={isKeyPressed}
                  pressedColor={pressedKeyColor}
                />
              );
            })}
          </div>
        ))}

        {/* Bottom Row: Special Keys + Arrow Keys */}
        <div className="flex flex-wrap w-full items-center">
          {/* Special Keys (Fn, Ctrl, Alt, Cmd, Space, etc.) */}
          {specialKeys.map(key => {
            const isModifier = key.isModifier;
            const displayLabel = getDisplayLabel(key);
            const globalKeyState = isModifier
              ? safeModifierKeys[
                  key.keyCode as keyof typeof safeModifierKeys
                ] || false
              : false;
            const isKeyPressed = checkKeyPressed(key.keyCode);

            return (
              <Key
                key={key.keyCode}
                keyCode={key.keyCode}
                label={displayLabel}
                width={key.width}
                className="p-0 mx-1"
                onKeyDown={isModifier ? handleModifierKeyDown : handleKeyDown}
                onKeyUp={isModifier ? undefined : handleKeyUp}
                isActive={globalKeyState}
                isPressed={isKeyPressed}
                pressedColor={pressedKeyColor}
              />
            );
          })}

          {/* Arrow Keys in T-shape (Mac Style) */}
          <div className="flex flex-col justify-center gap-0 w-1/5 h-10">
            {/* Up Arrow */}
            <div className="w-full grid grid-cols-3 items-center h-1/2">
              <span></span>
              {arrowKeys[0] && (
                <Key
                  keyCode={arrowKeys[0].keyCode}
                  label={arrowKeys[0].appleLabel}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleKeyUp}
                  className="p-0 mx-1 text-[10px]"
                  compact
                  isPressed={checkKeyPressed(arrowKeys[0].keyCode)}
                  pressedColor={pressedKeyColor}
                />
              )}
              <span></span>
            </div>

            {/* Left, Down, Right Arrows */}
            <div className="w-full grid grid-cols-3 h-1/2">
              {arrowKeys[1] && (
                <Key
                  keyCode={arrowKeys[1].keyCode}
                  label={arrowKeys[1].appleLabel}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleKeyUp}
                  className="p-0 mx-1 h-full"
                  compact
                  isPressed={checkKeyPressed(arrowKeys[1].keyCode)}
                  pressedColor={pressedKeyColor}
                />
              )}
              {arrowKeys[2] && (
                <Key
                  keyCode={arrowKeys[2].keyCode}
                  label={arrowKeys[2].appleLabel}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleKeyUp}
                  className="p-0 mx-1 h-full"
                  compact
                  isPressed={checkKeyPressed(arrowKeys[2].keyCode)}
                  pressedColor={pressedKeyColor}
                />
              )}
              {arrowKeys[3] && (
                <Key
                  keyCode={arrowKeys[3].keyCode}
                  label={arrowKeys[3].appleLabel}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleKeyUp}
                  className="p-0 mx-1 h-full"
                  compact
                  isPressed={checkKeyPressed(arrowKeys[3].keyCode)}
                  pressedColor={pressedKeyColor}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MacLayout;
