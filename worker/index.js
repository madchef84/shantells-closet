// Shantell's Closet feed: crawls her PUBLIC Poshmark closet (no login) on a cron and serves posh_feed.json from KV.
// Port of /workspace/inventory/chantel/sync/build_feed.py. Crawl is chunked across cron runs (state in KV) to stay in free-plan CPU limits.
const CLOSET = "https://poshmark.com/closet/shannynicole";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36";
const T = "window.__INITIAL_STATE__=";
const CM = {nwt:"NWT",nwot:"NWOT",boutique:"Boutique",like_new:"Like new",good:"Good",fair:"Fair",poor:"Poor",not_nwt:"Used",ug:"Used - Good",uln:"Used - Like new",uf:"Used - Fair",ue:"Used - Excellent"};
const ORIGINS = ["https://shantells-closet.surge.sh"];
const PAGES_PER_RUN = 2, REFRESH_MIN = 55;

function cors(req, h = {}) {
  const o = req && req.headers.get("Origin");
  h["Access-Control-Allow-Origin"] = ORIGINS.includes(o) ? o : ORIGINS[0];
  h["Vary"] = "Origin"; h["Access-Control-Allow-Methods"] = "GET, OPTIONS"; h["Access-Control-Allow-Headers"] = "*";
  return h;
}
function extract(h) {   // like Python's raw_decode: parse the first complete JSON object after the marker
  const i = h.indexOf(T); if (i < 0) return null;
  const start = h.indexOf("{", i + T.length); if (start < 0) return null;
  let d = 0, inS = false, end = -1;
  for (let k = start; k < h.length; k++) {
    const c = h.charCodeAt(k);
    if (inS) { if (c === 92) k++; else if (c === 34) inS = false; continue; }
    if (c === 34) inS = true; else if (c === 123 || c === 91) d++; else if (c === 125 || c === 93) { if (--d === 0) { end = k + 1; break; } }
  }
  if (end < 0) return null;
  return JSON.parse(h.slice(start, end))["$_closet"]["listingsPostData"];
}
async function getPage(url) {
  let last = "";
  for (let a = 0; a < 3; a++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA, "Accept": "text/html" } });
      last = "HTTP " + r.status; const h = await r.text();
      if (r.ok) { const L = extract(h); if (L) return L; last = "no __INITIAL_STATE__ (" + h.length + " bytes)"; }
    } catch (e) { last = String(e); }
    await new Promise(r => setTimeout(r, 3000));
  }
  throw new Error("Could not read closet page " + url + ": " + last);
}
const price = x => parseFloat((x.price_amount || {}).val || x.price || 0) || 0;
const lurl = x => "https://poshmark.com/listing/" + x.id;
function slimA(x) { return { id: x.id, url: lurl(x), title: x.title || "", price: price(x), size: (x.size_obj || {}).display || x.size || "",
  color: (x.colors || []).map(c => c.name).join(", "), brand: x.brand || "", photo: x.picture_url || ((x.cover_shot || {}).url || ""),
  category: [(x.department || {}).display, (x.category_v2 || {}).display || x.category].filter(Boolean).join(" > "),
  condition: CM[x.condition] || x.condition || "", date_listed: (x.first_published_at || x.created_at || "").slice(0, 10), likes: parseInt(x.like_count || 0) || 0 }; }
function slimS(x) { return { id: x.id, url: lurl(x), title: x.title || "", price: price(x), sold_price_if_available: null,
  sold_date_if_available: ((x.inventory || {}).status_changed_at || "").slice(0, 10) || null, photo: x.picture_url || ((x.cover_shot || {}).url || ""),
  listed: (x.first_published_at || x.created_at || "").slice(0, 10) }; }

async function step(env, force) {
  let st = await env.FEED.get("crawl", "json");
  const meta = (await env.FEED.get("meta", "json")) || {};
  if (!st) {
    const age = meta.last_ok ? (Date.now() - Date.parse(meta.last_ok)) / 60000 : 1e9;
    if (!force && age < REFRESH_MIN) return (quickDue() ? await quick(env) : { idle: true, last_ok: meta.last_ok });
    if (!force && meta.backoff_until && Date.now() < Date.parse(meta.backoff_until)) return { idle: true, backoff_until: meta.backoff_until };
    st = { started: new Date().toISOString(), phase: "available", mx: null, pages: 0, A: [], S: [] };
  }
  const out = { phase: st.phase, pages: [] };
  for (let n = 0; n < PAGES_PER_RUN; n++) {
    const av = st.phase === "available" ? "available" : "sold_out";
    let L;
    try { L = await getPage(`${CLOSET}?availability=${av}` + (st.mx ? `&max_id=${st.mx}` : "")); }
    catch (e) { meta.last_error = String(e).slice(0, 300); meta.last_error_at = new Date().toISOString(); st.fails = (st.fails || 0) + 1;
      if (st.fails >= 3) { await env.FEED.delete("crawl"); meta.backoff_until = new Date(Date.now() + 30 * 60000).toISOString(); } else await env.FEED.put("crawl", JSON.stringify(st));
      await env.FEED.put("meta", JSON.stringify(meta)); out.error = meta.last_error; return out; }
    const arr = st.phase === "available" ? st.A : st.S, seen = new Set(arr.map(x => x.id));
    const nw = (L.data || []).filter(x => !seen.has(x.id));
    for (const x of nw) arr.push(st.phase === "available" ? slimA(x) : slimS(x));
    st.mx = (L.more || {}).next_max_id || null; st.pages++; out.pages.push(av + ":" + nw.length);
    if (!nw.length || !st.mx) {
      if (st.phase === "available") { st.phase = "sold_out"; st.mx = null; }
      else { await finish(env, st, meta); out.done = true; out.counts = meta.counts; return out; }
    }
  }
  await env.FEED.put("crawl", JSON.stringify(st));
  return out;
}

