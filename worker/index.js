export default {
  async fetch(req) {
    const u = new URL(req.url);
    const h = {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store"};
    if (u.pathname === "/new_sales.json") return new Response("[]", {headers: h});
    return new Response(JSON.stringify({generated_at: null, closet: "", counts: {available: 0, sold: 0, sold_total_on_closet: 0}, available: [], sold: []}), {headers: h});
  }
};
