import { useState } from "react";
import type { BasicUser } from "@/lib/users";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface AddEmployeeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: BasicUser[];
  existingUserIds: Set<string>;
  onSelect: (user: BasicUser) => void;
}

export function AddEmployeeDrawer({
  open,
  onOpenChange,
  users,
  existingUserIds,
  onSelect,
}: AddEmployeeDrawerProps) {
  const [search, setSearch] = useState("");

  const available = users.filter(
    (u) =>
      !existingUserIds.has(u.id) &&
      (u.name ?? u.email).toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelect = (user: BasicUser) => {
    onSelect(user);
    setSearch("");
    onOpenChange(false);
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) setSearch("");
        onOpenChange(next);
      }}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Add employee</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6">
          <Input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-3"
            autoFocus
          />
          <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
            {available.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleSelect(u)}
                className="rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted active:bg-muted"
              >
                {u.name ?? u.email}
              </button>
            ))}
            {available.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No employees available
              </p>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
