/**
 * Worker « keep-alive » : ping quotidien de la base Supabase.
 *
 * Le plan Free met en pause un projet après ~7 jours de faible activité — ce
 * qui arriverait pendant les vacances scolaires (juillet-août), coupant le
 * dashboard et les apps mobiles. Une requête par jour suffit à l'éviter.
 *
 * À supprimer le jour où le projet passe en plan Pro (plus de mise en pause).
 */

type Env = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
};

async function ping(env: Env): Promise<{ ok: boolean; status: number; detail: string }> {
  // Requête volontairement triviale : on ne lit aucune donnée métier.
  const url = `${env.SUPABASE_URL}/rest/v1/organisations?select=id&limit=1`;
  const res = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
    },
  });
  // 200 (RLS laisse passer) ou 401/403 (RLS bloque) prouvent tous deux que la
  // base répond — c'est tout ce qui compte pour l'anti-pause.
  const vivante = res.status < 500;
  return { ok: vivante, status: res.status, detail: vivante ? "base active" : await res.text() };
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      ping(env).then((r) => {
        console.log(`[keepalive] ${r.status} — ${r.detail}`);
        if (!r.ok) console.error("[keepalive] la base ne répond pas !");
      })
    );
  },

  // Permet de vérifier à la main : curl https://orety-keepalive.<sous-domaine>.workers.dev
  async fetch(_req: Request, env: Env): Promise<Response> {
    const r = await ping(env);
    return Response.json({ ...r, verifie_le: new Date().toISOString() }, { status: r.ok ? 200 : 503 });
  },
};