// v1.10: between full crawls, peek at the first page of available listings every 10 min so new listings reach the app fast.
// No KV write unless something new is found (free-plan KV write budget).
const QUICK_EVERY_MIN = 10;
function quickDue() { return new Date().getUTCMinutes() % QUICK_EVERY_MIN === 0; }
async function quick(env) {
  const raw = await env.FEED.get("feed"); if (!raw) return { idle: true };
  const feed = JSON.parse(raw), have = new Set((feed.available || []).map(x => x.url)), sold = new Set((feed.sold || []).map(x => x.url));
  let L; try { L = await getPage(`${CLOSET}?availability=available`); } catch (e) { return { quick: true, error: String(e).slice(0, 200) }; }
  const nw = (L.data || []).map(slimA).filter(x => !have.has(x.url) && !sold.has(x.url)).map(({ id, ...r }) => r);
  if (!nw.length) return { quick: true, new: 0 };
  feed.available = nw.concat(feed.available || []); feed.counts = { ...(feed.counts || {}), available: feed.available.length };
  feed.generated_at = new Date().toISOString().replace(/\.\d+Z$/, "+00:00"); feed.quick_added = nw.length;
  await env.FEED.put("feed", JSON.stringify(feed));
  return { quick: true, new: nw.length };
}

async function finish(env, st, meta) {
  const cutD = new Date(Date.now() - 730 * 864e5).toISOString().slice(0, 10);
  const A = st.A.map(({ id, ...r }) => r);
  const S = st.S.filter(x => ((x.listed > (x.sold_date_if_available || "")) ? x.listed : (x.sold_date_if_available || "")) >= cutD)
    .map(({ id, listed, ...r }) => r);
  const feed = { generated_at: new Date().toISOString().replace(/\.\d+Z$/, "+00:00"), closet: CLOSET,
    counts: { available: A.length, sold: S.length, sold_total_on_closet: st.S.length }, available: A, sold: S };
  // sanity: never replace a good feed with an empty one (e.g. Poshmark served a blank page)
  if (A.length === 0 && (meta.counts || {}).available > 0) { meta.last_error = "crawl returned 0 available listings; kept previous feed"; await env.FEED.delete("crawl"); await env.FEED.put("meta", JSON.stringify(meta)); return; }
  // new-sales detection (same as seen_sold_ids.json / new_sales.json on the box)
  const seenArr = await env.FEED.get("seen_sold_ids", "json");
  const cur = st.S; let newl = [];
  if (seenArr) { const seen = new Set(seenArr); newl = cur.filter(x => !seen.has(x.id)).map(x => ({ title: x.title, url: x.url, price: x.price, sold_date: x.sold_date_if_available })); }
  const allSeen = Array.from(new Set([...(seenArr || []), ...cur.map(x => x.id)])).sort();
  await env.FEED.put("feed", JSON.stringify(feed));
  await env.FEED.put("seen_sold_ids", JSON.stringify(allSeen));
  if (newl.length || !seenArr) await env.FEED.put("new_sales", JSON.stringify(newl));
  meta.last_ok = new Date().toISOString(); meta.counts = feed.counts; meta.crawl_started = st.started; meta.pages = st.pages; meta.new_sales = newl.length; delete meta.last_error; delete meta.backoff_until;
  await env.FEED.put("meta", JSON.stringify(meta));
  await env.FEED.delete("crawl");
}

export default {
  async fetch(req, env, ctx) {
    const u = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req, { "Access-Control-Max-Age": "86400" }) });
    if (u.pathname === "/" || u.pathname === "/posh_feed.json" || u.pathname === "/feed.json") {
      const f = await env.FEED.get("feed");
      if (!f) return new Response(JSON.stringify({ error: "feed not built yet" }), { status: 503, headers: cors(req, { "Content-Type": "application/json" }) });
      return new Response(f, { headers: cors(req, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=300" }) });
    }
    if (u.pathname === "/new_sales.json") return new Response((await env.FEED.get("new_sales")) || "[]", { headers: cors(req, { "Content-Type": "application/json", "Cache-Control": "no-store" }) });
    if (u.pathname === "/status") { const m = (await env.FEED.get("meta", "json")) || {}; const c = await env.FEED.get("crawl", "json");
      return new Response(JSON.stringify({ ...m, crawl_in_progress: c ? { phase: c.phase, pages: c.pages, available: c.A.length, sold: c.S.length } : null, schedule: "cron */2 * * * *; full refresh starts when the feed is 55+ min old (about hourly); quick new-listing check of page 1 every 10 min" }, null, 1), { headers: cors(req, { "Content-Type": "application/json", "Cache-Control": "no-store" }) }); }
    if (u.pathname === "/run" && req.method === "POST") {   // manual trigger, needs the RUN_TOKEN secret
      if (!env.RUN_TOKEN || req.headers.get("Authorization") !== "Bearer " + env.RUN_TOKEN) return new Response("forbidden", { status: 403 });
      return new Response(JSON.stringify(await step(env, u.searchParams.get("force") === "1")), { headers: { "Content-Type": "application/json" } });
    }
    return new Response("not found", { status: 404, headers: cors(req) });
  },
  async scheduled(ev, env, ctx) { ctx.waitUntil(step(env, false)); },
};
