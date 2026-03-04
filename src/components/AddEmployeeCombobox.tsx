import { useEffect, useRef } from "react";
import { displayName } from "@/lib/users";
import type { BasicUser } from "@/lib/users";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";

interface AddEmployeeComboboxProps {
  users: BasicUser[];
  existingUserIds: Set<string>;
  onSelect: (user: BasicUser) => void;
  onCancel: () => void;
}

export function AddEmployeeCombobox({
  users,
  existingUserIds,
  onSelect,
  onCancel,
}: AddEmployeeComboboxProps) {
  const available = users.filter((u) => !existingUserIds.has(u.id));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  return (
    <Combobox
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      onValueChange={(val) => {
        const user = available.find((u) => u.id === val);
        if (user) onSelect(user);
      }}
    >
      <ComboboxInput
        ref={inputRef}
        className="w-full h-6 sm:h-8 min-w-0 text-2xs sm:text-xs"
        placeholder="Add employee..."
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
        }}
      />
      <ComboboxContent>
        <ComboboxList>
          {available.map((u) => (
            <ComboboxItem key={u.id} value={u.id}>
              {displayName(u)}
            </ComboboxItem>
          ))}
          {available.length === 0 && (
            <ComboboxEmpty>No employees available</ComboboxEmpty>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
