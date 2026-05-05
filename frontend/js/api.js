const API_URL = 'http://localhost:5000/api';

export const api = {
  getToken: () => localStorage.getItem('token'),
  
  setAuthData: (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth.html?mode=login';
  },
  
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    return data;
  },

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setAuthData(data);
    return data;
  },

  async signup(userData) {
    const data = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    this.setAuthData(data);
    return data;
  },

  async getBuses() {
    return this.request('/buses');
  },

  async addBus(busData) {
    return this.request('/buses/add-bus', {
      method: 'POST',
      body: JSON.stringify(busData)
    });
  },

  async updateLocation(busId, lat, lng) {
    return this.request('/tracking/update-location', {
      method: 'POST',
      body: JSON.stringify({ bus_id: busId, latitude: lat, longitude: lng })
    });
  },

  async getLiveLocation(busId) {
    return this.request(`/tracking/live-location/${busId}`);
  }
};
