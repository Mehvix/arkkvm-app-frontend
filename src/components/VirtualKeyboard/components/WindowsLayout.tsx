/**
 * Windows Keyboard Layout Component
 * Includes main keyboard area + navigation keys + arrow keys on the right
 */
import React, { memo } from 'react';
import type { KeyboardLayout } from '../data/keyboard-types';
import type { VirtualKeyboardModifierState } from '../utils/modifierStateManager';
import { Keycap } from './Keycap';

export interface WindowsLayoutProps extends VirtualKeyboardModifierState {
  layout: KeyboardLayout
  checkKeyPressed: (keyCode: string) => boolean
  handleModifierKeyDown: (keyCode: string, label?: string) => void
  handleModifierKeyUp: (keyCode: string, label?: string) => void
  handleKeyDown: (keyCode: string, label?: string) => void
  handleKeyUp: (keyCode: string, label?: string) => void
  pressedKeyColor: string
}

const WindowsLayout: React.FC<WindowsLayoutProps> = ({
  layout,
  checkKeyPressed,
  handleModifierKeyDown,
  handleModifierKeyUp,
  handleKeyDown,
  handleKeyUp,
  pressedKeyColor,
  CapsLock = false,
  ShiftLeft = false,
  ShiftRight = false,
  ControlLeft = false,
  ControlRight = false,
  AltLeft = false,
  AltRight = false,
  AltGr = false,
  MetaLeft = false,
  MetaRight = false,
}) => {
  // Error handling: if layout doesn't exist, return null
  if (!layout || !layout.rows || !Array.isArray(layout.rows)) {
    return null;
  }
  const keyRows = layout.rows;
  const rightPanel = layout.rightPanel;
  return (
    <div className="relative z-0 keyboard-container w-full flex flex-1 flex-col md:flex-row self-stretch">
      {/* Main Keyboard Area */}
      <div className="flex-1 flex flex-col gap-0">
        {/* Keyboard Rows */}
        {keyRows.map((keys, rowIndex) => (
          <div
            className="flex flex-nowrap relative"
            key={`keyRow${rowIndex}`}
          >
            {keys.map(key => {

              const isKeyPressed = checkKeyPressed(key.keyCode);

              // Calculate active state
              let isActive = false;
              if (key.keyCode === 'AltGr') {
                isActive = AltGr;
              } else if (key.keyCode === 'CapsLock') {
                isActive = CapsLock;
              } else if (key.isModifier) {
                const modifierStateMap = {
                  ShiftLeft,
                  ShiftRight,
                  ControlLeft,
                  ControlRight,
                  AltLeft,
                  AltRight,
                  MetaLeft,
                  MetaRight,
                };
                isActive = modifierStateMap[key.keyCode] || false;
              }

              return (
                <Keycap
                  key={key.keyCode}
                  keyDef={key}
                  onKeyDown={key.isModifier ? handleModifierKeyDown : handleKeyDown}
                  onKeyUp={key.isModifier ? handleModifierKeyUp : handleKeyUp}
                  isActive={isActive}
                  isPressed={isKeyPressed}
                  pressedKeyColor={pressedKeyColor}
                  shiftActive={ShiftLeft || ShiftRight}
                  capsLockActive={CapsLock}
                  altGrActive={AltGr}
                   className='m-0'
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Right Side: Navigation Keys Panel */}
      {rightPanel && rightPanel?.length > 0 ? (
        <div className="w-full md:w-1/5 hidden md:flex flex-col self-stretch ml-[10px] gap-0">
          {/* Right Panel Grid - 2 columns */}
          {layout.rightPanel.map((keys, rowIndex) => (
            <div
              key={`rightPanel-row-${rowIndex}`}
              className="flex flex-nowrap min-h-[44px]"
            >
              {keys.map(key => {
                if (key.keyCode.startsWith('__vk_spacer__')) {
                  return (
                    <div
                      key={key.keyCode}
                      className={`m-[2px] flex-[${key.width || 1}_1_0%]`}
                    />
                  );
                }


                const isKeyPressed = checkKeyPressed(key.keyCode);

                return (
                  <Keycap
                    key={key.keyCode}
                    keyDef={key}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyUp}
                    isPressed={isKeyPressed}
                    pressedKeyColor={pressedKeyColor}
                    shiftActive={ShiftLeft || ShiftRight}
                    capsLockActive={CapsLock}
                    altGrActive={AltGr}
                    className='m-0'
                  />
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};
export default memo(WindowsLayout);
