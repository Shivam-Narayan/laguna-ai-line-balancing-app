import axios from 'axios';

// Helper function to get cookies manually
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Base URL for the API
// Uses Vite environment variable if available, otherwise falls back to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/';

// Create an axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token conditionally
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');

    // Endpoints that should NOT send an Authorization header
    const noAuthUrls = ['/auth/login/', '/api/auth/google/', '/auth/token/refresh/'];
    const requiresAuth = !noAuthUrls.some(url => config.url.includes(url));

    if (token && token !== 'undefined' && token !== 'null' && requiresAuth) {
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Set Content-Type based on the payload format
    if (config.data instanceof FormData) {
      if (config.headers && typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type');
      } else {
        delete config.headers['Content-Type'];
      }
    } else {
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('Content-Type', 'application/json');
      } else {
        config.headers['Content-Type'] = 'application/json';
      }
    }

    // Manually attach CSRF token since Axios drops it for cross-origin absolute URLs
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// API Endpoints
const API = {
  login: (data) => apiClient.post('/auth/login/', data),
  googleLogin: (data) => apiClient.post('/api/auth/google/', data),
  refreshToken: (data) => apiClient.post('/auth/token/refresh/', data),
  validateLocation: (formData) => apiClient.post('/locations/validate/', formData),
  logout: (data) => apiClient.post('/auth/logout/', data),
  emailRecovery: (data) => apiClient.post('/auth/password/reset/request/', data),
  forgotPassword: (data) => apiClient.post('/auth/password/reset/confirm/', data),
  changePassword: (data) => apiClient.post('/auth/password/change/', data),
  getUsers: () => apiClient.get('/users/'),
  createUser: (data) => apiClient.post('/users/create/', data),
  getUserDetails: (userId) => apiClient.get(`/users/${userId}/`),
  updateUser: (userId, data) => apiClient.put(`/users/${userId}/update/`, data),
  deleteUser: (userId) => apiClient.delete(`/users/${userId}/delete/`),
  uploadHolidayCalendar: (formData) => apiClient.post('/data/holiday-calendars/upload/', formData),
  getAbsenteeismData: (line, forecast_period) =>
    apiClient.get('/absenteeism/predictions/', {
      params: {
        line,
        forecast_period
      }
    }),
  getForecastData: () =>
    apiClient.post('/absenteeism/predictions/generate/', {

    }),

  exportAbsenteeismData: (line, forecast_period, type, email = null) => {
    // Format line parameter
    const formattedLine = line === 'All Lines' ? 'All' : line.replace(' Lines', '');

    // Create query params
    const params = {
      line: formattedLine,
      forecast_period,
      type
    };

    if (type === 'email' && email) {
      params.email = email;
    }

    return apiClient.post('/absenteeism/predictions/', null, {
      params,
      responseType: type === 'excel' ? 'blob' : 'json',
      headers: {
        'Accept': '*/*'
      }
    });
  },

  getOperatorsData: (line) =>
    apiClient.get('/data/operators/', {
      params: {
        line
      }
    }),

  exportOperatorsData: (line) => {
    const formattedLine = line === 'All' ? 'All' : line;

    return apiClient.get('/data/operators/export/csv/', {
      params: { line: formattedLine },
      responseType: 'blob',
      headers: {
        'Accept': '*/*'
      }
    });
  },
  exportOperatorsDataEmail: (line, email) => {
    const formattedLine = line === 'All' ? 'All' : line;

    return apiClient.get('/data/operators/export/email/', {
      params: {
        line: formattedLine,
        email: email
      }
    });
  },
  getManningSheet: (line, section, forecast_period, style, planned_date) =>
    apiClient.get('/manning-sheet/manning-sheets/', {
      params: {
        line,
        section,
        forecast_period,
        style,
        planned_date
      },

    }),
  uploadLoadingPlan: (formData) => {
    return apiClient.post('/manning-sheet/loading-plans/upload/', formData)
  },
  uploadWipData: (formData) => {
    return apiClient.post('/manning-sheet/wips/upload/', formData)
  },
  downloadManningSheet: (line, forecast_period) =>
    apiClient.post('/manning-sheet/manning-sheets/export/', null, {
      params: {
        line,
        forecast_period
      },
      responseType: 'blob', // Expecting a file download
      headers: {
        'Accept': '*/*'
      }
    }),
  downloadSectionManningSheet: (line, section, forecast_period, style, planned_date) =>
    apiClient.post('/manning-sheet/manning-sheets/export/', null, {
      params: {
        line,
        section,
        forecast_period,
        style,
        planned_date
      },
      responseType: 'blob', // Expecting a file download
      headers: {
        'Accept': '*/*'
      }
    }),
  downloadUnallocatedEmployees: (line, forecast_period) =>
    apiClient.post('/manning-sheet/employees/unallocated/', null, {
      params: {
        line,
        forecast_period
      },
      responseType: 'blob', // Expecting a file download
      headers: {
        'Accept': '*/*'
      }
    }),
  generateManningSheet: () =>
    apiClient.post('/manning-sheet/manning-sheets/generate/', null, {
      headers: {
        'Accept': 'application/json'
      }
    }),
  getDdayManningData: (line) =>
    apiClient.get('/manning-sheet/manning-sheets/d-day/', {
      params: {
        line
      }
    }),
  getDdayAttendanceData: (line) =>
    apiClient.get('/manning-sheet/attendance/', {
      params: {
        line
      }
    }),
  generateDdayManningSheet: () =>
    apiClient.post('/manning-sheet/manning-sheets/d-day/generate/', null, {
      headers: {
        'Accept': 'application/json'
      }
    }),
  updateAllocatedEmployees: (ddayId, finalAllocation) =>
    apiClient.post('/manning-sheet/employees/allocated/', {
      dday_id: ddayId,
      final_allocation: finalAllocation
    }, {
      headers: {
        'Accept': 'application/json'
      }
    }),
  updateEmployeeOnHold: (payload) =>
    apiClient.post('/manning-sheet/employees/on-hold/', payload, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }),
  exportDdayManningSheet: (activeTab, emails = null) => {
    const params = {
      line: activeTab,
      type: emails ? "email" : "excel"
    };

    if (emails) {
      // Handle both string and array cases
      if (Array.isArray(emails)) {
        params.email = emails.join(',');
      } else if (typeof emails === 'string') {
        params.email = emails;
      }
    }

    return apiClient.post('/manning-sheet/attendance/export/', null, {
      params,
      responseType: 'blob',
      headers: {
        'Accept': '*/*'
      }
    });
  },
  downloadDdayUnallocatedEmployees: (line) =>
    apiClient.post('/manning-sheet/employees/unallocated/d-day/', null, {
      params: {
        line
      },
      responseType: 'blob', // Expecting a file download
      headers: {
        'Accept': '*/*'
      }
    }),

  getAbsenteeismForecastGraph: (line, forecast_period) =>
    apiClient.get('/absenteeism/forecasts/', {
      params: {
        line,
        forecast_period
      }
    }),

  getNotifications: () =>
    apiClient.get('/manning-sheet/notifications/'),

  notificationsDownload: (notificationId) =>
    apiClient.post('/manning-sheet/notifications/download/', null, {
      params: {
        notification_id: notificationId
      },
      responseType: 'blob',
      headers: {
        'Accept': '*/*'
      }
    }),

  markNotificationsRead: (data) =>
    apiClient.post('/manning-sheet/notifications/mark-read/', data),

  uploadStyleOB: (formData) => apiClient.post('/manning-sheet/style-obs/upload/', formData),

  uploadLoadingPlanData: (formData) => apiClient.post('/manning-sheet/loading-plans/upload/', formData),

  uploadEMPFact: (formData) => apiClient.post('/manning-sheet/emp-facts/upload/', formData),

  uploadActiveEmployees: (formData) => apiClient.post('/manning-sheet/employees/upload/', formData),

  uploadLocalHolidayCalendar: (formData) => apiClient.post('/data/holiday-calendars/upload/', formData),

  uploadAttendanceMaster: (formData) => apiClient.post('/data/attendance/upload/', formData),

  uploadAbsenteeism: (formData) => apiClient.post('/absenteeism/upload/', formData),

};

export default API;
