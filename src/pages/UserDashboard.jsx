import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Header from '../components/shared/Header';
import Sidenav from '../components/shared/Sidenav';
import { Toast, Button, Spinner, Dropdown, Form } from "react-bootstrap";
import { useUser } from '../context/UserContext';
import API from '../api/api';
import { IoClose } from "react-icons/io5";
import { FaCirclePlus } from "react-icons/fa6";
import { FaCircleMinus } from "react-icons/fa6";
import LoadingOverlay from '../components/shared/LoadingOverlay';
import Footer from '../components/shared/Footer';

import exportIcon from '../assets/Export.svg';
import exportNew from '../assets/Export New.svg';
import generateIcon from '../assets/Generate.svg';
import generateNew from '../assets/Generate New.svg';
import plannedIcon from '../assets/Planned attendance.svg';
import presentIcon from '../assets/Present.svg';
import absentIcon from '../assets/Absent.svg';
import allocatedIcon from '../assets/allocated.svg';
import unallocatedIcon from '../assets/Unallocated_user.svg';
import TargetIcon from '../assets/Target.svg';
import TrendUp from '../assets/TrendUp.svg';
import TrendDown from '../assets/TrendDown.svg';
import ExcelIcon from '../assets/excel.svg';
import MailIcon from '../assets/mail.svg';
import ListIcon from '../assets/list.svg';
import CheckCircleIcon from '../assets/CheckCircle.svg';
import CloseIcon from '../assets/simple-line-icons_close.svg';


import '../index.css'
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { ModuleRegistry } from "@ag-grid-community/core";
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import {
    DndProvider,
    PreferredEmployeesRenderer,
    FinalAllocationRenderer
} from '../components/DragDropEmployees';


// Register required modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

const LoadingData = () => (
    <div className="flex flex-col items-center justify-center p-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-gray-600">Loading data...</p>
    </div>
);

const NoRowsOverlay = () => (
    <div className="flex items-center justify-center p-5">
        <p className="text-gray-600">No data available</p>
    </div>
);


function createBulletproofRowIdGenerator() {
    // A counter that increases with each new ID generation
    let uniqueCounter = 0;

    // Map to store rowIndex to ID mappings
    const rowIndexMap = new Map();

    // WeakMap to track node instances (doesn't prevent garbage collection)
    const nodeInstanceMap = new WeakMap();

    // The actual generator function that AG Grid will call
    return function generateUniqueId(params) {
        // For duplicate rows, create a unique ID based on original ID + duplicate index
        if (params.data?.isDuplicate && params.data?.duplicateIndex !== undefined) {
            return `${String(params.data.Dday_ID)}_duplicate_${params.data.duplicateIndex}`;
        }
        // MOST RELIABLE: If we've seen this exact node instance before, reuse its ID
        // This is crucial for maintaining ID stability across grid refreshes
        if (params.node && nodeInstanceMap.has(params.node)) {
            return String(nodeInstanceMap.get(params.node));
        }

        // RELIABLE: If we have a valid rowIndex and we've seen it before, reuse the ID
        if (params.rowIndex !== undefined && params.rowIndex !== null &&
            rowIndexMap.has(params.rowIndex)) {
            const existingId = rowIndexMap.get(params.rowIndex);

            // Also store the node reference if available
            if (params.node) {
                nodeInstanceMap.set(params.node, existingId);
            }

            return String(existingId);
        }

        // For regular rows, try to use Dday_ID if available
        if (params.data?.Dday_ID && !params.data?.isDuplicate) {
            const ddayId = String(params.data.Dday_ID);

            // Store for future reuse
            if (params.rowIndex !== undefined && params.rowIndex !== null) {
                rowIndexMap.set(params.rowIndex, ddayId);
            }

            if (params.node) {
                nodeInstanceMap.set(params.node, ddayId);
            }

            return ddayId;
        }

        // FALLBACK: Generate a completely new unique ID
        // This combines multiple sources of uniqueness to guarantee no collisions
        const prefix = params.rowIndex !== undefined ? `r${params.rowIndex}` : 'u';
        const timestamp = Date.now().toString().slice(-4);
        const randomSuffix = Math.random().toString(36).substring(2, 5);

        const uniqueId = `${prefix}-${uniqueCounter++}-${timestamp}-${randomSuffix}`;

        // Store for future reuse
        if (params.rowIndex !== undefined && params.rowIndex !== null) {
            rowIndexMap.set(params.rowIndex, uniqueId);
        }

        if (params.node) {
            nodeInstanceMap.set(params.node, uniqueId);
        }

        return uniqueId;
    };
}


