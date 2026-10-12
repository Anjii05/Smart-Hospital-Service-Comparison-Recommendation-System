const API_PORT = 5000;

function normalizeBaseUrl(url) {
  return String(url || "").replace(/\/$/, "");
}

function uniqueUrls(urls) {
  return [...new Set(urls.map(normalizeBaseUrl).filter(Boolean))];
}

function getConfiguredBaseUrl() {
  return (
    process.env.REACT_APP_API_BASE_URL ||
    process.env.REACT_APP_API_URL ||
    ""
  );
}

function getBaseUrls() {
  const urls = [];
  const configuredBaseUrl = getConfiguredBaseUrl();

  if (configuredBaseUrl) {
    urls.push(configuredBaseUrl);
  }

  if (typeof window !== "undefined") {
    urls.push("/api");

    if (window.location.hostname) {
      urls.push(`http://${window.location.hostname}:${API_PORT}/api`);
    }
  }

  urls.push(`http://localhost:${API_PORT}/api`);
  urls.push(`http://127.0.0.1:${API_PORT}/api`);

  return uniqueUrls(urls);
}

const BASE_URL = getBaseUrls()[0];

// GET hospitals
export const getHospitals = async () => {
  try {
    const res = await fetch(`${BASE_URL}/hospitals`);
    return await res.json();
  } catch (err) {
    console.error("API Error:", err);
    return { success: false, data: [] };
  }
};

// GET nearest hospitals
export const getNearestHospitals = async (lat, lon) => {
  try {
    const res = await fetch(`${BASE_URL}/hospitals/nearest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lat, lng: lon }),
    });

    return await res.json();
  } catch (err) {
    console.error(err);
    return { success: false };
  }
};
