export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const backendUrl = new URL(env.BACKEND_URL);

    backendUrl.pathname = url.pathname;
    backendUrl.search = url.search;

    const headers = new Headers(request.headers);
    headers.delete("host");

    return fetch(new Request(backendUrl, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
      redirect: "follow",
    }));
  },
};
