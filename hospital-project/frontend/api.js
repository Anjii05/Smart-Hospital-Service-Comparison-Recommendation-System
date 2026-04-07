const BASE_URL = process.env.REACT_APP_API_URL;

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
      body: JSON.stringify({ lat, lon }),
    });

    return await res.json();
  } catch (err) {
    console.error(err);
    return { success: false };
  }
};