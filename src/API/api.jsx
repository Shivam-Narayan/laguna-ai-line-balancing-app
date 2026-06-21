import axios from 'axios';

// Base URL for the API
// const API_BASE_URL = 'http://laguna.eastus.cloudapp.azure.com:8000'; // API base URL
// const API_BASE_URL = 'https://yuktiapi.laguna-clothing.com/';
const API_BASE_URL = 'http://172.16.0.135:8000/';
// const API_BASE_URL = 'http://20.51.253.47:8000/';
// const API_BASE_URL = 'http://10.81.234.4:8000/'

// Create an axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token conditionally
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');

    if (token && !config.url.includes('/login/')) {
      config.headers.Authorization = `Token ${token}`;
    }

    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// API Endpoints
const API = {
  login: (data) => apiClient.post('/login/', data),
  validateLocation: (formData) => apiClient.post('/location-validator/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  logout: (data) => apiClient.post('/logout/', data),
  emailRecovery: (data) => apiClient.post('/request-reset-password/', data),
  forgotPassword: (data) => apiClient.post('/reset-password/', data),
  changePassword: (data) => apiClient.post('/change-password/', data),
  getUsers: () => apiClient.get('/user-management/users/'),
  createUser: (data) => apiClient.post('/user-management/create/', data),
  getUserDetails: (userId) => apiClient.get(`/user-management/users/${userId}/`),
  updateUser: (userId, data) => apiClient.put(`/user-management/users/update/${userId}/`, data),
  deleteUser: (userId) => apiClient.delete(`/user-management/users/delete/${userId}/`),
  uploadHolidayCalendar: (formData) => apiClient.post('/data/add_local_holiday_calender/', formData, {
    headers: {
      'Content-Type': undefined
    }
  }),
  getAbsenteeismData: (line, forecast_period) =>
    apiClient.get('/absenteeism/absenteeism_prediction_data/', {
      params: {
        line,
        forecast_period
      }
    }),
    getForecastData: () =>
    apiClient.post('/absenteeism/absenteeism_prediction/', {
      
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

    return apiClient.post('/absenteeism/absenteeism_prediction_data/', null, {
      params,
      responseType: type === 'excel' ? 'blob' : 'json',
      headers: {
        'Accept': '*/*'
      }
    });
  },

  getOperatorsData: (line) =>
    apiClient.get('/data/operators-data/', {
      params: {
        line
      }
    }),

  exportOperatorsData: (line) => {
    const formattedLine = line === 'All' ? 'All' : line;

    return apiClient.get('/data/export-operators-data/', {
      params: { line: formattedLine },
      responseType: 'blob',
      headers: {
        'Accept': '*/*'
      }
    });
  },
  exportOperatorsDataEmail: (line, email) => {
    const formattedLine = line === 'All' ? 'All' : line;

    return apiClient.get('/data/export-operators-data-email/', {
      params: {
        line: formattedLine,
        email: email
      }
    });
  },
  getManningSheet: (line, section, forecast_period, style, planned_date) =>
    apiClient.get('/manning-sheet/get_manning_data/', {
      params: {
        line,
        section,
        forecast_period,
        style,
        planned_date
      },

    }),
  uploadLoadingPlan: (formData) => {
    return apiClient.post('/manning-sheet/uploading_loading_data/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    })
  },
  uploadWipData: (formData) => {
    return apiClient.post('/manning-sheet/upload_wip_data', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    })
  },
  downloadManningSheet: (line, forecast_period) =>
    apiClient.post('/manning-sheet/download_manning_data_by_section/', null, {
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
    apiClient.post('/manning-sheet/get_manning_data/', null, {
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
    apiClient.post('/manning-sheet/get_unallocated_employees', null, {
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
    apiClient.post('/manning-sheet/generate_manning_sheet/', null, {
      headers: {
        'Accept': 'application/json'
      }
    }),
  getDdayManningData: (line) =>
    apiClient.get('/manning-sheet/get_dday_manning_data/', {
      params: {
        line
      }
    }),
  getDdayAttendanceData: (line) =>
    apiClient.get('/manning-sheet/get_attendance_data/', {
      params: {
        line
      }
    }),
  generateDdayManningSheet: () =>
    apiClient.post('/manning-sheet/generate_dday_manning_sheet/', null, {
      headers: {
        'Accept': 'application/json'
      }
    }),
  updateAllocatedEmployees: (ddayId, finalAllocation) =>
    apiClient.post('/manning-sheet/update_allocated_employees', {
      dday_id: ddayId,
      final_allocation: finalAllocation
    }, {
      headers: {
        'Accept': 'application/json'
      }
    }),
  updateEmployeeOnHold: (payload) =>
    apiClient.post('/manning-sheet/update_employee_on_hold', payload, {
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

    return apiClient.post('manning-sheet/download_manning_attendance_data/', null, {
      params,
      responseType: 'blob',
      headers: {
        'Accept': '*/*'
      }
    });
  },
  downloadDdayUnallocatedEmployees: (line) =>
    apiClient.post('/manning-sheet/get_unallocated_employees_dday', null, {
      params: {
        line
      },
      responseType: 'blob', // Expecting a file download
      headers: {
        'Accept': '*/*'
      }
    }),

  getAbsenteeismForecastGraph: (line, forecast_period) =>
    apiClient.get('/absenteeism/get_absenteeism_forecast/', {
      params: {
        line,
        forecast_period
      }
    }),

  getNotifications: () =>
    apiClient.get('/manning-sheet/notifications/'),

  notificationsDownload: (notificationId) =>
    apiClient.post('/manning-sheet/notifications/download_file/', null, {
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

  uploadStyleOB: (formData) => apiClient.post('/upload/StyleOB/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  }),

  uploadLoadingPlanData: (formData) => apiClient.post('/upload/LoadingPlan/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  }),

  uploadEMPFact: (formData) => apiClient.post('/upload/EMPFact/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  }),

  uploadActiveEmployees: (formData) => apiClient.post('/upload/ActiveEmployees/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  }),

  uploadLocalHolidayCalendar: (formData) => apiClient.post('/upload/LocalHolidayCalendar/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  }),

  uploadAttendanceMaster: (formData) => apiClient.post('/upload/AttendanceMaster/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  }),

  uploadAbsenteeism: (formData) => apiClient.post('/upload/PredictionData/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  }),

};

export default API;
