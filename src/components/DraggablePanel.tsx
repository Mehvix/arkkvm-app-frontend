/**
 * Draggable Panel - Floating draggable container component
 *
 * @author zhanglei
 */

import { Maximize2, Minimize2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface DraggablePanelProps {
  title?: string
  children: React.ReactNode
  isOpen: boolean
  onClose: () => void
  defaultPosition?: { x: number; y: number }
  className?: string
  /** Whether to show header with title and controls (default: true) */
  showHeader?: boolean
  /** Custom width, 'auto' for content-based width (default: '540px') */
  width?: string | number
}

export function DraggablePanel({
  title = 'Panel',
  children,
  isOpen,
  onClose,
  defaultPosition = { x: 100, y: 100 },
  className = '',
  showHeader = true,
  width = '540px',
}: DraggablePanelProps) {
  const [position, setPosition] = useState(defaultPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isMaximized, setIsMaximized] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>()

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return

    if ((e.target as HTMLElement).closest('.drag-handle')) {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      })
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current)
        }

        rafRef.current = requestAnimationFrame(() => {
          const newX = e.clientX - dragStart.x
          const newY = e.clientY - dragStart.y

          const maxX =
            window.innerWidth - (panelRef.current?.offsetWidth || 540)
          const maxY =
            window.innerHeight - (panelRef.current?.offsetHeight || 600)

          setPosition({
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(0, Math.min(newY, maxY)),
          })
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [isDragging, dragStart])

  if (!isOpen) return null

  return (
    <>
      {}
      {isDragging && (
        <div
          className="fixed inset-0 z-[9998] cursor-move select-none"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.01)',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
          onMouseMove={e => {
            e.preventDefault()
          }}
        />
      )}

      <div
        ref={panelRef}
        data-draggable-panel="true"
        className={`fixed bg-white dark:bg-gray-800 shadow-2xl z-[9999] border border-gray-200 dark:border-gray-700 ${
          isDragging ? '' : 'transition-all duration-300'
        } ${isMaximized ? 'rounded-none' : 'rounded-xl'} ${className}`}
        style={
          isMaximized
            ? {
                left: 0,
                top: 0,
                width: '100vw',
                height: '100vh',
              }
            : {
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: width,
                maxHeight: '80vh',
              }
        }
        onMouseDown={handleMouseDown}
      >
        {}
        {showHeader && (
          <div
            className={`drag-handle flex items-center justify-between px-5 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${
              isMaximized
                ? 'rounded-none cursor-default'
                : 'rounded-t-xl cursor-move'
            }`}
          >
            <div className="flex items-center gap-1">
              {}
              <button
                onClick={toggleMaximize}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title={isMaximized ? 'Restore' : 'Maximize'}
              >
                {isMaximized ? (
                  <Minimize2
                    size={16}
                    className="text-gray-500 dark:text-gray-400"
                  />
                ) : (
                  <Maximize2
                    size={16}
                    className="text-gray-500 dark:text-gray-400"
                  />
                )}
              </button>
              {}
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Close"
              >
                <X size={16} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
        )}

        {}
        <div
          className={`overflow-y-auto bg-white dark:bg-gray-800 ${
            showHeader
              ? `px-5 py-4 ${isMaximized ? 'rounded-none' : 'rounded-b-xl'}`
              : isMaximized
                ? 'rounded-none'
                : 'rounded-xl'
          }`}
          style={{
            height: isMaximized
              ? showHeader
                ? 'calc(100vh - 57px)'
                : '100vh'
              : 'auto',
            maxHeight: isMaximized
              ? showHeader
                ? 'calc(100vh - 57px)'
                : '100vh'
              : showHeader
                ? 'calc(80vh - 60px)'
                : '80vh',
          }}
        >
          {children}
        </div>

        {}
        {isDragging && (
          <div className="absolute inset-0 bg-blue-500/5 rounded-xl pointer-events-none ring-2 ring-blue-400/50" />
        )}
      </div>
    </>
  )
}
