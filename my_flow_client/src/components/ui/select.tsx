'use client';

import {
  Label,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/react';
import { cn } from '@/lib/utils';

export {
  Label as SelectLabel,
  Listbox as Select,
  ListboxButton as SelectTrigger,
  ListboxOption as SelectItem,
  ListboxOptions as SelectContent,
};

// Re-export utility for classNames composition
export { cn as selectCn };
