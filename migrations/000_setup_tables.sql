CREATE TYPE shift_type AS ENUM ('full', 'half');

CREATE TABLE users (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    -- we initially may not have the users display name
    name text,
    is_admin boolean NOT NULL DEFAULT false,
    -- referencing the `users` table in the `auth` schema that we don't manage ourselves.
    auth_id uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now()
);


CREATE TABLE shifts (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users,
    date date NOT NULL,
    type shift_type,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (user_id, date)
);
