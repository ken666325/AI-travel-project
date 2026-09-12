const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://orange-sniffle-wrwvq74x6q76cvv5v-5000.app.github.dev";

export default API_BASE;