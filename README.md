# PlanWall Stage A — host + cloud save

You already have a GitHub login. Use that. Do not invent a second account.

## Domain names (buy later — GitHub Pages works first)

Check these on Namecheap or Google Domains before you pay:

| Name | Why |
|---|---|
| **planwall.app** | Best match. `.app` forces https. |
| **getplanwall.com** | Cheap fallback if `.app` is taken or pricey |
| **planwallhq.com** | Fine if the short ones are gone |
| **tnplanwall.com** | Local if you only serve shops you know |

Avoid: `pullplan.com` (already a product), `touchplan` anything.

Until you buy a domain, the site will be:

`https://YOUR-GITHUB-USERNAME.github.io/planwall/`

## 1. First time on GitHub (about 15 minutes)

1. Sign in at github.com
2. Green **New repository**
3. Name: `planwall`
4. Public
5. Create repository
6. On the empty repo page: **uploading an existing file**
7. Drop **every file** from this `planwall-web` folder:
   - index.html
   - manifest.webmanifest
   - icon.svg
   - sw.js
   - config.js
   - cloud.js
8. Commit
9. Repo **Settings → Pages**
10. Source: **Deploy from a branch** → `main` → `/ (root)` → Save
11. Wait one minute. Open  
    `https://YOUR-GITHUB-USERNAME.github.io/planwall/`

Chrome: **Install PlanWall** if the browser offers it.

## 2. Supabase (do this after the site opens)

1. Create a free account at supabase.com
2. **New project** — name `planwall`, pick a region, save the database password
3. **SQL Editor → New query**, paste and Run:

```sql
create table if not exists public.boards (
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  data jsonb not null,
  updated_at timestamptz default now(),
  primary key (user_id, name)
);
alter table public.boards enable row level security;
create policy "own boards" on public.boards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

4. **Authentication → Providers** — leave Email on
5. **Authentication → URL configuration** — add your GitHub Pages URL to Redirect URLs
6. **Project Settings → API**
   - Project URL
   - anon public key
7. Edit `config.js` on GitHub (pencil icon):

```js
window.PLANWALL_CLOUD = {
  supabaseUrl: 'https://YOURPROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_ANON_KEY'
};
```

8. Commit. Refresh the live site.

## 3. Use it

File → **Cloud sign-in…** → your email → open the mail link  
File → **Cloud save** → name the board (`daycare`)  
On the other PC: same site URL → sign in same email → **Cloud load**

JSON download still works as a spare tire.

## If something fails

- Site 404: wait, or check Pages source is `main` / root
- Cloud save alert about keys: `config.js` still empty
- Email link does nothing: add the Pages URL under Supabase Redirect URLs
- Second PC shows an old board: hard refresh (Ctrl+Shift+R)
