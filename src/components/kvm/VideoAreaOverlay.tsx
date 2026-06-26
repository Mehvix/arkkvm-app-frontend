import { IconLogo } from '@/assets/icons';
import { cn } from '@/utils';
import type { ReactNode } from 'react';

interface VideoAreaOverlayProps {
  children?: ReactNode
  className?: string
  aspectRatio?: string
}

export function VideoAreaOverlay({ children, className, aspectRatio = '1920/1080' }: VideoAreaOverlayProps) {
  return (
    <div className={cn('absolute inset-0 z-[10] flex items-center justify-center overflow-hidden [container-type:size]', className)}>
      <div
        data-video-area="true"
        className="relative flex items-center justify-center overflow-hidden bg-[var(--bg-secondary)]"
        style={{
          aspectRatio,
          width: `min(100%, calc(100cqh * ${aspectRatio.replace('/', ' / ')}))`,
          maxWidth: '100%',
          maxHeight: '100%',
          border: '1px dashed var(--border-color)',
        }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <IconLogo
            className="absolute bottom-4 right-[-30%] opacity-10 size-[80%]"
            size={800}
          />
        </div>
        <div className="relative z-[1]">
          {children}
        </div>
      </div>
    </div>
  );
}
