/**
 * Spendulum API Client.
 * Connects the React Bits frontend to the FastAPI backend.
 */

const API_BASE = "http://localhost:8000/api";

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!res.ok) {
    let errMessage = `Error ${res.status}: ${res.statusText}`;
    try {
      const errData = await res.json();
      if (errData.detail) errMessage = errData.detail;
    } catch {}
    throw new Error(errMessage);
  }

  return res.json();
}

export const api = {
  // Analytics
  getSummary: () => request("/analytics/summary"),
  getCategories: () => request("/analytics/categories"),
  getTrends: () => request("/analytics/trends"),
  getInsights: () => request("/analytics/insights"),

  // Transactions
  getTransactions: (params = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.append("search", params.search);
    if (params.category && params.category !== "All") q.append("category", params.category);
    if (params.type && params.type !== "All") q.append("type", params.type);
    if (params.limit) q.append("limit", params.limit);
    return request(`/transactions?${q.toString()}`);
  },
  createTransaction: (data) => request("/transactions", { method: "POST", body: JSON.stringify(data) }),
  updateTransaction: (id, data) => request(`/transactions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTransaction: (id) => request(`/transactions/${id}`, { method: "DELETE" }),
  reseedData: () => request("/transactions/reseed", { method: "POST" }),

  importCsv: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/transactions/import-csv`, {
      method: "POST",
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "CSV import failed");
    }
    return res.json();
  },

  // Budgets
  getBudgets: () => request("/budgets"),
  updateBudgets: (budgets) => request("/budgets", { method: "PUT", body: JSON.stringify({ budgets }) }),

  // Subscriptions
  getSubscriptions: () => request("/subscriptions"),
  addSubscription: (data) => request("/subscriptions", { method: "POST", body: JSON.stringify(data) }),
  updateSubscription: (id, data) => request(`/subscriptions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteSubscription: (id) => request(`/subscriptions/${id}`, { method: "DELETE" }),

  // Investments
  getInvestments: () => request("/investments"),
  addInvestment: (data) => request("/investments", { method: "POST", body: JSON.stringify(data) }),
  updateInvestment: (id, data) => request(`/investments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteInvestment: (id) => request(`/investments/${id}`, { method: "DELETE" }),

  // SMS & UPI
  parseSms: (raw_text) => request("/sms-upi/parse", { method: "POST", body: JSON.stringify({ raw_text }) }),
  commitSms: (records) => request("/sms-upi/commit", { method: "POST", body: JSON.stringify({ records }) }),
  getSmsSamples: () => request("/sms-upi/samples"),

  // Receipts
  scanReceiptText: (raw_text) => request("/receipts/scan-text", { method: "POST", body: JSON.stringify({ raw_text }) }),
  commitReceipt: (data) => request("/receipts/commit", { method: "POST", body: JSON.stringify(data) }),
  getReceiptSamples: () => request("/receipts/samples"),
  scanReceiptImage: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/receipts/scan-image`, {
      method: "POST",
      body: formData
    });
    if (!res.ok) throw new Error("Image scanning failed");
    return res.json();
  },

  // Predictive Budget
  getPredictive: () => request("/predictive"),

  // AI Classifier Studio
  predictCategory: (description) => request("/classifier/predict", { method: "POST", body: JSON.stringify({ description }) }),
  submitFeedback: (description, corrected_category) => request("/classifier/feedback", { method: "POST", body: JSON.stringify({ description, corrected_category }) }),
  getCategoriesList: () => request("/classifier/categories"),

  // Settings
  getSettings: () => request("/settings"),
  updateSettings: (settings) => request("/settings", { method: "PUT", body: JSON.stringify({ settings }) }),
  getBackupDbUrl: () => `${API_BASE}/settings/backup-db`,

  // User Profile
  getProfile: () => request("/profile"),
  updateProfile: (profile) => request("/profile", { method: "PUT", body: JSON.stringify(profile) })
};