const UserDashboard = () => {
    const { userName } = useUser();
    const [greeting, setGreeting] = useState('Good Morning');
    const [activeTab, setActiveTab] = useState('All');
    const [isLoading, setIsLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [tableDataLoading, setTableDataLoading] = useState(true); // Track table data loading
    const [attendanceDataLoading, setAttendanceDataLoading] = useState(true);
    const [excelLoading, setExcelLoading] = useState(false);
    const [unallocatedLoading, setUnallocatedLoading] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [emails, setEmails] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [emailError, setEmailError] = useState('');
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState('success');
    const [showToast, setShowToast] = useState(false);
    const [attendanceData, setAttendanceData] = useState(null);
    const [attendanceStats, setAttendanceStats] = useState({
        present: { count: 0, direction: "no change" },
        absent: { count: 0, direction: "no change" }
    });
    const [unallocatedCount, setUnallocatedCount] = useState(0);
    const [targetVsPlanned, setTargetVsPlanned] = useState({
        target: 0,
        planned: 0,
        percentage: 0
    });

    const [rowData, setRowData] = useState([]);
    const [hasData, setHasData] = useState(true);
    const [refreshCounter, setRefreshCounter] = useState(0);

    const [expandedGroups, setExpandedGroups] = useState(new Set());
    const [originalRecords, setOriginalRecords] = useState([]);

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

    // Auto-refresh functionality with proper dependencies
    useEffect(() => {
        const scheduleNextRefresh = () => {
            const now = new Date();
            const refreshTimes = [
                { hour: 8, minute: 55 },   // 8:55 AM
                { hour: 12, minute: 50 },  // 12:50 PM  
                { hour: 17, minute: 35 }   // 5:35 PM
            ];

            // Find the next refresh time
            let nextRefresh = null;
            let nextTimeInfo = null;

            for (const time of refreshTimes) {
                const refreshDate = new Date();
                refreshDate.setHours(time.hour, time.minute, 0, 0);

                // If this time hasn't passed today, it could be our next refresh
                if (refreshDate > now) {
                    if (!nextRefresh || refreshDate < nextRefresh) {
                        nextRefresh = refreshDate;
                        nextTimeInfo = time;
                    }
                }
            }

            // If no refresh time found for today, get the earliest one tomorrow
            if (!nextRefresh) {
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);

                // Set to the first refresh time tomorrow
                nextRefresh = new Date(tomorrow);
                nextRefresh.setHours(refreshTimes[0].hour, refreshTimes[0].minute, 0, 0);
                nextTimeInfo = refreshTimes[0];
            }

            console.log('Current time:', now.toLocaleString());
            console.log('Next refresh scheduled for:', nextRefresh.toLocaleString());

            return nextRefresh;
        };

        const performAutoRefresh = async () => {
            console.log('🔄 Performing scheduled auto-refresh at:', new Date().toLocaleString());

            try {
                // Show loading states
                setTableDataLoading(true);
                setAttendanceDataLoading(true);

                // Reset expanded groups to prevent stale expansion state
                setExpandedGroups(new Set());

                // Create promises for both API calls
                const tableDataPromise = fetchTableData(true); // Force fresh data
                const attendanceDataPromise = fetchAttendanceData();

                // Wait for both to complete
                await Promise.all([tableDataPromise, attendanceDataPromise]);

                // Show success notification
                setToastType('success');
                setToastMessage('Data refreshed automatically at ' + new Date().toLocaleTimeString());
                setShowToast(true);

                console.log('✅ Auto-refresh completed successfully');
            } catch (error) {
                console.error('❌ Error during auto-refresh:', error);
                setToastType('error');
                setToastMessage('Auto-refresh failed: ' + error.message);
                setShowToast(true);
            } finally {
                // Ensure loading states are cleared
                setTableDataLoading(false);
                setAttendanceDataLoading(false);
            }
        };

        let timeoutId = null;

        const setupAutoRefresh = () => {
            const nextRefresh = scheduleNextRefresh();
            const timeUntilRefresh = nextRefresh.getTime() - Date.now();

            console.log('⏰ Next auto-refresh scheduled for:', nextRefresh.toLocaleString());
            console.log('⏱️ Time until next refresh:', Math.round(timeUntilRefresh / 1000 / 60), 'minutes');

            // Clear any existing timeout
            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            // Set timeout for the next refresh
            timeoutId = setTimeout(() => {
                performAutoRefresh().then(() => {
                    // After refresh completes, schedule the next one
                    setupAutoRefresh();
                });
            }, timeUntilRefresh);

            return timeoutId;
        };

        // Initial setup
        timeoutId = setupAutoRefresh();

        // Also set up an interval to check every minute if we've passed a refresh time
        // This is a failsafe in case setTimeout is not accurate for very long durations
        const checkInterval = setInterval(() => {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentSecond = now.getSeconds();

            const refreshTimes = [
                { hour: 8, minute: 55 },
                { hour: 12, minute: 50 },
                { hour: 17, minute: 35 }
            ];

            // Check if we're within 5 seconds of a refresh time
            const shouldRefresh = refreshTimes.some(time =>
                currentHour === time.hour &&
                currentMinute === time.minute &&
                currentSecond < 5
            );

            if (shouldRefresh) {
                console.log('⚡ Interval check triggered refresh at:', now.toLocaleString());
                // Clear the timeout to prevent double refresh
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }

                performAutoRefresh().then(() => {
                    // Reschedule after this refresh
                    timeoutId = setupAutoRefresh();
                });
            }
        }, 1000); // Check every second

        // Cleanup function
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
                console.log('🧹 Auto-refresh timeout cleared');
            }
            if (checkInterval) {
                clearInterval(checkInterval);
                console.log('🧹 Auto-refresh interval cleared');
            }
        };
    }, [activeTab]); // Add activeTab as dependency since fetchTableData uses it

    useEffect(() => {
        // Only set loading to false when both API calls are complete
        setLoading(tableDataLoading || attendanceDataLoading);
    }, [tableDataLoading, attendanceDataLoading]);

    // Function to toggle group expansion
    const toggleGroupExpansion = (groupKey) => {

        const newExpandedGroups = new Set(expandedGroups);
        if (newExpandedGroups.has(groupKey)) {
            newExpandedGroups.delete(groupKey);
        } else {
            newExpandedGroups.add(groupKey);
        }
        setExpandedGroups(newExpandedGroups);

        // Update the display data immediately
        updateDisplayDataFromRecords(originalRecords, newExpandedGroups);
    };

    // Helper function to update display data from records
    const updateDisplayDataFromRecords = (records, currentExpandedGroups) => {
        if (!records || records.length === 0) {
            console.log('No records to process');
            setRowData([]);
            return;
        }

        // Group by allocated employee
        const groups = {};
        records.forEach((record, index) => {
            const key = record.Allocated_Employee;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(record);
        });

        // Create final data with proper grouping flags
        const finalData = [];
        Object.keys(groups).forEach(groupKey => {
            const groupRecords = groups[groupKey];

            if (groupRecords.length === 1) {
                // Single record, show as is
                finalData.push(groupRecords[0]);
            } else {
                // Multiple records - mark the first one as having grouped records
                const firstRecord = {
                    ...groupRecords[0],
                    hasGrouped: true,
                    groupKey: groupKey,
                    totalCount: groupRecords.length
                };
                finalData.push(firstRecord);

                // If this group is expanded, add the duplicate records
                if (currentExpandedGroups.has(groupKey)) {
                    groupRecords.slice(1).forEach((record, index) => {
                        const duplicateRecord = {
                            ...record,
                            isDuplicate: true,
                            parentGroupKey: groupKey,
                            duplicateIndex: index + 1,
                            originalDdayId: record.Dday_ID,
                            Dday_ID: `${record.Dday_ID}`
                        };
                        finalData.push(duplicateRecord);
                    });
                }
            }
        });
        setRowData(finalData);
    };

    const fetchTableData = async () => {
        setTableDataLoading(true);
        try {
            // Format line parameter based on active tab
            const line = activeTab === 'All' ? 'All' : activeTab;

            const response = await API.getDdayManningData(line);
            const records = response?.data?.data?.records || [];

            const formatNumberSafely = (value) => {

                // Handle null or undefined
                if (value === null || value === undefined) return '-';

                // Convert to number, handling potential string inputs
                const numValue = Number(value);

                // Check if it's a valid number
                if (!isNaN(numValue)) {
                    // If it's a whole number, return as is
                    if (Number.isInteger(numValue)) {
                        return numValue.toString();
                    }
                    // If it has decimal places, round to 1 decimal place
                    return numValue.toFixed(1);
                }

                // Fallback for any unhandled cases
                return '-';
            };

            // Process records to replace null values with '-'
            const processedRecords = records.map(record => {

                let allocatedEmployee = '-';
                if (record['Allocated Employee Name'] && record['Allocated Employee ID']) {
                    allocatedEmployee = `${record['Allocated Employee ID']} ${record['Allocated Employee Name']} (${record['Allocated line'] || '-'})`;
                }

                return {
                    Dday_ID: record['Dday_ID'] || '-',
                    Token_No: record['Token No'] || '-',
                    Style: record.Style || '-',
                    Operator_ID: record['Operator ID'] || '-',
                    Operator_Name: record['Operator Name'] || '-',
                    Machine_Type: record['M/c Or Nm/c'] || '-',
                    Operational_Code: record['Operational code'] || '-',
                    Core_Operation: record['Core Operation'] || '-',
                    Section: record.Section || '-',
                    Planned_Qty: formatNumberSafely(record['Planned Allocated Quantity']),
                    Allocated_Employee: allocatedEmployee,
                    Final_Attendance: record['Attendance Status'] || '-',
                    Final_Allocation: record['Final Allocation'] || '-',
                    Preferred_Employees: record['Preferred Employees'] || '-',
                }
            });

            // Store original records for frontend grouping
            setOriginalRecords(processedRecords);

            // Update display data with current expansion state
            updateDisplayDataFromRecords(processedRecords, expandedGroups);

            // setRowData(processedRecords);
            setHasData(processedRecords.length > 0);

            // Get unallocated operators count from API response
            const unallocatedFromApi = response?.data?.data?.unallocated_emp_data || 0;
            setUnallocatedCount(unallocatedFromApi);

            // Calculate target vs planned quantity from API prediction data
            const predictionData = response?.data?.data?.prediction_data?.['Target data']?.[0];

            if (predictionData) {
                const productionTarget = predictionData.production_target || [];
                const predictedProduction = predictionData.predicted_production || [];

                // Calculate total target
                const totalTarget = productionTarget.reduce((sum, item) => {
                    return sum + (item.total_planned_qty || 0);
                }, 0);

                // Calculate total planned (predicted production)
                const totalPlanned = predictedProduction.reduce((sum, item) => {
                    return sum + (item.total_planned_qty || 0);
                }, 0);

                setTargetVsPlanned({
                    target: totalTarget,
                    planned: totalPlanned,
                });
            } else {
                // Fallback if prediction data is not available
                setTargetVsPlanned({ target: 0, planned: 0, percentage: 0 });
            }

        } catch (error) {
            console.error("Error fetching data:", error);
            setRowData([]);
            setOriginalRecords([]);
            setHasData(false);
            setUnallocatedCount(0);
            setTargetVsPlanned({ target: 0, planned: 0, percentage: 0 });
        } finally {
            setTableDataLoading(false);
        }
    };

    const fetchAttendanceData = async () => {
        setAttendanceDataLoading(true);
        try {
            // Format line parameter based on active tab
            const line = activeTab === 'All' ? 'All' : activeTab;

            const response = await API.getDdayAttendanceData(line);
            const attendance = response?.data?.data?.attendance_data;
            const stats = response?.data?.data?.attendance_stats;

            if (attendance) {
                setAttendanceData({
                    planned: attendance["Planned Attendance"] ?? 0,
                    present: attendance["Present"] ?? 0,
                    absent: attendance["Absent"] ?? 0
                });
            } else {
                setAttendanceData({ planned: 0, present: 0, absent: 0 });
            }

            const defaultStats = {
                present: { count: 0, direction: "no change" },
                absent: { count: 0, direction: "no change" }
            };

            if (stats && typeof stats === 'object') {
                // Create a new object to avoid reference issues
                const newStats = {
                    present: {
                        count: stats.present?.count ?? 0,
                        direction: stats.present?.direction ?? "no change"
                    },
                    absent: {
                        count: stats.absent?.count ?? 0,
                        direction: stats.absent?.direction ?? "no change"
                    }
                };

                setAttendanceStats(newStats);
            } else {
                setAttendanceStats(defaultStats);
            }

        } catch (error) {
            console.error("Error fetching data:", error);
            setAttendanceData({ planned: 0, present: 0, absent: 0 });
            setAttendanceStats({
                present: { count: 0, direction: "no change" },
                absent: { count: 0, direction: "no change" }
            });
            setHasData(false);
        } finally {
            setAttendanceDataLoading(false);
        }
    };

    useEffect(() => {
        setTableDataLoading(true);
        setAttendanceDataLoading(true);

        // Reset expanded groups when tab changes to prevent stale expansion state
        setExpandedGroups(new Set());

        fetchTableData();
        fetchAttendanceData();
    }, [activeTab, refreshCounter]);

    // Function to handle refresh after allocation changes
    const handleAllocationChange = useCallback(async () => {
        try {
            // Show loading indicator
            setTableDataLoading(true);

            // Reset expanded groups to prevent stale expansion state
            setExpandedGroups(new Set());

            // Fetch the latest data directly
            await fetchTableData();

            // Show success toast
            setToastType('success');
            setToastMessage('Employee allocation updated successfully');
            setShowToast(true);
        } catch (error) {
            console.error("Error refreshing data after allocation:", error);
            setToastType('error');
            setToastMessage('Updated allocation but failed to refresh data');
            setShowToast(true);
        } finally {
            setTableDataLoading(false);
        }
    }, [activeTab]);

    // Function to handle refresh after removing an employee 
    const handleRemoveEmployee = useCallback(async (ddayId) => {
        try {
            // Show loading indicator
            setTableDataLoading(true);

            // Reset expanded groups to prevent stale expansion state
            setExpandedGroups(new Set());

            // Clear current data to force fresh load
            setRowData([]);
            setOriginalRecords([]);

            // Add a small delay to ensure backend processing is complete
            await new Promise(resolve => setTimeout(resolve, 500));

            // Fetch the latest data directly
            await fetchTableData();

            // Set success toast for removal
            setToastType('success');
            setToastMessage('Employee removed from allocation successfully');
            setShowToast(true);
        } catch (error) {
            console.error("Error refreshing data after removing employee:", error);
            setToastType('error');
            setToastMessage('Failed to refresh data after removing employee');
            setShowToast(true);
        } finally {
            setTableDataLoading(false);
        }
    }, [activeTab, expandedGroups]);

    const generateDday = async () => {
        try {
            setIsLoading(true);
            const response = await API.generateDdayManningSheet();

            // Log the full response for debugging
            console.log('D-Day Manning response:', response);

            if (response && response.data) {
                // Handle successful case
                console.log('D-Day Manning sheet generated successfully');

                // After successful generation, fetch the updated data
                await Promise.all([fetchTableData(), fetchAttendanceData()]);

                // Set success toast
                setToastType('success');
                setToastMessage('D-Day Manning sheet generated successfully');
            } else {
                // Handle case with unexpected response format
                console.error('Unexpected response format');
                setToastType('error');
                setToastMessage('Failed to generate D-Day Manning sheet');
            }
        } catch (error) {
            // Only enter this block if an actual exception occurs
            console.error('Error generating manning sheet:', error);
            setToastType('error');

            // Check for 500 Internal Server Error
            if (error.response && error.response.status === 500) {
                setToastMessage('Allocation failed. Please try again later.');
            } else {
                setToastMessage('Failed to generate D-Day Manning sheet');
            }
        } finally {
            setIsLoading(false);
            setShowToast(true);
        }
    };

    const handleExcelExport = async () => {
        setExcelLoading(true);
        try {
            const response = await API.exportDdayManningSheet(activeTab);

            const blob = new Blob([response.data], {
                type: 'text/csv'
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Dday_Manning_data_${activeTab}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            setToastMessage('Excel file downloaded successfully');
            setShowToast(true);
        } catch (error) {
            console.error('Error exporting data:', error);
            setToastMessage('Failed to download Excel file', 'error');
        } finally {
            setExcelLoading(false); // Stop loading
        }
    };

    const handleUnallocatedExport = async () => {
        setUnallocatedLoading(true);
        try {
            // Format line parameter - use activeTab directly since API expects the line format
            const line = activeTab === 'All' ? 'All' : activeTab;

            const response = await API.downloadDdayUnallocatedEmployees(line);

            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Unallocated_Employees_DDay_${activeTab}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            setToastType('success');
            setToastMessage('Unallocated employees list downloaded successfully');
            setShowToast(true);
        } catch (error) {
            console.error('Error exporting unallocated employees:', error);
            setToastType('error');
            setToastMessage('Failed to download unallocated employees list');
            setShowToast(true);
        } finally {
            setUnallocatedLoading(false);
        }
    };

    const handleOpenEmailModal = () => {
        setEmails([]); // Clear email field
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

        try {
            await API.exportDdayManningSheet(activeTab, emails.join(','));
            // setShowEmailModal(false);
            setShowSuccessModal(true);
            // setEmail('');
            handleCloseEmailModal();
            setTimeout(() => {
                setShowSuccessModal(false);
            }, 3000);
        } catch (error) {
            console.error('Error sending email:', error);
            setToastMessage('Failed to send email. Please try again later.');
            setShowToast(true);
            handleCloseEmailModal();
        }
    };

    // Simple renderer for allocated employee column with expand/collapse
    const AllocatedEmployeeRenderer = (props) => {
        if (props.data?.hasGrouped) {
            const isExpanded = expandedGroups.has(props.data.groupKey);

            return (
                <div className="flex items-center h-full px-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleGroupExpansion(props.data.groupKey);
                        }}
                        className="mr-2 text-black hover:text-black text-lg font-bold"
                        style={{
                            minWidth: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {isExpanded ? <FaCircleMinus className="text-gray-600" /> : <FaCirclePlus className="text-gray-600" />}
                    </button>
                    <span className="flex-1 truncate">{props.value}</span>
                    <span className="ml-2 text-sm text-gray-500 flex-shrink-0">({props.data.totalCount})</span>
                </div>
            );
        }

        if (props.data?.isDuplicate) {
            return (
                <div className="flex items-center h-full w-full"
                    style={{
                        paddingLeft: '10px', // Indent more clearly
                        backgroundColor: '#f8fafc',
                        borderLeft: '3px solid #e2e8f0'
                    }}>
                    <span className="mr-2 text-gray-400">↳</span>
                    <span className="text-gray-700">{props.value}</span>
                </div>
            );
        }

        return <div className="flex items-center h-full px-2 w-full">
            <span className="truncate">{props.value}</span>
        </div>;
    };

    const AttendanceIconRenderer = (props) => {
        const value = props.value;
        const finalAllocation = props.data?.Final_Allocation;

        // Check if employee is allocated (Final_Allocation is not empty, null, undefined, or '-')
        const isAllocated = finalAllocation &&
            finalAllocation !== '-' &&
            finalAllocation !== '' &&
            finalAllocation.trim() !== '';
        return (
            <div className="flex items-center justify-start w-full h-full">
                {/* {value === 'A' ? (
                    <img
                        src={absentIcon}
                        alt="Absent"
                        className="w-5 h-5"
                    />
                ) : value === 'P' ? (
                    <img
                        src={presentIcon}
                        alt="Present"
                        className="w-5 h-5"
                    />
                ) : null} */}
                {isAllocated ? (
                    // Show allocated icon if employee is allocated
                    <div className="flex items-center gap-1 bg-[#ECFDF5] text-green-600 px-2 py-1 rounded-full text-xs font-medium">
                    <img
                        src={allocatedIcon}
                        alt="Allocated"
                        className="w-5 h-5"
                    />
                    <span>Allocated</span>
                    </div>
                ) : value === 'A' ? (
                    // Show absent icon
                    <div className="flex items-center gap-1 bg-[#FEF2F2] text-red-600 px-2 py-1 rounded-full text-xs font-medium border border-red-200">
                    <img
                        src={CloseIcon}
                        alt="Absent"
                        className="w-5 h-5"
                    />
                    <span>Absent</span>
                    </div>
                ) : value === 'P' ? (
                    // Show present icon
                    <div className="flex items-center gap-1 bg-[#ECFDF5] text-green-600 px-2 py-1 rounded-full text-xs font-medium border border-green-200">
                    <img
                        src={CheckCircleIcon}
                        alt="Present"
                        className="w-5 h-5"
                    />
                    <span>Present</span>
                    </div>
                ) : null}
            </div>
        );
    };

    function MachineTypeRenderer(props) {
        const value = props.value || '';

        // Transform the display value
        let displayValue;
        if (value.toLowerCase() === 'machinist') {
            displayValue = 'M/c';
        } else if (value.toLowerCase() === 'non-machinist') {
            displayValue = 'Nm/c';
        } else {
            // Keep original for any other values
            displayValue = value;
        }

        return <div>{displayValue}</div>;
    }

    // Column Definitions
    const columnDefs = [
        {
            field: 'Token_No',
            headerName: 'Order No.',
            flex: 1,
            minWidth: 110,
            headerClass: 'ag-header-cell-label',
            tooltipField: 'Token_No',
        },
        {
            field: 'Style',
            headerName: 'Style',
            flex: 1,
            minWidth: 110,
            headerClass: 'ag-header-cell-label',
            tooltipField: 'Style',
        },
        {
            field: 'Operator_ID',
            headerName: 'ID',
            flex: 1,
            minWidth: 75,
            headerClass: 'ag-header-cell-label',
        },
        {
            field: 'Operator_Name',
            headerName: 'Op-Name',
            flex: 1,
            minWidth: 120,
            headerClass: 'ag-header-cell-label',
            tooltipField: 'Operator_Name',
        },
        {
            field: 'Machine_Type',
            headerName: 'Mc/Nmc',
            flex: 1,
            minWidth: 70,
            headerClass: 'ag-header-cell-label',
            cellRenderer: MachineTypeRenderer
        },
        {
            field: 'Operational_Code',
            headerName: 'Op-Code',
            flex: 1,
            minWidth: 80,
            headerClass: 'ag-header-cell-label',
        },
        {
            field: 'Core_Operation',
            headerName: 'Core-Op',
            flex: 1,
            minWidth: 100,
            headerClass: 'ag-header-cell-label',
            tooltipField: 'Core_Operation',
        },
        {
            field: 'Section',
            flex: 1,
            minWidth: 90,
            headerClass: 'ag-header-cell-label',
        },
        {
            field: 'Planned_Qty',
            headerName: 'Planned Qty',
            flex: 1,
            minWidth: 90,
            headerClass: 'ag-header-cell-label',
        },
        {
            field: 'Final_Attendance',
            headerName: 'P/A',
            flex: 1,
            minWidth: 120,
            headerClass: 'ag-header-cell-label',
            cellRenderer: AttendanceIconRenderer,
            // sort: 'asc', // This will trigger default sorting
            // sortingOrder: ['asc', 'desc'], // Specify sorting order
            // comparator: (valueA, valueB) => {
            //     // Simple custom comparator to ensure 'A' comes first
            //     const order = ['A', 'P', '-', null, undefined];
            //     // return order.indexOf(valueA) - order.indexOf(valueB);
            //     const getOrderIndex = (value) => {
            //         const index = order.indexOf(value);
            //         return index >= 0 ? index : order.length; // If value not found, put it at the end
            //     };

            //     return getOrderIndex(valueA) - getOrderIndex(valueB);
            // }
        },
        {
            field: 'Allocated_Employee',
            headerName: 'Allocated Employee',
            flex: 1,
            minWidth: 170,
            headerClass: 'ag-header-cell-label',
            tooltipField: 'Allocated_Employee',
            cellRenderer: AllocatedEmployeeRenderer,
        },
        {
            field: 'Final_Allocation',
            headerName: 'Final Allocation',
            flex: 1,
            minWidth: 220,
            headerClass: 'ag-header-cell-label',
            cellRenderer: FinalAllocationRenderer,
            editable: false,
            cellStyle: (params) => {
                if (params.data?.isDuplicate) {
                    return {
                        padding: '0 8px',
                        display: 'flex',
                        alignItems: 'center',
                        color: '#286DB2',
                        // backgroundColor: '#f9fafb'
                    };
                }
                return {
                    padding: '0 8px',
                    display: 'flex',
                    alignItems: 'center',
                    // color: '#286DB2'
                };
            }
        },
        {
            field: 'Preferred_Employees',
            headerName: 'Preferred Employees',
            flex: 1,
            minWidth: 400,
            headerClass: 'ag-header-cell-label',
            cellRenderer: PreferredEmployeesRenderer,
            editable: false,
            cellStyle: (params) => {
                if (params.data?.isDuplicate) {
                    return {
                        padding: '0 8px',
                        display: 'flex',
                        alignItems: 'center',
                        color: '#286DB2',
                        // backgroundColor: '#f9fafb'
                    };
                }
                return {
                    padding: '0 8px',
                    display: 'flex',
                    alignItems: 'center',
                    // color: '#286DB2'
                };
            }
        }
    ];

    const defaultColDef = useMemo(() => ({
        sortable: false,
        filter: false,
        resizable: false,
        // suppressMovableColumns: true
        // floatingFilter: true
    }), []);

    // Tabs data
    const tabs = [
        'All', 'Line 1', 'Line 2', 'Line 3', 'Line 4',
        'Line 5', 'Line 6', 'Line 7', 'Line 8', 'Line 9', 'Line 10'
    ];

    // Static trend indicator for Planned Attendance (trend up 12%)
    const renderPlannedTrendIndicator = () => {
        return (
            <div className="flex items-center gap-2">
                <span className="border border-[#008738] text-[#008738] bg-[#ECFDF5] px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                    <img src={TrendUp} alt="increase" className="w-3 h-3" />
                    12%
                </span>
                <span className="text-gray-500 text-sm">
                    vs Last month
                </span>
            </div>
        );
    };

    // Static trend indicator for Unallocated Operators (trend down 14)
    const renderUnallocatedTrendIndicator = () => {
        return (
            <div className="flex items-center gap-2">
                <span className="border border-[#008738] text-[#008738] bg-[#FEF2F2] px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                    <img src={TrendDown} alt="decrease" className="w-3 h-3" />
                    14
                </span>
                <span className="text-gray-500 text-sm">
                    vs Yesterday
                </span>
            </div>
        );
    };

    // Helper function to render the direction indicator
    const renderDirectionIndicator = (stats, isPresent) => {
        // If stats is missing or malformed, show no change
        if (!stats || typeof stats !== 'object') {
            return <span className="text-gray-500">No change from yesterday</span>;
        }

        // Extract direction and count with fallbacks
        const direction = stats.direction || "no change";
        const count = typeof stats.count === 'number' ? stats.count : 0;

        // Show "No change" message if direction is "no change" or count is 0
        if (direction === "no change" || count === 0) {
            return <span className="text-gray-500">No change from yesterday</span>;
        }

        // For present count, increase is good (green), decrease is bad (red)
        // For absent count, decrease is good (green), increase is bad (red)
        const isPositiveChange = isPresent ? (direction === "increase") : (direction === "decrease");
        const badgeColor = isPositiveChange ?
            "border-[#008738] text-[#008738] bg-[#ECFDF5]" :
            "border-red-500 text-red-500 bg-[#FEF2F2]";

        // const arrowDirection = direction === "increase" ? "↑" : "↓";
        const trendIcon = direction === "increase" ? TrendUp : TrendDown;

        return (
            <div className="flex items-center gap-2">
                <span className={`border ${badgeColor} px-2 py-1 rounded text-xs font-medium flex items-center`}>
                    {/* {arrowDirection} {count} */}
                    <img src={trendIcon} alt={direction} className="w-3 h-3 mr-1" />
                    {count}
                </span>
                <span className="text-gray-500">
                    {/* {direction === "increase" ? "More" : "Less"} than Yesterday */}
                    vs Yesterday
                </span>
            </div>
        );
    };

    const getRowId = useCallback(createBulletproofRowIdGenerator(), []);

    return (
        <DndProvider
            onAllocationChange={handleAllocationChange}
            onRemoveEmployee={handleRemoveEmployee}>
            <div className="h-screen w-screen flex overflow-hidden">
                {isLoading && (
                    <LoadingOverlay
                        title="Preparing the D-Day Allocation sheet"
                        message="Please hold on for a moment"
                    />
                )}
                <Sidenav />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 px-4 py-2 overflow-y-auto overflow-x-hidden" style={{ paddingBottom: '60px' }}>
                        <div className="flex justify-between items-center mb-3">
                            <div>
                                <h2 className="font-satoshi text-2xl font-semibold">{greeting}, {userName}</h2>
                                <h6 className="font-satoshi text-base font-normal">
                                    Your dashboard is now ready with the latest updates.
                                </h6>
                            </div>
                            <div className="flex space-x-2 ">
                                <Dropdown>
                                    <Dropdown.Toggle
                                        variant="outline-primary"
                                        className={`custom-dropdown export-dropdown px-6 bg-[#FFFFFF] border-[#E5E7EB] flex items-center ${!hasData ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={excelLoading || unallocatedLoading || !hasData}
                                    >
                                        <div className="flex items-center">
                                            <img
                                                src={exportNew}
                                                alt="export"
                                                className={`mr-1.5 w-5 h-5 `}
                                            />
                                            <span className="font-satoshi text-base font-medium">
                                                {excelLoading ? "Downloading..." : unallocatedLoading ? "Downloading..." : "Export"}
                                            </span>
                                        </div>
                                    </Dropdown.Toggle>

                                    <Dropdown.Menu >
                                        <Dropdown.Item onClick={hasData ? handleExcelExport : null}
                                            disabled={!hasData || excelLoading || unallocatedLoading}
                                            className="flex items-center">
                                            <img src={ExcelIcon} alt="excel" className="w-4 h-4 mr-2" />
                                            Export as Excel
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={hasData ? handleOpenEmailModal : null}
                                            disabled={!hasData || excelLoading || unallocatedLoading}
                                            className="flex items-center"
                                        >
                                            <img src={MailIcon} alt="mail" className="w-4 h-4 mr-2" />
                                            Share via Email
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            onClick={hasData ? handleUnallocatedExport : null}
                                            disabled={!hasData || excelLoading || unallocatedLoading}
                                            className="flex items-center"
                                        >
                                            <img src={ListIcon} alt="list" className="w-4 h-4 mr-2" />
                                            {unallocatedLoading ? "Downloading..." : "Unallocated list"}
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                                <Button
                                    variant="primary"
                                    className="font-satoshi bg-[#4F46E5] border-[#4F46E5] flex items-center hover:bg-[#4F46E5] hover:border-[#4F46E5]"
                                    onClick={generateDday}
                                    disabled={isLoading}>

                                    <img
                                        src={generateNew}
                                        alt="generate"
                                        className="mr-1.5 w-5 h-5"
                                    />
                                    <span className="font-satoshi text-base font-medium">
                                        Generate
                                    </span>
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-5 gap-2 mt-3">
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <div className="flex items-center mb-4">
                                    {/* <div className="bg-[#E7E7E7] rounded-lg p-1.5 mr-1.5">
                                        <img
                                            src={plannedIcon}
                                            alt="planned"
                                            className="w-5 h-5"
                                        />
                                    </div> */}
                                    <span className="font-satoshi text-lg font-bold">
                                        Planned Attendance
                                    </span>
                                </div>
                                {/* <div className="flex items-center justify-between">
                                    <p className="font-satoshi text-4xl font-semibold">
                                        {attendanceData?.planned}
                                    </p>
                                </div> */}
                                <div className="flex flex-col">
                                    <p className="font-satoshi text-4xl font-semibold mb-2">
                                        {attendanceData?.planned}
                                    </p>
                                    {renderPlannedTrendIndicator()}
                                </div>
                            </div>

                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <div className="flex items-center mb-4">
                                    {/* <div className="bg-[#E7E7E7] rounded-lg p-1.5 mr-1.5">
                                        <img
                                            src={presentIcon}
                                            alt="present"
                                            className="w-5 h-5"
                                        />
                                    </div> */}
                                    <span className="font-satoshi text-lg font-bold">Present</span>
                                </div>
                                {/* <div className="flex items-start justify-between">
                                    <p className="font-satoshi text-4xl font-semibold text-gray-900">
                                        {attendanceData?.present}
                                    </p>
                                    <div className="flex flex-col items-center ml-2">
                                        {renderDirectionIndicator(attendanceStats?.present, true)}
                                    </div>
                                </div> */}
                                <div className="flex flex-col">
                                    <p className="font-satoshi text-4xl font-semibold text-gray-900 mb-2">
                                        {attendanceData?.present}
                                    </p>
                                    {renderDirectionIndicator(attendanceStats?.present, true)}
                                </div>
                            </div>

                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <div className="flex items-center mb-4">
                                    {/* <div className="bg-[#E7E7E7] rounded-lg p-1.5 mr-1.5">
                                        <img
                                            src={absentIcon}
                                            alt="absent"
                                            className="w-5 h-5"
                                        />
                                    </div> */}
                                    <span className="font-satoshi text-lg font-bold">Absent</span>
                                </div>
                                {/* <div className="flex items-start justify-between">
                                    <p className="font-satoshi text-4xl font-semibold text-gray-900">
                                        {attendanceData?.absent}
                                    </p>
                                    <div className="flex flex-col items-center ml-2">
                                        {renderDirectionIndicator(attendanceStats?.absent, false)}
                                    </div>
                                </div> */}
                                <div className="flex flex-col">
                                    <p className="font-satoshi text-4xl font-semibold text-gray-900 mb-2">
                                        {attendanceData?.absent}
                                    </p>
                                    {renderDirectionIndicator(attendanceStats?.absent, false)}
                                </div>
                            </div>

                            {/* New Unallocated Operators Card */}
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <div className="flex items-center mb-4">
                                    {/* <div className="bg-[#E7E7E7] rounded-lg p-1.5 mr-1.5">
                                        <img
                                            src={unallocatedIcon}
                                            alt="absent"
                                            className="w-5 h-5"
                                        />
                                    </div> */}
                                    <span className="font-satoshi text-lg font-bold">Unallocated operators</span>
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center mb-2">
                                        {/* <div className="text-sm text-gray-500">
                                        Operators :

                                    </div> */}
                                        <p className="font-satoshi text-4xl font-semibold items-center">
                                            {unallocatedCount}
                                        </p>
                                    </div>
                                    {renderUnallocatedTrendIndicator()}
                                </div>
                            </div>

                            {/* New Target vs Planned Card */}
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <div className="flex items-center mb-4">
                                    {/* <div className="bg-[#E7E7E7] rounded-lg p-1.5 mr-1.5">
                                        <img
                                            src={TargetIcon}
                                            alt="absent"
                                            className="w-5 h-5"
                                        />
                                    </div> */}
                                    <span className="font-satoshi text-lg font-bold">Target vs Planned Qty</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center bg-[#ECFDF5] p-2 rounded-lg">
                                        <span className="text-sm text-gray-600">Target:</span>
                                        <span className="font-semibold">{targetVsPlanned.target}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-[#F3F4F6] p-2 rounded-lg">
                                        <span className="text-sm text-gray-600">Planned:</span>
                                        <span className="font-semibold">{targetVsPlanned.planned}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="mt-3 border border-gray-200 rounded-lg bg-white">
                            <div className="flex">
                                {tabs.map((tab, index) => (
                                    <button
                                        key={tab}
                                        className={`px-4 py-2 font-satoshi font-medium text-base transition-colors duration-200 flex-1 relative 
                                        ${activeTab === tab
                                                ? 'bg-[#FAFAFA] text-[#4F46E5]'
                                                : 'bg-[#FAFAFA] text-[#171717] hover:bg-[#FAFAFA]'
                                            }
                                            ${index === 0 ? 'rounded-l-lg' : ''}
                                            ${index === tabs.length - 1 ? 'rounded-r-lg' : ''}
                                            `}
                                        onClick={() => setActiveTab(tab)}
                                    >
                                        {/* Inner border for active tab */}
                                        {activeTab === tab && (
                                            <div className="absolute inset-1 border !border-[#4F46E5] rounded-md"></div>
                                        )}
                                        {/* {tab} */}
                                        <span className="relative z-10">{tab}</span>
                                        {/* Vertical separator */}
                                        {index !== tabs.length - 1 && (
                                            <div className="absolute right-0 top-2 bottom-2 w-px bg-gray-200"></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <div className="h-screen w-screen bg-white">
                                <LoadingData />
                            </div>
                        ) : (
                            <>

                                {/* AG Grid Table */}
                                <div className="bg-white border border-gray-100">
                                    <div className="relative h-screen w-full ag-theme-alpine custom-ag-theme">
                                        <AgGridReact
                                            columnDefs={columnDefs}
                                            rowData={rowData}
                                            defaultColDef={defaultColDef}
                                            animateRows={true}
                                            pagination={true}
                                            paginationPageSize={100}
                                            domLayout="normal"
                                            rowHeight={64}
                                            headerHeight={60}
                                            suppressCellFocus={true}
                                            loadingOverlayComponent={LoadingOverlay}
                                            noRowsOverlayComponent={NoRowsOverlay}
                                            loading={loading}
                                            overlayNoRowsTemplate="No data available"
                                            getRowId={getRowId}
                                            context={{ Dday_ID: rowData.map(row => row.Dday_ID) }}
                                            // getRowStyle={(params) => {
                                            //     if (params.data?.isDuplicate) {
                                            //         return { 
                                            //             backgroundColor: '#f9fafb'
                                            //         };
                                            //     }
                                            //     return {};
                                            // }}
                                            // suppressAnimationFrame={true}


                                            getRowStyle={(params) => {
                                                const isUnallocatedEmployee = !params.data?.Allocated_Employee ||
                                                    params.data.Allocated_Employee === '-' ||
                                                    params.data.Allocated_Employee.trim() === '' ||
                                                    params.data.Allocated_Employee.trim() === '-';

                                                if (params.data?.isDuplicate) {
                                                    if (isUnallocatedEmployee) {
                                                        return {
                                                            backgroundColor: '#EF21291A', // Unallocated employee color takes priority
                                                            borderLeft: '3px solid #cbd5e1'
                                                        };
                                                    }
                                                    return {
                                                        backgroundColor: '#f8fafc',
                                                        borderLeft: '3px solid #cbd5e1'
                                                    };
                                                }

                                                if (params.data?.hasGrouped) {
                                                    if (isUnallocatedEmployee) {
                                                        return {
                                                            backgroundColor: '#EF21291A', // Unallocated employee color takes priority
                                                            fontWeight: '500'
                                                        };
                                                    }
                                                    return {
                                                        backgroundColor: '#ffffff',
                                                        fontWeight: '500'
                                                    };
                                                }

                                                if (isUnallocatedEmployee) {
                                                    return {
                                                        backgroundColor: '#EF21291A'
                                                    };
                                                }

                                                return {
                                                    backgroundColor: '#ffffff'
                                                };
                                            }}

                                            getRowClass={(params) => {
                                                if (params.data?.isDuplicate) {
                                                    return 'duplicate-row';
                                                }
                                                if (params.data?.hasGrouped) {
                                                    return 'group-header-row';
                                                }
                                                return 'normal-row';
                                            }}

                                            onGridReady={(params) => {
                                                // Force refresh display after grid is ready
                                                setTimeout(() => {
                                                    params.api.refreshCells({ force: true });
                                                }, 100);
                                            }}
                                            suppressAnimationFrame={true}
                                        />
                                    </div>
                                </div>
                                <Footer />
                            </>
                        )}

                        {/* Email Share Modal */}
                        {showEmailModal && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                <div className="bg-white rounded-lg w-[400px] p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-lg font-semibold">Share Via Email</h2>
                                        <button
                                            onClick={handleCloseEmailModal}
                                            className="text-gray-500 hover:text-gray-700"
                                        >
                                            <IoClose size={24} />
                                        </button>
                                    </div>
                                    <Form onSubmit={handleEmailSubmit}>
                                        <Form.Group className="mb-4">
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
                                    <p className="text-lg font-medium mb-2">Email has been sent successfully</p>
                                </div>
                            </div>
                        )}

                        {/* Toast Notification */}
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
                                bg={toastType === 'success' ? 'success' : 'danger'}
                                className="mb-3"
                            >
                                <Toast.Header closeButton={true}>
                                    <strong className="me-auto text-dark">
                                        {toastType === 'success' ? 'Success' : 'Error'}
                                    </strong>
                                </Toast.Header>
                                <Toast.Body className="text-white">
                                    {toastMessage}
                                </Toast.Body>
                            </Toast>
                        </div>



                    </main>
                </div>
            </div>
        </DndProvider>
    )
}
export default UserDashboard;