# Add employee nickname feature

- Add a nullable `nickname` column (text) to the `users` table. Create a new migration file following the existing naming convention in `migrations/`. No character limit enforced at the DB level.

- After adding the migration, stop and let ME regenerate the Supabase types so the `nickname` column is reflected in the TypeScript types. 

- In any calendar view (`ShiftTag` or `MobileShiftTag`) where we display a user's name, the priority order should be: `nickname ?? name ?? email`.

- Currently the display name is computed inline in multiple places (components, data layer functions). Introduce small utility functions: 
  ```ts
  function displayName(user: { nickname?: string | null; name?: string | null; email: string }): string
  
  function fullName(user: { nickname?: string | null; name?: string | null; email: string }): string
  ```
  
  Put these in `src/lib/users.ts` and use them consistently across the codebase. Search for all instances of `user.name ?? user.email`, `u.name ?? u.email`, `entry.userName`, etc. and replace them with calls to the correct function.
  
  The places this affects include:
  - `src/lib/admin-grid.ts` -- the `shiftsToGrid` function sets `userName` on `CellEntry` (displayName)
  - `src/components/ShiftTag` (displayName)
  - `src/components/MobileShiftTag` (displayName)
  - `src/components/AddEmployeeCombobox.tsx` -- displays user names in the dropdown (fullName)
  - `src/components/AddEmployeeDrawer.tsx` -- displays user names in the drawer list (fullName)
  - `src/routes/_authenticated/admin/users.tsx` -- displays user names in the user list and in toast messages (fullName)
  - `src/routes/_authenticated/admin/index.tsx` -- toast messages referencing users (fullName)
  - Any other files that display user names (search the codebase)


- In `src/routes/_authenticated/admin/users.tsx`, add the ability for admins to set a nickname for each user. The UI should:

- Show an inline editable field for the nickname on each user row (always visible, but empty if no nickname exists)
- Include helper text like "3-8 chars works best" as a subtle hint, not a hard validation
- Save the nickname to the database when the admin confirms (blur or Enter)
- Use `toast.promise` with the existing error handling pattern (see how `handleToggleAdmin` and `handleRemove` work in that file for the pattern)

You'll need a new function in `src/lib/users.ts`:

```ts
function updateUserNickname(userId: string, nickname: string | null): Promise<void>
```

Follow the same pattern as `updateUserAdmin` in that file -- use `Promise.resolve()` wrapping the Supabase query, throw `AppError` on failure.


- The `CellEntry` interface in `src/lib/admin-grid.ts` has a `userName` field. This should now be populated using the `displayName` utility. The `BasicUser` type in `src/lib/users.ts` needs to include `nickname` in its select query.


Read these files to understand the existing patterns before making changes:

- [@/migrations/ directory] -- existing migration naming convention
- [@/src/lib/users.ts] -- data layer pattern, BasicUser type, existing CRUD functions
- [@/src/lib/api.ts] -- AppError class used for error handling
- [@/src/lib/admin-grid.ts] -- CellEntry interface, shiftsToGrid function
- [@/src/routes/_authenticated/admin/users.tsx] -- user management page, toast.promise pattern
- [@/src/components/AddEmployeeCombobox.tsx] -- displays user names
- [@/src/components/AddEmployeeDrawer.tsx] -- displays user names
- [@/src/components/ToastError.tsx] -- error display component used in toast.promise
