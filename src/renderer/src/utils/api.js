import axios from 'axios';

// Create Axios instance
const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080/api',
  withCredentials: true, // needed for sending cookies (refresh token)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach token to headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 and refresh token
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

      // ✅ Skip if explicitly marked
    if (originalRequest?.skipAuthRefresh) {
      return Promise.reject(error);
    }

    // Prevent infinite loop
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call refresh endpoint (must send cookie with refresh token)
        const response = await axios.post(
          'http://localhost:8080/api/auth/generaterefreshtoken',
          {},
          {
            withCredentials: true,
          }
        );

        const newAccessToken = response.data.token;
        localStorage.setItem('token', newAccessToken);

        // Update token and retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error('Refresh token failed', refreshError);
        // Optional: logout user or redirect
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
