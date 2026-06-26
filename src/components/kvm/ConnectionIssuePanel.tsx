/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-10-10 17:22:03
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-02-28 20:45:02
 */
import { IconWarning } from '@/assets/icons';
import { memo, type ReactNode } from 'react';
import { Button } from '../ui/button';

interface ConnectionIssuePanelProps {
  title?: string
  subtitle?: string
  items?: string[]
  actionSlot?: ReactNode
}

const defaultItems = [
  'Ensure the HDMI cable securely connected at both ends',
  'Ensure source device is powered on and outputting a signal',
  'If using an adapter, it\'s compatible and functioning correctly',
];

const ConnectionIssuePanel = ({
  title = 'No HDMI signal detected',
  subtitle,
  items = defaultItems,
  actionSlot,
}: ConnectionIssuePanelProps) => {
  return (
    <div className="text-left px-8 m-auto">
      <IconWarning className="mb-4" />
      <h1 className="text-h1 my-[16px]">{title}</h1>
      {subtitle ? (
        <p className="text-body text-left mb-[12px]">{subtitle}</p>
      ) : null}
      <ul className="text-caption text-left font-[400]">
        {items.map((text, idx) => (
          <li
            key={idx}
            className={idx === items.length - 1 ? undefined : 'mb-[12px]'}
          >
            · {text}
          </li>
        ))}
      </ul>
      {actionSlot ?? (
        <a href="https://arkkvm.com/docs/getting-started/troubleshooting" target="_blank">
          <Button className="mt-4">Learn more →</Button>
        </a>
      )}
    </div>
  );
};
export default memo(ConnectionIssuePanel);
