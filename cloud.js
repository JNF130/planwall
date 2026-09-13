/* PlanWall Stage A — Supabase save. Parses the login-link token in the address bar. */
(function () {
  const cfg = window.PLANWALL_CLOUD || {};
  const SITE = 'https://jnf130.github.io/planwall/';
  const status = () => document.getElementById('saveLabel');
  function say(msg) { const el = status(); if (el) el.textContent = msg; }

  function configured() {
    return !!(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);
  }

  let client = null;
  function getClient() {
    if (!configured()) return null;
    if (!client) {
      client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        auth: { detectSessionInUrl: true, persistSession: true, autoRefreshToken: true, flowType: 'implicit' }
      });
    }
    return client;
  }

  async function currentUser() {
    const sb = getClient();
    if (!sb) return null;
    const sess = await sb.auth.getSession();
    if (sess && sess.data && sess.data.session && sess.data.session.user) {
      return sess.data.session.user;
    }
    const u = await sb.auth.getUser();
    return u && u.data && u.data.user;
  }

  async function absorbLoginLink() {
    const sb = getClient();
    if (!sb) return;
    if (location.hash && location.hash.indexOf('access_token') !== -1) {
      const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
      const access_token = hash.get('access_token');
      const refresh_token = hash.get('refresh_token');
      if (access_token && refresh_token) {
        await sb.auth.setSession({ access_token, refresh_token });
      } else {
        await sb.auth.getSession();
      }
      history.replaceState(null, '', SITE);
    }
    const user = await currentUser();
    if (user) say('Cloud signed in · ' + (user.email || 'ok'));
  }

  window.planwallCloud = {
    ready: configured,
    async signIn(email) {
      const sb = getClient();
      if (!sb) { alert('Cloud save is not set up yet. Add Supabase keys to config.js.'); return; }
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: SITE }
      });
      if (error) alert(error.message);
      else alert('Check your email for a login link, then click it. After the board reloads, use Cloud save.');
    },
    async signOut() {
      const sb = getClient();
      if (sb) await sb.auth.signOut();
      say('Signed out of cloud');
    },
    async save(payload, projectName) {
      const sb = getClient();
      const user = await currentUser();
      if (!sb || !user) {
        alert('Sign in first (File → Cloud sign-in). Until then, use 2 · Save board file.');
        return false;
      }
      const name = projectName || 'board';
      const row = {
        user_id: user.id,
        name,
        data: payload,
        updated_at: new Date().toISOString()
      };
      const { error } = await sb.from('boards').upsert(row, { onConflict: 'user_id,name' });
      if (error) { alert('Cloud save failed: ' + error.message); return false; }
      say('Saved to cloud · ' + name);
      try { localStorage.setItem('planwall-last-cloud-name', name); } catch (e) {}
      return true;
    },
    async load(projectName) {
      const sb = getClient();
      const user = await currentUser();
      if (!sb || !user) {
        alert('Sign in first (File → Cloud sign-in).');
        return null;
      }
      const name = projectName || localStorage.getItem('planwall-last-cloud-name') || 'board';
      const { data, error } = await sb.from('boards').select('data,name,updated_at').eq('user_id', user.id).eq('name', name).maybeSingle();
      if (error) { alert('Cloud load failed: ' + error.message); return null; }
      if (!data) { alert('No cloud board named “' + name + '” yet. Save first.'); return null; }
      say('Loaded from cloud · ' + data.name);
      return data.data;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', absorbLoginLink);
  } else {
    absorbLoginLink();
  }
})();
