export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = url.searchParams.get("url");
    if (!target) {
      return new Response("Missing url parameter", { status: 400 });
    }
    let targetUrl;
    try {
      targetUrl = new URL(target);
    } catch (e) {
      return new Response("Invalid url parameter", { status: 400 });
    }
    // Limite ce relais aux agendas Google — évite qu'il serve de proxy ouvert à n'importe
    // quelle adresse (abus, spam, contournement d'autres protections).
    if (targetUrl.hostname !== "calendar.google.com") {
      return new Response("Domain not allowed", { status: 403 });
    }
    const resp = await fetch(targetUrl.toString());
    const body = await resp.text();
    return new Response(body, {
      status: resp.status,
      headers: {
        "content-type": "text/calendar; charset=utf-8",
        "access-control-allow-origin": "*",
      },
    });
  },
};
