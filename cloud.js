/* PlanWall Stage A — optional Supabase save. Works only after config.js has keys. */
(function () {
  const cfg = window.PLANWALL_CLOUD || {};
  const status = () => document.getElementById('saveLabel');
  function say(msg) { const el = status(); if (el) el.textContent = msg; }

  function configured() {
    return !!(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);
  }

  let client = null;
  function getClient() {
    if (!configured()) return null;
    if (!client) client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    return client;
  }

  async function currentUser() {
    const sb = getClient();
    if (!sb) return null;
    const { data } = await sb.auth.getUser();
    return data && data.user;
  }

  window.planwallCloud = {
    ready: configured,
    async signIn(email) {
      const sb = getClient();
      if (!sb) { alert('Cloud save is not set up yet. Add Supabase keys to config.js.'); return; }
      const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.href } });
      if (error) alert(error.message);
      else alert('Check your email for a login link, then come back to this page.');
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
})();
