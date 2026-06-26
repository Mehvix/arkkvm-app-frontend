import { cn } from '@/lib/utils';
import React from 'react';

export type SettingBlockProps = {
  title: React.ReactNode
  /**
   * Prefer using children as the content slot under the title.
   * `content` prop is kept for backward compatibility.
   */
  content?: React.ReactNode
  right?: React.ReactNode
  className?: string
  /**
   * Vertical alignment of left vs right area.
   * Default: "center"
   */
  align?: 'start' | 'center'
  /**
   * Whether to render a subtle bottom separator line.
   */
  separator?: boolean
  children?: React.ReactNode
  /**
   * Title font size - can be CSS class or number (px)
   */
  titleSize?: string | number
  /**
   * Content/description font size - can be CSS class or number (px)
   */
  contentSize?: string | number
  /**
   * Bottom padding - can be CSS class or number (px). Default: 24
   */
  paddingBottom?: string | number
}

/**
 * A reusable settings row block with a left area (title + content)
 * and a right area for controls (switches, buttons, etc.).
 */
type RightSlotProps = { children?: React.ReactNode; className?: string }
type BottomSlotProps = { children?: React.ReactNode; className?: string }

function SettingBlockRight({ children, className }: RightSlotProps) {
  return <div className={cn('', className)}>{children}</div>;
}
SettingBlockRight.displayName = 'SettingBlockRight';

function SettingBlockBottom({ children, className }: BottomSlotProps) {
  return (
    <div
      className={cn(
        'mt-[10px] w-full text-[var(--inactive-text-color)] font-xs',
        className
      )}
    >
      {children}
    </div>
  );
}
SettingBlockBottom.displayName = 'SettingBlockBottom';

function SettingBlockComp({
  title,
  content,
  right,
  className,
  align = 'center',
  separator = false,
  children,
  titleSize,
  contentSize,
  paddingBottom = 24,
}: SettingBlockProps) {
  const childArray = React.Children.toArray(children);
  let rightFromSlot: React.ReactNode | undefined;
  let bottomFromSlot: React.ReactNode | undefined;
  const contentNodes: React.ReactNode[] = [];

  childArray.forEach(child => {
    if (React.isValidElement(child)) {
      // Check whether this is SettingBlock.Right
      if (
        child.type === SettingBlockRight ||
        (child.type as React.ComponentType & { displayName?: string })?.displayName === 'SettingBlockRight'
      ) {
        // Preserve full element so internal wrapper div/className remain effective
        rightFromSlot = child;
      }
      // Check whether this is SettingBlock.Bottom
      else if (
        child.type === SettingBlockBottom ||
        (child.type as React.ComponentType & { displayName?: string })?.displayName === 'SettingBlockBottom'
      ) {
        // Preserve full element to keep className and nested structure
        bottomFromSlot = child;
      }
      // Treat remaining content as normal body content
      else {
        contentNodes.push(child as React.ReactNode);
      }
    } else {
      contentNodes.push(child as React.ReactNode);
    }
  });

  // Helper function to convert size to style
  const getSizeStyle = (
    size?: string | number,
    property: string = 'fontSize'
  ) => {
    if (typeof size === 'number') {
      return { [property]: `${size}px` };
    }
    return {};
  };

  // Helper function to get size class
  const getSizeClass = (size?: string | number, defaultClass: string = '') => {
    if (typeof size === 'string') {
      return size;
    }
    return defaultClass;
  };

  const leftContent =
    contentNodes.length > 0 ? (
      <div
        className={cn(
          'mt-1 leading-6 text-[var(--inactive-text-color)]',
          getSizeClass(contentSize, 'text-sm ')
        )}
        style={getSizeStyle(contentSize)}
      >
        {contentNodes}
      </div>
    ) : content ? (
      <div
        className={cn(
          'mt-1 leading-6 font-[400] text-[var(--inactive-text-color)]',
          getSizeClass(contentSize, 'text-sm ')
        )}
        style={getSizeStyle(contentSize)}
      >
        {content}
      </div>
    ) : null;

  const rightContent =
    rightFromSlot ??
    (right ? <SettingBlockRight>{right}</SettingBlockRight> : null);
  const bottomContent = bottomFromSlot ?? null;
  return (
    <div
      className={
        typeof paddingBottom === 'string' ? paddingBottom : 'pb-[24px]'
      }
      style={
        typeof paddingBottom === 'number'
          ? { paddingBottom: `${paddingBottom}px` }
          : undefined
      }
    >
      <div
        className={cn(
          'flex w-full justify-between gap-6',
          align === 'center' ? 'items-center' : 'items-start',
          className
        )}
        style={
          separator
            ? {
                borderBottom: '1px solid',
                borderBottomColor:
                  'color-mix(in srgb, var(--border-color) 50%, transparent)',
              }
            : undefined
        }
      >
        {/* Left: title + content */}
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              'leading-6 text-[var(--text-color)]',
              getSizeClass(titleSize, 'text-base')
            )}
            style={getSizeStyle(titleSize)}
          >
            {title}
          </div>
          <div className="text-[var(--inactive-text-color)]">{leftContent}</div>
        </div>

        {/* Right: controls */}
        {rightContent ? <div className="shrink-0">{rightContent}</div> : null}
      </div>
      {bottomContent}
    </div>
  );
}

const SettingBlock = Object.assign(SettingBlockComp, {
  Right: SettingBlockRight,
  Bottom: SettingBlockBottom,
});

export { SettingBlock, SettingBlockBottom, SettingBlockRight };
export default SettingBlock;
