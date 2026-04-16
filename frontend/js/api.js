const API_BASE = "";
const API_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;

function getToken() {
  return localStorage.getItem("token");
}

// Utility: Fetch with timeout
async function fetchWithTimeout(url, options = {}, timeout = API_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.');
    }
    throw error;
  }
}

// Main API fetch function with retry logic
async function apiFetch(endpoint, options = {}, retryCount = 0) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetchWithTimeout(API_BASE + endpoint, {
      ...options,
      credentials: "include",
      headers,
    });

    // Handle 429 Too Many Requests (Rate Limited)
    if (res.status === 429) {
      let data;
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : { error: 'Too many requests. Please try again later.' };
      } catch (e) {
        data = { error: 'Too many requests. Please try again later.' };
      }
      throw new Error(data.error || 'Rate limited. Please try again later.');
    }

    // Handle 401 Unauthorized
    if (res.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("is_admin");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please log in again.");
    }

    // Try to parse JSON response
    let data;
    try {
      const text = await res.text();
      data = text ? JSON.parse(text) : { error: res.statusText || "Invalid server response" };
    } catch (e) {
      data = { error: res.statusText || "Invalid server response" };
    }

    // Handle non-ok responses
    if (!res.ok) {
      const errorMsg = data.error || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    // Retry logic for network errors (not 4xx/5xx)
    if (retryCount < MAX_RETRIES && error.message.includes('timeout')) {
      console.warn(`Retrying request (${retryCount + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
      return apiFetch(endpoint, options, retryCount + 1);
    }
    
    throw error;
  }
}

// Check authentication status
async function checkAuth() {
  try {
    const data = await apiFetch("/api/auth/me");
    return data.user;
  } catch (e) {
    throw new Error("Not authenticated");
  }
}

// Login function
async function login(username, password) {
  try {
    console.log('🔐 Attempting login for username:', username);
    const res = await fetchWithTimeout(API_BASE + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    console.log('📡 Response status:', res.status);
    
    let data;
    try {
      // Try to parse as JSON first
      const text = await res.text();
      if (text) {
        try {
          data = JSON.parse(text);
          console.log('✓ Response parsed successfully');
        } catch (e) {
          console.error('❌ Failed to parse JSON response:', e);
          data = { error: `Server error (Status ${res.status})` };
        }
      } else {
        data = { error: `Server error (Status ${res.status})` };
      }
    } catch (e) {
      console.error('❌ Failed to read response:', e);
      data = { error: `Server error (Status ${res.status})` };
    }

    if (!res.ok) {
      // Handle different status codes specifically
      if (res.status === 429) {
        const errorMessage = data.error || 'Too many requests. Please wait before trying again.';
        console.warn('⏱️ Rate limited:', errorMessage);
        throw new Error(errorMessage);
      }
      
      const errorMessage = data.details 
        ? data.details.map(d => d.message).join(', ')
        : (data.error || `Login failed (${res.status})`);
      console.warn('❌ Login failed:', errorMessage);
      throw new Error(errorMessage);
    }

    console.log('✓ Login successful');
    localStorage.setItem("token", data.token);
    localStorage.setItem("is_admin", data.is_admin);
    
    // Redirect based on user role
    if (data.is_admin) {
      window.location.href = "/admin";
    } else {
      window.location.href = "/dashboard";
    }
    
    return data;
  } catch (error) {
    console.error('🔴 Login error:', error.message);
    throw new Error(error.message || "Login failed. Please try again.");
  }
}

// Logout function
async function logout() {
  try {
    console.log("🔐 Logout initiated...");
    const result = await apiFetch("/api/auth/logout", { method: "POST" });
    console.log("✓ Logout API call successful:", result);
  } catch (e) {
    console.warn("⚠️ Logout API call failed, but proceeding with local cleanup:", e.message);
  }
  
  // Always clear local storage
  localStorage.removeItem("token");
  localStorage.removeItem("is_admin");
  console.log("✓ Local storage cleared");
  
  // Redirect to login page
  console.log("🔄 Redirecting to login...");
  window.location.href = "/login";
}

// Expose functions globally
window.apiFetch = apiFetch;
window.checkAuth = checkAuth;
window.login = login;
window.logout = logout;
