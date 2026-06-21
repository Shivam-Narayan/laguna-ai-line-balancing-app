import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/shared/Header';
import Sidenav from '../components/shared/Sidenav';
import { Form, Dropdown, Button, Toast, Overlay, Popover } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import exportIcon from '../assets/Export.svg';
import exportNew from '../assets/Export New.svg';
import generateNew from '../assets/Generate New.svg';
import ExcelIcon from '../assets/excel.svg';
import MailIcon from '../assets/mail.svg';
import ListIcon from '../assets/list.svg';
import arrowIcon from '../assets/Arrow.svg'
import { AgCharts } from 'ag-charts-react';
import API from '../api/api';
import LoadingOverlay from '../components/shared/LoadingOverlay';
import { useUser } from '../context/UserContext';
import JSZip from 'jszip';
import Footer from '../components/shared/Footer';


import '../index.css'
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { ModuleRegistry } from "@ag-grid-community/core";
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Register required modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

const Forecast = () => {
  const { userName } = useUser();

  const [greeting, setGreeting] = useState('Good Morning');
  const [selectedDays, setSelectedDays] = useState('60');
  const [selectedLine, setSelectedLine] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [emails, setEmails] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [emailError, setEmailError] = useState('');

  const [forecastData, setForecastData] = useState(null);
  const [newForecastData, setNewForecastData] = useState(null);
  const [operatorDemandOptions, setOperatorDemandOptions] = useState({});
  const [operatorSupplyOptions, setOperatorSupplyOptions] = useState({});
  const [operatorGapOptions, setOperatorGapOptions] = useState({});
  const [operatorRadialOptions, setOperatorRadialOptions] = useState({});
  const [rowData, setRowData] = useState([]);
  const [apiData, setApiData] = useState(null);
  const [forecastChartData, setForecastChartData] = useState([]);
  const [chartOptions, setChartOptions] = useState({});
  const [showTooltip, setShowTooltip] = useState(false);
  const arrowRef = useRef(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [errorState, setErrorState] = useState({
    hasError: false,
    errorMessage: '',
    isHoliday: false
  });

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // const daysOptions = ['D+1', '7th Days', '30th Days', '60th Days'];
  const daysOptions = [
    { id: '1', display: 'D+1 Day' },
    { id: '7', display: <p>7<sup>th</sup> Day</p> },
    { id: '30', display: <p>30<sup>th</sup> Day</p> },
    { id: '60', display: <p>60<sup>th</sup> Day</p> }
  ];
  const lineOptions = ['All Lines', 'Line 1', 'Line 2', 'Line 3', 'Line 4', 'Line 5', 'Line 6', 'Line 7', 'Line 8', 'Line 9', 'Line 10'];


  // useEffect(() => {
  //   const style = document.createElement('style');
  //   style.innerHTML = `
  //     .chart-tooltip {
  //       max-width: 600px !important;
  //       width: 600px !important;
  //       z-index: 9999;
  //       position: fixed !important;
  //       top: 50% !important;
  //       left: 50% !important;
  //       transform: translate(-50%, -50%) !important;
  //     }
  //     .chart-tooltip .popover-body {
  //       padding: 0.5rem;
  //     }
  //     .chart-tooltip .popover-header {
  //       background-color: #f8f9fa;
  //       padding: 0.5rem;
  //       border-bottom: 1px solid #dee2e6;
  //     }
  //     .chart-tooltip .popover-arrow {
  //       display: none !important;
  //     }
  //   `;
  //   document.head.appendChild(style);

  //   return () => {
  //     document.head.removeChild(style);
  //   };
  // }, []);

  // Function to determine greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good Afternoon';
    } else if (hour >= 17 && hour < 21) {
      return 'Good Evening';
    } else {
      return 'Good Night';
    }
  };

  // Update greeting when component mounts and every minute
  useEffect(() => {
    setGreeting(getGreeting());

    const timer = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Add NoDataDisplay component
  const NoDataDisplay = () => (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[200px] bg-gray-50 rounded-lg">
      <div className="flex flex-col items-center justify-center p-6">
        {errorState.isHoliday ? (
          // Show error icon and message for API errors
          <>
            <svg
              className="w-12 h-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 15v4a2 2 0 002 2h12a2 2 0 002-2v-4M4 15l6.75-6.75M4 15l6-6m8 6l-6.75-6.75M18 15l-6-6"
              />
            </svg>
            {/* <p className="text-base font-medium text-gray-600">No data available</p> */}
            <p className="text-base font-medium text-gray-600">Today is holiday</p>
            <p className="text-sm text-gray-500 text-center mt-1">
              There is no data available for the selected parameters
            </p>
          </>
        ) : (
          // Show holiday icon and message for holiday case
          <>
            <svg
              className="w-12 h-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 15v4a2 2 0 002 2h12a2 2 0 002-2v-4M4 15l6.75-6.75M4 15l6-6m8 6l-6.75-6.75M18 15l-6-6"
              />
            </svg>
            <p className="text-base font-medium text-gray-600">No data available</p>
            {/* <p className="text-base font-medium text-gray-600">Today is holiday</p> */}
            <p className="text-sm text-gray-500 text-center mt-1">
              There is no data available for the selected parameters
            </p>
          </>
        )}
      </div>
    </div>
  );

  // Function to check if an error message indicates a holiday
  const isHolidayMessage = (message) => {
    if (!message) return false;
    const lowerMessage = message.toLowerCase();
    return (
      lowerMessage.includes("holiday") ||
      lowerMessage.includes("sunday") ||
      lowerMessage.includes("saturday") ||
      lowerMessage.includes("weekend")
    );
  };

  // Function to reset all chart data
  const resetChartData = () => {
    setForecastData(null);
    setOperatorDemandOptions(null);
    setOperatorSupplyOptions(null);
    setOperatorGapOptions(null);
    setOperatorRadialOptions(null);
    setProductionShortageOptions(prev => ({
      ...prev,
      data: []
    }));
  };

  const hasValidForecastData = () => {
    return forecastData && forecastData.total_operators && forecastData.total_operators.length > 0;
  };

  const handleExcelExport = async () => {
    setIsLoading(true);
    try {
      const days = selectedDays.split(' ')[0]; // Extract number from "60 Days"
      const response = await API.exportAbsenteeismData(selectedLine, days, 'excel');

      // Create blob from response
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      // Create download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Prediction_Data_${selectedLine}_${days}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setToastMessage('Excel file downloaded successfully');
      setShowToast(true);
    } catch (error) {
      console.error('Error exporting excel:', error);
      showNotification('Failed to download Excel file', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEmailModal = () => {
    setEmails(''); // Clear email field
    setEmailError(''); // Clear any previous errors
    setShowEmailModal(true);
  };

  const handleCloseEmailModal = () => {
    setEmails([]);        // Clear emails array
    setInputValue('');    // Clear input field
    setEmailError('');    // Clear error message
    setShowEmailModal(false);
  };

  const validateEmail = (value) => {
    // Check for leading/trailing spaces
    if (value.trim() !== value) {
      setEmailError('Email cannot have leading or trailing spaces.');
      return false;
    }

    // Remove leading and trailing spaces
    const trimmedEmail = value.trim();

    // 1. Mandatory Field Check
    if (!trimmedEmail) {
      setEmailError('Email address is required.');
      return false;
    }

    // 7. No Whitespace Check
    if (/\s/.test(trimmedEmail)) {
      setEmailError('Email cannot contain spaces.');
      return false;
    }

    // 4. Character Limits Check
    if (trimmedEmail.length < 5 || trimmedEmail.length > 64) {
      setEmailError('Email must be between 5 and 64 characters.');
      return false;
    }

    // 5. Allowed Characters & 2. Format Validation
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      // Check if the issue is with allowed characters
      if (!/^[a-zA-Z0-9._@-]+$/.test(trimmedEmail)) {
        setEmailError('Email can only contain letters, numbers, and valid symbols like \'.\', \'-\', \'_\', and \'@\'.');
        return false;
      }
      // If the characters are valid but format is wrong
      setEmailError('Please enter a valid email address.');
      return false;
    }

    // 3. Domain Validation
    const domain = trimmedEmail.split('@')[1];
    const validDomains = ['com', 'org', 'edu', 'gov', 'net', 'io', 'co', 'in'];
    const topLevelDomain = domain.split('.').pop().toLowerCase();
    if (!validDomains.includes(topLevelDomain)) {
      setEmailError('Invalid email domain.');
      return false;
    }

    setEmailError('');
    return true;
  };

  const handleEmailChange = (e) => {
    // setInputValue(e.target.value);
    const value = e.target.value.trim();
    setInputValue(e.target.value);

    if (value && !validateEmail(value)) {
      setEmailError('Invalid email format');
    } else {
      setEmailError('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      const trimmedEmail = inputValue.trim();
      if (trimmedEmail && validateEmail(trimmedEmail)) {
        setEmails([...emails, trimmedEmail]);  // Add new email to the array
        setInputValue(''); // Reset input
        setEmailError('');
      } else {
        setEmailError('Invalid email format');
      }
    }
  };

  const removeEmail = (index) => {
    const updatedEmails = emails.filter((_, i) => i !== index);
    setEmails(updatedEmails);

    // Ensure the button is disabled when no emails are present
    if (updatedEmails.length === 0) {
      setEmailError(''); // Clear error
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (emails.length === 0) {
      setEmailError('Please enter at least one valid email');
      return;
    }
    setIsLoading(true);
    try {
      const days = selectedDays.split(' ')[0];
      // const emailList = emails.split(',').map((emails) => emails.trim());
      await API.exportAbsenteeismData(selectedLine, days, 'email', emails.join(','));

      handleCloseEmailModal();
      setShowSuccessModal(true);

      setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);
    } catch (error) {
      console.error('Error sending email:', error);
      handleCloseEmailModal();
      showNotification('Failed to send email', 'error');
    } finally {
      setIsLoading(false);
      setShowEmailModal(false);
    }
  };

  // Function to handle 6 months data download
  const handle2MonthsDataDownload = async () => {
    try {
      // Path to your ZIP file in the public folder
      const zipFilePath = '/absenteeism_prediction_202505021703_prod_02_05.zip';

      // Fetch the ZIP file
      const response = await fetch(zipFilePath);

      if (!response.ok) {
        console.error('Failed to fetch ZIP file:', response.statusText);
        return;
      }

      // Get ZIP file as blob
      const zipBlob = await response.blob();

      // Load the ZIP file
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(zipBlob);

      // Get the files in the ZIP (we know there's only one CSV)
      const files = Object.keys(zipContent.files);
      const csvFile = files.find(filename => filename.endsWith('.csv'));

      if (!csvFile) {
        console.error('No CSV file found in the ZIP archive');
        return;
      }

      // Extract the CSV content
      const csvContent = await zipContent.files[csvFile].async('blob');

      // Create downloadable URL for the CSV
      const csvUrl = URL.createObjectURL(csvContent);

      // Create a temporary anchor and trigger download
      const link = document.createElement('a');
      link.href = csvUrl;
      link.download = 'Absenteeism_Prediction_2_Months_Data.csv';
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(csvUrl), 100);

    } catch (error) {
      console.error('Error extracting CSV from ZIP:', error);
    }
  };

  const [apiLoadingState, setApiLoadingState] = useState({
    absenteeismData: true,
    forecastData: true,
    newForecastData: false
  });

  useEffect(() => {
    // Only turn off loading when both APIs are complete
    if (!apiLoadingState.absenteeismData && !apiLoadingState.forecastData) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [apiLoadingState]);

  const columnDefs = [
    { headerName: "Section", field: "Section", flex: 1 },
    { headerName: "Predicted", field: "Predicted", flex: 1 },
    { headerName: "Target", field: "Target", flex: 1 },
    { headerName: "Actual", field: "Actual", flex: 1 },
    { headerName: "Required", field: "Required", flex: 1 },
  ];

  const transformProductionData = (apiData) => {
    if (!apiData || !apiData.data || !apiData.data["Target data"]) {
      console.log("No target data available");
      return [];
    }

    const targetData = apiData.data["Target data"][0];
    const actualMachinists = apiData.data.actual_machinists || [];
    const requiredMachinists = apiData.data.required_machinists || [];

    // Check if we have production target data
    if (!targetData.production_target || !Array.isArray(targetData.production_target)) {
      console.log("Production target data is missing or invalid");
      return [];
    }

    // If predicted_production is empty but we have production_target
    if (!targetData.predicted_production || !Array.isArray(targetData.predicted_production) ||
      targetData.predicted_production.length === 0) {

      // Use only the production_target data to create rows
      return targetData.production_target.map(targetItem => {
        // Find matching actual and required data by section
        const actualItem = actualMachinists.find(actual => actual.section === targetItem.section);
        const requiredItem = requiredMachinists.find(required => required.section === targetItem.section);

        return {
          Section: targetItem.section || "Unknown",
          Predicted: 0, // Since no prediction data is available
          Target: Math.round(targetItem.total_planned_qty || 0),
          Actual: actualItem ? actualItem.count : 0,
          Required: requiredItem ? requiredItem.count : 0
        };
      });
    }

    // Original logic when both predicted and target data are available
    return targetData.predicted_production.map(predictedItem => {
      const targetItem = targetData.production_target.find(
        target => target.section === predictedItem.section
      );

      // Find matching actual and required data by section
      const actualItem = actualMachinists.find(actual => actual.section === predictedItem.section);
      const requiredItem = requiredMachinists.find(required => required.section === predictedItem.section);

      return {
        Section: predictedItem.section || "Unknown",
        Predicted: Math.round(predictedItem.total_planned_qty || 0),
        Target: targetItem
          ? Math.round(targetItem.total_planned_qty)
          : Math.round((predictedItem.total_planned_qty || 0) * 1.5),
        Actual: actualItem ? actualItem.count : 0,
        Required: requiredItem ? requiredItem.count : 0
      };
    });
  };

  useEffect(() => {
    if (apiData) {
      const transformedData = transformProductionData(apiData);
      setRowData(transformedData);
    }
  }, [apiData]);

  // Function to format parameters for API call
  const formatParams = (days, line) => {
    const daysNumber = parseInt(days);
    const lineValue = line === 'All Lines' ? 'All' : line;
    return { days: daysNumber, line: lineValue };
  };

  // Function to fetch forecast data upon clicking the forecast button
  const fetchNewForecastData = async () => {
  setApiLoadingState(prev => ({ ...prev, newForecastData: true }));
  
  try {
    const response = await API.getForecastData();
    console.log('New Forecast Data:', response.data);
    
    if (response.data) {
      setNewForecastData(response.data);
      // Handle the response data as needed
      // You can process and display this data in your component
    }
  } catch (err) {
    console.error('Error fetching new forecast data:', err);
    setNewForecastData(null);
  } finally {
    setApiLoadingState(prev => ({ ...prev, newForecastData: false }));
  }
};

  // Function to fetch absenteeism data
  const fetchAbsenteeismData = async (days, line) => {
    setApiLoadingState(prev => ({ ...prev, absenteeismData: true }));

    try {
      const { days: formattedDays, line: formattedLine } = formatParams(days, line);
      const response = await API.getAbsenteeismData(formattedLine, formattedDays);
      setApiData(response.data);

      // Reset error state at the beginning of successful response
      setErrorState({
        hasError: false,
        errorMessage: '',
        isHoliday: false
      });

      if (response.data.status === "success" && response.data.data) {
        // Check for operator data
        const hasOperatorData = response.data.data.total_operators &&
          response.data.data.total_operators.length > 0;

        if (hasOperatorData) {
          setForecastData(response.data.data);
          updateChartsWithData(response.data.data);
        } else {
          resetChartData();
        }

        // Handle production data separately
        const transformedProductionData = transformProductionData(response.data);

        if (transformedProductionData.length > 0) {
          setProductionShortageOptions(prevOptions => ({
            ...prevOptions,
            data: transformedProductionData
          }));
          setRowData(transformedProductionData);
        } else {
          setProductionShortageOptions(prev => ({
            ...prev,
            data: []
          }));
          setRowData([]);
        }
      } else if (response.data.status === "error") {
        // Handle the specific error formats
        resetChartData();

        // Check if the error message indicates a holiday
        const errorMessage = response.data.error || "";

        if (isHolidayMessage(errorMessage)) {
          // It's a holiday message like "No data found for 2025-06-01 as it is Sunday"
          setErrorState({
            hasError: false,
            errorMessage: '',
            isHoliday: true
          });
        } else {
          // It's a regular error like "No attendance data found for LINE 10"
          setErrorState({
            hasError: true,
            errorMessage: errorMessage,
            isHoliday: false
          });
        }
      } else {
        // Generic error for unexpected response format
        resetChartData();
        setErrorState({
          hasError: true,
          errorMessage: "Unexpected response format",
          isHoliday: false
        });
      }
    } catch (err) {
      console.error('Error fetching absenteeism data:', err);
      resetChartData();

      // Get the error message
      const errorMessage = err.response?.data?.error || err.message || "Failed to fetch data";

      // Check if the error message indicates a holiday
      if (isHolidayMessage(errorMessage)) {
        setErrorState({
          hasError: false,
          errorMessage: '',
          isHoliday: true
        });
      } else {
        setErrorState({
          hasError: true,
          errorMessage: errorMessage,
          isHoliday: false
        });
      }
    } finally {
      setApiLoadingState(prev => ({
        ...prev,
        absenteeismData: false
      }));
    }
  };

  // Updated function to transform data for a line chart
  const transformForecastDataForLineChart = (forecastResponse) => {
    if (!forecastResponse || !forecastResponse.historical_data) return [];

    // Convert the API response format to a flattened array for easier processing
    const getData = () => {
      const result = [];

      Object.keys(forecastResponse.historical_data).forEach(year => {
        forecastResponse.historical_data[year].forEach(entry => {
          result.push({
            date: entry.date,
            percentage: entry.percentage,
            year: year
          });
        });
      });

      return result;
    };

    // Get all data
    const allData = getData();

    // Create a map of all unique dates across all years
    const dateMap = new Map();

    // First, find all unique month-day combinations across all years
    allData.forEach(item => {
      const dateStr = item.date;
      const dateParts = dateStr.split('-');
      const monthDay = `${dateParts[1]}-${dateParts[2]}`; // Extract "MM-DD"

      if (!dateMap.has(monthDay)) {
        dateMap.set(monthDay, {
          monthDay,
          "2022": null,
          "2023": null,
          "2024": null,
          // Store the date object for sorting
          dateObj: new Date(2022, parseInt(dateParts[1]) - 1, parseInt(dateParts[2]))
        });
      }
    });

    // Now populate the values for each year
    allData.forEach(item => {
      const dateStr = item.date;
      const dateParts = dateStr.split('-');
      const monthDay = `${dateParts[1]}-${dateParts[2]}`;
      dateMap.get(monthDay)[item.year] = item.percentage;
    });

    // Convert the map to an array and sort by date
    const combinedData = Array.from(dateMap.values()).sort((a, b) => {
      return a.dateObj - b.dateObj;
    });

    // For each series/year, make sure there are no null gaps by carrying forward values
    const years = ["2022", "2023", "2024"];

    // Ensure there are no null gaps in the data (carry forward the last value)
    years.forEach(year => {
      let lastValue = null;
      for (let i = 0; i < combinedData.length; i++) {
        // If this point has data, update lastValue
        if (combinedData[i][year] !== null) {
          lastValue = combinedData[i][year];
        }
        // If this point is null but we have a previous value, use the last value
        else if (lastValue !== null) {
          combinedData[i][year] = lastValue;
        }
      }

      // Also handle the case where data starts with null by going backwards
      lastValue = null;
      for (let i = combinedData.length - 1; i >= 0; i--) {
        if (combinedData[i][year] !== null) {
          lastValue = combinedData[i][year];
        } else if (lastValue !== null) {
          combinedData[i][year] = lastValue;
        }
      }
    });

    return combinedData;
  };

  // Updated function to create chart options using the new approach
  const createContinuousLineChartOptions = (combinedData) => {
    if (!combinedData || combinedData.length === 0) {
      return {};
    }

    // Define colors for each year
    const yearColors = {
      "2022": "#34B9E980", // Orange 
      "2023": "#00AA4599", // Green
      "2024": "#EF212999"  // Blue
    };

    let maxValue = 0;
    const years = ["2022", "2023", "2024"];

    combinedData.forEach(dataPoint => {
      years.forEach(year => {
        if (dataPoint[year] !== null && dataPoint[year] > maxValue) {
          maxValue = dataPoint[year];
        }
      });
    });

    // Add a 10% buffer to the max value and round up to the nearest whole number
    maxValue = Math.ceil(maxValue * 1.1);

    // If maxValue is very small, set a minimum of 5
    if (maxValue < 5) maxValue = 5;

    return {
      // title: { text: "Absenteeism Trends" },
      axes: [
        {
          type: "category",
          position: "bottom",
          // title: { text: "Date" },
          label: {
            formatter: (params) => {
              const [month, day] = params.value.split('-');
              const date = new Date(2022, parseInt(month) - 1, parseInt(day));
              return date.toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit"
              });
            },
          },
        },
        {
          type: "number",
          position: "left",
          // title: { text: "Percentage" },
          min: 0,
          max: maxValue,
          nice: false,
          gridLine: {
            style: [{
              stroke: 'rgba(0,0,0,0.1)',
              lineDash: [0],
            }]
          }
        },
      ],
      series: [
        {
          type: "line",
          xKey: "monthDay",
          yKey: "2022",
          data: combinedData,
          title: "2022",
          stroke: yearColors["2022"],
          marker: {
            enabled: true,
            fill: yearColors["2022"],
            stroke: yearColors["2022"]
          },
          tooltip: { enabled: true },
          // Make sure line is continuous
          // connecting: { enabled: true },
          interpolation: { type: "smooth" },
        },
        {
          type: "line",
          xKey: "monthDay",
          yKey: "2023",
          data: combinedData,
          title: "2023",
          stroke: yearColors["2023"],
          marker: {
            enabled: true,
            fill: yearColors["2023"],
            stroke: yearColors["2023"]
          },
          tooltip: { enabled: true },
          // Make sure line is continuous  
          // connecting: { enabled: true },
          interpolation: { type: "smooth" },
        },
        {
          type: "line",
          xKey: "monthDay",
          yKey: "2024",
          data: combinedData,
          title: "2024",
          stroke: yearColors["2024"],
          marker: {
            enabled: true,
            fill: yearColors["2024"],
            stroke: yearColors["2024"]
          },
          tooltip: { enabled: true },
          // Make sure line is continuous
          // connecting: { enabled: true },
          interpolation: { type: "smooth" },
        },
      ],
      legend: {
        position: "bottom",
        item: {
          marker: {
            padding: 4,
            shape: "circle"
          },
          label: {
            color: "black"
          }
        }
      },
      padding: { top: 10, right: 20, bottom: 20, left: 10 }
    };
  };

  const fetchAbsenteeismForecastData = async (days, line) => {

    setApiLoadingState(prev => ({ ...prev, forecastData: true }));
    setChartLoading(true);
    // setIsLoading(true);
    try {
      const { days: formattedDays, line: formattedLine } = formatParams(days, line);
      const response = await API.getAbsenteeismForecastGraph(formattedLine, formattedDays);

      if (response.data && response.data.historical_data) {
        // Use the new transformation and chart options
        const combinedData = transformForecastDataForLineChart(response.data);
        const chartOptions = createContinuousLineChartOptions(combinedData);

        // Update chart options
        setChartOptions(chartOptions);

        // Set forecast chart data for the "no data" check
        setForecastChartData(combinedData.length > 0 ? combinedData : []);
      } else {
        setForecastChartData([]);
        setChartOptions({});
      }
    } catch (err) {
      console.error('Error fetching absenteeism forecast data:', err);
      setForecastChartData([]);
      setChartOptions({});
    } finally {
      // setIsLoading(false);
      setApiLoadingState(prev => ({
        ...prev,
        forecastData: false
      }));
      setChartLoading(false);
    }
  };

  const createBarChartOptions = (data, yKey, color) => {
    if (!data || data.length === 0) {
      return null;
    }

    // Ensure data is properly formatted
    const formattedData = data?.map(item => ({
      ...item,
      [yKey]: Number(item[yKey]) || 0,
      section: String(item.section || ''),
    })) || [];

    return {
      data: formattedData,
      series: [{
        type: 'bar',
        direction: 'horizontal',
        xKey: 'section',
        yKey: yKey,
        fill: color,
        strokeWidth: 0,
        cornerRadius: 5,
        label: {
          enabled: true,
          placement: 'outside-end',
          color: '#171717',
          fontSize: 14,
          fontFamily: 'Satoshi',
          padding: 10,
          formatter: params => {
            const value = params.value;
            return typeof value === 'number' ? value.toString() : '0';
          }
        }
      }],
      axes: [
        {
          type: 'category',
          position: 'left',
          label: {
            fontSize: 14
          }
        },
        {
          type: 'number',
          position: 'bottom',
          nice: true,
          label: { enabled: true },
          gridLine: { enabled: false },
        },
      ],
      legend: { enabled: false },
      padding: {
        top: 0,
        right: 50,
        bottom: 30,
        left: 10
      },
      height: 250
    };
  };

  // Radial Chart Configuration
  const createRadialChartOptions = (data) => {
    if (!data || (!data.projected_attendance && !data.total_predicted_absenteeism)) {
      return null;
    }

    const radialData = [
      {
        asset: "Projected attendance",
        amount: data?.projected_attendance || 0
      },
      {
        asset: "Anticipated absence",
        amount: data?.total_predicted_absenteeism || 0
      }
    ];

    return {
      data: radialData,
      series: [{
        type: 'donut',
        angleKey: 'amount',
        strokeWidth: 0,
        fills: ['#818CF8', '#F87171'],
        innerRadiusRatio: 0.85,
        calloutLabel: {
          enabled: false
        },
        tooltip: {
          enabled: false
        },
        highlightStyle: {
          item: {
            fill: undefined
          }
        }
      }],
      height: 200,
      padding: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
      },
      legend: {
        enabled: false
      }
    };
  };

  // predicted production shortage graph starts from here;
  const [productionShortageOptions, setProductionShortageOptions] = useState({
    // title: {
    //   text: "Predicted Production Shortage  ",
    // },
    data: [],
    series: [
      {
        type: "line",
        xKey: "Section",
        yKey: "Target",
        yName: "Production Target",
        stroke: "#E6E6E6",
        marker: {
          fill: "#E6E6E6",
          stroke: "#E6E6E6"
        }
      },
      {
        type: "line",
        lineDash: [4, 4],
        strokeWidth: 2,
        strokeOpacity: 0.8,
        xKey: "Section",
        yKey: "Predicted",
        yName: "Predicted Production",
        stroke: "#7267FF",
        marker: {
          fill: "#7267FF",
          stroke: "#7267FF"
        }
      },
    ],
    axes: [
      {
        type: 'category',
        position: 'bottom',
      },
      {
        type: 'number',
        position: 'left',
        min: 0,  // Setting minimum value
        max: 80000 // Setting maximum value
      }
    ],
    height: 180,
    padding: {
      top: 20,
      right: 20,
      bottom: 10,
      left: 40
    }
  });
  // predicted production shortage graphs ends here;

  // Function to update charts with API data
  const updateChartsWithData = (data) => {
    if (!data || !data.total_operators || data.total_operators.length === 0) {
      resetChartData();
      return;
    }

    try {
      const demandOptions = createBarChartOptions(
        data.total_operators,
        'count',
        '#818CF8'
      );

      const supplyOptions = createBarChartOptions(
        data.total_operators_supply,
        'count',
        '#34D399'
      );

      const gapOptions = createBarChartOptions(
        data.total_operators_gap,
        'count',
        '#F87171'
      );

      // Update Radial Chart
      const radialOptions = createRadialChartOptions(data);

      // Only update state if we have valid options
      setOperatorDemandOptions(demandOptions || null);
      setOperatorSupplyOptions(supplyOptions || null);
      setOperatorGapOptions(gapOptions || null);
      setOperatorRadialOptions(radialOptions || null);

    } catch (err) {
      console.error('Error updating charts:', err);
      resetChartData();
    }
  };

  // Initial data fetch on component mount
  useEffect(() => {
    setApiLoadingState({
      absenteeismData: true,
      forecastData: true,
      newForecastData: false
    });
    // setIsLoading(true);

    const initialDays = '60th';
    const initialLine = 'All';

    // Call both APIs for initial data
    fetchAbsenteeismData(initialDays, initialLine);
    fetchAbsenteeismForecastData(initialDays, initialLine);
  }, []);

  // Handle submit button click
  const handleSubmit = () => {
    // setApiLoadingState({
    //   absenteeismData: true,
    //   forecastData: true,
    //   newForecastData: false
    // });
    setApiLoadingState(prev => ({
    ...prev,
    newForecastData: true
  }));
    // setIsLoading(true);

    const days = selectedDays.split(' ')[0]; // Extract number from "60 Days"
    const line = selectedLine;

    // Call both APIs with the parameters
    // fetchAbsenteeismData(days, line);
    // fetchAbsenteeismForecastData(days, line);
    fetchNewForecastData();
  };

  return (

    <div className="h-screen w-screen flex overflow-hidden">
      {isLoading && (
        <LoadingOverlay
          title="Preparing the Forecast sheet"
          message="Please hold on for a moment"
        />
      )}
      <Sidenav />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 px-4 py-2 overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="font-satoshi text-2xl font-semibold">{greeting}, {userName}</h2>
              <h6 className="font-satoshi text-base font-normal">
                These Forecasts are based on data from the past three years.
              </h6>
            </div>
          </div>

          {/* Header Controls */}
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="flex gap-2">
              {/* Day Dropdown */}
              <Dropdown>
                <Dropdown.Toggle variant="outline-primary" className="custom-dropdown">
                  {daysOptions.find(opt => opt.id === selectedDays)?.display || daysOptions[0].display}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {daysOptions.map((option) => (
                    <Dropdown.Item
                      key={option.id}
                      active={selectedDays === option.id}
                      onClick={() => setSelectedDays(option.id)}
                    >
                      {option.display}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
              {/* <Dropdown>
                <Dropdown.Toggle variant="outline-primary" className="custom-dropdown">
                  {selectedDays}
                </Dropdown.Toggle>
                <Dropdown.Menu >
                  {daysOptions.map((option) => (
                    <Dropdown.Item
                      key={option}
                      active={selectedDays === option}
                      onClick={() => setSelectedDays(option)}
                    >
                      {option}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown> */}

              {/* All Lines Dropdown */}
              <Dropdown>
                <Dropdown.Toggle variant="outline-primary" className="custom-dropdown">
                  {selectedLine}
                </Dropdown.Toggle>
                <Dropdown.Menu >
                  {lineOptions.map((option) => (
                    <Dropdown.Item
                      key={option}
                      active={selectedLine === option}
                      onClick={() => setSelectedLine(option)}
                    >
                      {option}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>

              {/* Submit Button */}
              <Button variant="primary"
                className="font-satoshi bg-[#4F46E5] border-[#4F46E5] flex items-center hover:bg-[#4F46E5] hover:border-[#4F46E5]"
                onClick={handleSubmit}
                disabled={isLoading}>
                <img
                  src={generateNew}
                  alt="generate"
                  className="mr-1.5 w-5 h-5"
                />
                {/* Submit */}
                <span className="font-satoshi text-base font-medium">
                  Forecast
                </span>
              </Button>
            </div>

            {/* Export Button with Dropdown */}
            <div className="ml-auto">
              <Dropdown>
                <Dropdown.Toggle
                  variant="outline-primary"
                  className={`custom-dropdown export-dropdown px-6 bg-[#FFFFFF] border-[#286DB2] flex items-center
                    ${!hasValidForecastData()
                      ? 'opacity-50 cursor-not-allowed text-gray-500 border-gray-300'
                      : 'text-[#286DB2] hover:bg-[#FFFFFF] hover:border-[#286DB2] hover:text-[#286DB2]'}`}
                  disabled={!hasValidForecastData()}
                >
                  <div className="flex items-center">
                    <img
                      src={exportNew}
                      alt="export"
                      className={`mr-1.5 w-5 h-5 ${!hasValidForecastData() ? 'opacity-50' : ''}`}
                    />
                    <span className="font-satoshi text-base font-medium">
                      Export
                    </span>
                  </div>
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item onClick={handleExcelExport}
                    disabled={!hasValidForecastData()}
                    className="flex items-center">
                    <img src={ExcelIcon} alt="excel" className="w-4 h-4 mr-2" />
                    Export as excel
                  </Dropdown.Item>
                  <Dropdown.Item onClick={handleOpenEmailModal}
                    disabled={!hasValidForecastData()}
                    className="flex items-center">
                    <img src={MailIcon} alt="mail" className="w-4 h-4 mr-2" />
                    Share via Email
                  </Dropdown.Item>
                  <Dropdown.Item onClick={handle2MonthsDataDownload}
                    disabled={!hasValidForecastData()}
                    className="flex items-center">
                    <img src={ListIcon} alt="list" className="w-4 h-4 mr-2" />
                    2 months data
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>

          <div className="flex gap-6">
            <div className=" w-1/3 h-[293px] p-3 rounded-lg border border-gray-200">
              <h3 className="font-satoshi text-lg font-bold mb-2">Operators</h3>
              <div className="relative h-[200px]">
                {operatorRadialOptions ? (
                  <>
                    <div className="absolute inset-0">
                      <AgCharts options={operatorRadialOptions} />
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                      <p className="font-satoshi text-3xl font-bold text-[#171717]">{forecastData?.total_employees || 0}</p>
                      <p className="font-satoshi text-base font-medium text-[#171717]">Total Operators</p>
                    </div>
                  </>
                ) : (
                  <NoDataDisplay />
                )}
              </div>
              <div className="flex justify-between items-center mt-1 px-1">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-4 rounded-lg bg-[#818CF8]"></div>
                  <span className="font-satoshi text-sm font-bold text-[#171717]">{forecastData?.projected_attendance || 0}</span>
                  <span className="font-satoshi text-sm font-medium text-[#5D5D5D]">Projected attendance</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-4 rounded-lg bg-[#F87171]"></div>
                  <span className="font-satoshi text-sm font-bold text-[#171717]">{forecastData?.total_predicted_absenteeism || 0}</span>
                  <span className="font-satoshi text-sm font-medium text-[#5D5D5D]">Anticipated absence</span>
                </div>
              </div>
            </div>

            <div className="w-1/4 h-[293px] p-3 rounded-lg border border-gray-200">
              <h3 className="font-satoshi text-lg font-bold mb-10">Predicted Absenteeism</h3>

              {/* Content wrapper - always shows the percentage */}
              <div className="flex flex-col items-center justify-center h-[180px]">
                {forecastData ? (
                  <><div className="flex-1 flex items-center justify-center gap-2">
                    <div
                      ref={arrowRef}
                      className="bg-gray-100 p-2 rounded-lg cursor-pointer"
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                      role="button"
                      aria-label="Show absenteeism graph"
                    >
                      <img
                        src={arrowIcon}
                        alt="trend"
                        className="w-5 h-5" />
                    </div>

                    <p className="font-satoshi text-4xl font-bold text-[#EF2129]">
                      {forecastData?.absenteeism_percentage || 0}%
                    </p>
                  </div><p className="font-satoshi text-sm text-gray-600 text-center mt-2">
                      {forecastData?.text}
                    </p></>
                ) : (
                  <NoDataDisplay />
                )}
              </div>
            </div>

            {/* Tooltip/Popover for Graph */}
            <Overlay
              show={showTooltip}
              target={document.body}
              container={document.body}
              rootClose={true}
              rootCloseEvent="mousedown"
            >
              <Popover className="chart-tooltip">
                <Popover.Header as="h3">Absenteeism Trend Analysis</Popover.Header>
                <Popover.Body>
                  <div
                    className="h-[250px] w-full"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                  >
                    {chartLoading ? (
                      <div className="flex items-center justify-center w-full h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#286DB2]"></div>
                      </div>
                    ) : forecastChartData.length === 0 ? (
                      <div className="flex flex-col items-center justify-center w-full h-full">
                        <p className="text-base font-medium text-gray-600">No trend data available</p>
                        <p className="text-sm text-gray-500 text-center mt-1">
                          Historical trend data could not be loaded
                        </p>
                      </div>
                    ) : (
                      <AgCharts options={chartOptions} />
                    )}
                  </div>
                </Popover.Body>
              </Popover>
            </Overlay>

            {/* Line Chart Card */}
            <div className="flex-1 h-[293px] rounded-lg border border-gray-200 flex flex-col">
              <div className="px-3 py-2">
                <h3 className="font-satoshi text-lg font-bold">Predicted Production Shortage</h3>
              </div>
              <div className='ag-theme-alpine flex-1 overflow-auto predicted-shortage-table'>
                {productionShortageOptions.data.length > 0 ? (
                  <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    domLayout="normal"
                    suppressCellFocus={true}
                    defaultColDef={{
                      resizable: false,
                      sortable: true,
                    }}
                  />
                ) : (
                  <NoDataDisplay />
                )}
              </div>
            </div>
          </div>

          {/* Metric Cards Section */}
          <div className="flex gap-6 mt-6">
            {/* Card 1 */}
            <div className="flex-1 bg-white p-3 rounded-lg border border-gray-200">
              <h3 className="font-satoshi text-lg font-bold mb-3">Total Active Operators</h3>
              <p className="font-satoshi text-4xl font-bold">{forecastData?.total_employees || 0}</p>
              <div className="h-[250px]">
                {operatorDemandOptions ? (
                  <AgCharts options={operatorDemandOptions} />
                ) : (
                  <NoDataDisplay />
                )}
              </div>
            </div>

            {/* Card 2 */}
            <div className="flex-1 bg-white p-3 rounded-lg border border-gray-200">
              <h3 className="font-satoshi text-lg font-bold mb-3">Total Operators Present</h3>
              <p className="font-satoshi text-4xl font-bold">{forecastData?.projected_attendance || 0}</p>
              <div className="h-[250px]">
                {operatorSupplyOptions ? (
                  <AgCharts options={operatorSupplyOptions} />
                ) : (
                  <NoDataDisplay />
                )}
              </div>
            </div>

            {/* Card 3 */}
            <div className="flex-1 bg-white p-3 rounded-lg border border-gray-200">
              <h3 className="font-satoshi text-lg font-bold mb-3">Total Operators Gap</h3>
              <p className="font-satoshi text-4xl font-bold">{forecastData?.total_predicted_absenteeism || 0}</p>
              <div className="h-[250px]">
                {operatorGapOptions ? (
                  <AgCharts options={operatorGapOptions} />
                ) : (
                  <NoDataDisplay />
                )}
              </div>
            </div>
          </div>

          {/* Email Share Modal */}
          {showEmailModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg w-[400px] p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-satoshi text-lg font-semibold">Share Via Email</h2>
                  <button
                    onClick={handleCloseEmailModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <IoClose size={24} />
                  </button>
                </div>
                <Form onSubmit={handleEmailSubmit}>
                  <Form.Group className="mb-4">
                    {/* Email Tag Display */}
                    <div className="flex flex-wrap gap-2 border border-gray-300 rounded-lg p-2 min-h-[42px]">
                      {Array.isArray(emails) && emails.map((email, index) => (
                        <div
                          key={index}
                          className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center"
                        >
                          {email}
                          <button
                            type="button"
                            onClick={() => removeEmail(index)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            {/* ✕ */}
                            <IoClose size={20} />
                          </button>
                        </div>
                      ))}
                      {/* Input Field */}
                      <input
                        type="text"
                        placeholder="Enter email"
                        value={inputValue}
                        onChange={handleEmailChange}
                        onKeyDown={handleKeyDown}
                        className="flex-grow focus:outline-none bg-transparent"
                      />
                    </div>
                    {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
                  </Form.Group>
                  <button
                    type="submit"
                    disabled={emails.length === 0}
                    className={`w-full font-medium py-2 px-4 rounded-lg transition-colors
                      ${emails.length > 0
                        ? 'bg-[#286DB2] hover:bg-[#286DB2] text-white'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                  >
                    Share
                  </button>
                </Form>
              </div>
            </div>
          )}

          {/* Success Modal */}
          {showSuccessModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 flex flex-col items-center relative">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                >
                  <IoClose size={24} />
                </button>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="font-satoshi text-lg font-medium mb-2">Email has been sent successfully</p>
              </div>
            </div>
          )}

          <div
            style={{
              position: 'fixed',
              top: 20,
              right: 20,
              zIndex: 9999
            }}
          >
            <Toast
              show={showToast}
              onClose={() => setShowToast(false)}
              delay={3000}
              autohide
              bg="success"
              className="mb-3"
            >
              <Toast.Header closeButton={true}>
                <strong className="me-auto text-dark">Success</strong>
              </Toast.Header>
              <Toast.Body className="font-satoshi text-white">
                {toastMessage}
              </Toast.Body>
            </Toast>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  )
}
export default Forecast;