🔒 Admin Panel – Reset User Password Button
We need to allow Admins to reset any user's password to a default value (12345678) with one click. Here's how this should work:

✅ UI & Flow
On the User Management page (Admin panel), in the Actions column where we already have Edit and Delete buttons, add a new button labeled something like Reset Password.

When clicked, a confirmation modal should appear with a clear message (e.g., “Are you sure you want to reset this user's password to 12345678?”).

After confirmation, the password will be reset in two places:

In the public.users.password column

In the auth.users.encrypted_password column

⚠️ Remember: auth.users.encrypted_password must be hashed using the same encryption Supabase uses (bcrypt). Just setting it to plaintext like '12345678' will break login.

🧠 Backend Logic
Update public.users.password to '12345678'

Update auth.users.encrypted_password to the bcrypt hash of '12345678'

You’ll need a backend RPC or server-side function (like in Supabase Edge Functions or API route) to perform this safely and securely for both tables.

