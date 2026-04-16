const API_BASE = "";

function getToken() {
  return localStorage.getItem("token");
}

async function apiFetch(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(API_BASE + endpoint, {
    ...options,
    credentials: "include",
    headers,
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("is_admin");
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw new Error("Session expired");
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

async function checkAuth() {
  try {
    const data = await apiFetch("/api/auth/me");
    return data.user;
  } catch (e) {
    throw e;
  }
}

async function login(username, password) {
  const res = await fetch(API_BASE + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  localStorage.setItem("token", data.token);
  localStorage.setItem("is_admin", data.is_admin);
  if (data.is_admin) {
    window.location.href = "/admin";
  } else {
    window.location.href = "/dashboard";
  }
  return data;
}

async function logout() {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } catch (e) {}
  localStorage.removeItem("token");
  localStorage.removeItem("is_admin");
  window.location.href = "/";
}

window.apiFetch = apiFetch;
window.checkAuth = checkAuth;
window.login = login;
window.logout = logout;