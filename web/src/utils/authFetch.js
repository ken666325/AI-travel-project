// src/utils/authFetch.js
export const authFetch = (url, options = {}) => {
  const token = localStorage.getItem("token");

  return fetch(`https://potential-space-spork-wrwvq74x64r63v4q-5000.app.github.dev${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
};