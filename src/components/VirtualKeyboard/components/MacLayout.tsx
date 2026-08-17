/**
 * Mac Keyboard Layout Component
 * Includes main keyboard area + arrow keys at the bottom right
 */
import React, { memo } from 'react';
import type { KeyboardLayout } from '../data/keyboard-types';
import type { VirtualKeyboardModifierState } from '../utils/modifierStateManager';
import { Keycap } from './Keycap';

export interface MacLayoutProps extends VirtualKeyboardModifierState {
  layout: KeyboardLayout;
  checkKeyPressed: (keyCode: string) => boolean;
  handleModifierKeyDown: (keyCode: string, label?: string) => void;
  handleModifierKeyUp: (keyCode: string, label?: string) => void;
  handleKeyDown: (keyCode: string, label?: string) => void;
  handleKeyUp: (keyCode: string, label?: string) => void;
  pressedKeyColor: string;
}

const MacLayout: React.FC<MacLayoutProps> = ({
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

  const allRows = layout.rows;
  const mainKeyboardRows = allRows.slice(0, -1); // All rows except the last one
  const arrowKeysRow = allRows[allRows.length - 1]; // Last row for arrow keys

  // Helper function to calculate key active state
  const getKeyActiveState = (keyCode: string): boolean => {
    if (keyCode === 'AltGr') {
      return AltGr;
    } else if (keyCode === 'CapsLock') {
      return CapsLock;
    } else if (
      keyCode.startsWith('Shift') ||
      keyCode.startsWith('Control') ||
      keyCode.startsWith('Alt') ||
      keyCode.startsWith('Meta')
    ) {
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
      return modifierStateMap[keyCode as keyof typeof modifierStateMap] || false;
    }
    return false;
  };

  return (
    <div className="relative z-0 keyboard-container w-full flex flex-1 flex-col md:flex-row self-stretch">
      {/* Main Keyboard Area */}
      <div className="flex-1 flex flex-col gap-0">
        {/* Main Keyboard Rows (excluding arrow keys row) */}
        {mainKeyboardRows.map((keyRow, rowIndex) => (
          <div className="flex flex-nowrap relative" key={`mainRow${rowIndex}`}>
            {keyRow.map(keyDefinition => {
              const isKeyPressed = checkKeyPressed(keyDefinition.keyCode);
              const isActive = getKeyActiveState(keyDefinition.keyCode);

              return (
                <Keycap
                  key={keyDefinition.keyCode}
                  keyDef={keyDefinition}
                  onKeyDown={keyDefinition.isModifier ? handleModifierKeyDown : handleKeyDown}
                  onKeyUp={keyDefinition.isModifier ? handleModifierKeyUp : handleKeyUp}
                  isActive={isActive}
                  isPressed={isKeyPressed}
                  pressedColor={pressedKeyColor}
                  shiftActive={ShiftLeft || ShiftRight}
                  capsLockActive={CapsLock}
                  altGrActive={AltGr}
                />
              );
            })}
          </div>
        ))}

        {/* Arrow Keys Row */}
        <div className="flex flex-nowrap relative items-start">
          {arrowKeysRow.map(keyDefinition => {
            const isKeyPressed = checkKeyPressed(keyDefinition.keyCode);
            const isActive = getKeyActiveState(keyDefinition.keyCode);

            return (
              <Keycap
                key={keyDefinition.keyCode}
                keyDef={keyDefinition}
                onKeyDown={keyDefinition.isModifier ? handleModifierKeyDown : handleKeyDown}
                onKeyUp={keyDefinition.isModifier ? handleModifierKeyUp : handleKeyUp}
                isActive={isActive}
                isPressed={isKeyPressed}
                pressedColor={pressedKeyColor}
                shiftActive={ShiftLeft || ShiftRight}
                capsLockActive={CapsLock}
                altGrActive={AltGr}
              />
            );
          })}

          {/* T-Shaped Arrow Keys Layout */}
          <div
            className="flex-2 flex-col items-center justify-center  overflow-hidden gap-py-[4px] my-[2px]"
            style={{ height: 'var(--keycap-height, 40px)' }}
          >
            {/* Up Arrow */}
            <div className="flex-1 flex items-center justify-center h-1/2">
              <Keycap className="h-[calc(100%-4px)]" />
              <Keycap
                key="ArrowUp"
                keyDef={{
                  keyCode: 'ArrowUp',
                  legends: { base: '▴' },
                  width: 1,
                  role: 'navigation',
                }}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                isActive={false}
                isPressed={checkKeyPressed('ArrowUp')}
                pressedColor={pressedKeyColor}
                shiftActive={ShiftLeft || ShiftRight}
                capsLockActive={CapsLock}
                altGrActive={AltGr}
                className="h-[calc(100%-4px)]"
              />
              <Keycap className="h-[calc(100%-4px)]" />
            </div>

            {/* Left, Down, Right Arrows */}
            <div className="flex-1 flex items-center justify-center h-1/2">
              <Keycap
                key="ArrowLeft"
                keyDef={{
                  keyCode: 'ArrowLeft',
                  legends: { base: '◂' },
                  width: 1,
                  role: 'navigation',
                }}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                isActive={false}
                isPressed={checkKeyPressed('ArrowLeft')}
                pressedColor={pressedKeyColor}
                shiftActive={ShiftLeft || ShiftRight}
                capsLockActive={CapsLock}
                altGrActive={AltGr}
                className="h-[calc(100%-4px)]"
              />

              <Keycap
                key="ArrowDown"
                keyDef={{
                  keyCode: 'ArrowDown',
                  legends: { base: '▾' },
                  width: 1,
                  role: 'navigation',
                }}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                isActive={false}
                isPressed={checkKeyPressed('ArrowDown')}
                pressedColor={pressedKeyColor}
                shiftActive={ShiftLeft || ShiftRight}
                capsLockActive={CapsLock}
                altGrActive={AltGr}
                className="h-[calc(100%-4px)]"
              />

              <Keycap
                key="ArrowRight"
                keyDef={{
                  keyCode: 'ArrowRight',
                  legends: { base: '▸' },
                  width: 1,
                  role: 'navigation',
                }}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                isActive={false}
                isPressed={checkKeyPressed('ArrowRight')}
                pressedColor={pressedKeyColor}
                shiftActive={ShiftLeft || ShiftRight}
                capsLockActive={CapsLock}
                altGrActive={AltGr}
                className="h-[calc(100%-4px)]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default memo(MacLayout);
