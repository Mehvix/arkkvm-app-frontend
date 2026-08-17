import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

import { languageLayoutOptions, type LayoutOption } from '../data/language-layouts';

interface KeyboardLanguageSelectProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

function KeyboardLanguageTag({ tag }: { tag: string }) {
  return (
    <span className="inline-flex h-[18px] min-w-[30px] shrink-0 items-center justify-center rounded-[5px] border border-[var(--btn-outline-border)] bg-[var(--btn-outline-bg)] px-1.5 text-[10px] font-bold leading-none text-[var(--text-color)]">
      {tag}
    </span>
  );
}

function KeyboardLanguageLabel({ option }: { option: LayoutOption }) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-2">
      <span className="truncate">{option.nativeName}</span>
      <span className="ml-auto shrink-0 text-[10px] font-medium uppercase text-[var(--inactive-text-color)]">
        {option.layout}
      </span>
    </span>
  );
}

export function KeyboardLanguageSelect({
  value,
  onChange,
  className,
}: KeyboardLanguageSelectProps) {
  if (languageLayoutOptions.length === 0) return null;

  const selectedOption = languageLayoutOptions.find(option => option.id === value);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        size="xs"
        className={cn('w-[220px] sm:w-[260px]', className)}
      >
        <SelectValue>
          {selectedOption && (
            <>
              <KeyboardLanguageTag tag={selectedOption.tag} />
              <span className="truncate">{selectedOption.nativeName}</span>
            </>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="z-[10000] min-w-[260px]">
        {languageLayoutOptions.map(option => (
          <SelectItem key={option.id} value={option.id} className="pr-8">
            <KeyboardLanguageTag tag={option.tag} />
            <KeyboardLanguageLabel option={option} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
