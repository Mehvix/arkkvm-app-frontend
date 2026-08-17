/*
 * @Author: zhanglei
 * @Date: 2025-11-03 14:42:12
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-07-09 18:59:46
 */
/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-11-03 14:42:12
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-01-29 15:17:39
 */
import React from 'react';
import type { KeyLabelProps } from '../types';

/**
 * Key label renderer component
 *
 * Handles different types of key labels:
 * - String labels: Simple text display
 * - Array labels: Dual-state display (e.g., shift states)
 * - React node labels: Custom components (e.g., icons)
 *
 * @param label - The label content to render
 * @param isStringLabel - Whether the label is a string
 * @param isArrayLabel - Whether the label is an array
 * @param showDualState - Whether to show both states (default: true, shows primary faded + secondary bold)
 */
export const KeyLabel: React.FC<
  KeyLabelProps & { showDualState?: boolean }
> = ({ label, isStringLabel, isArrayLabel, showDualState = true }) => {

  if (isArrayLabel) {
    const [primary, secondary] = label as string[];

    // Error handling: if layout doesn't exist, return null state, only display secondary (shift state value)
    if (!showDualState) {
      return <>{secondary}</>;
    }

    // Show dual state: shift character small on top, base character large on bottom (standard keyboard layout)
    return (
      <span className="flex flex-col leading-tight items-center w-full p-[10px] relative text-base">
        <span className="opacity-60 text-[10px] text-left w-full text-[--text-secondary] absolute top-[4px] left-[10px]" aria-hidden="true">
          {secondary}
        </span>
        <span className="text-text">{primary}</span>
      </span>
    );
  }

  if (isStringLabel) {
    return <>{label as string}</>;
  }

  return <>{label as React.ReactNode}</>;
};
