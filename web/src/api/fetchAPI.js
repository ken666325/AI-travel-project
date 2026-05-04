const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://potential-space-spork-wrwvq74x64r63v4q-5000.app.github.dev";

export default API_BASE;