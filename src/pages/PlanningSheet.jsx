import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Header from '../components/shared/Header';
import Sidenav from '../components/shared/Sidenav';
import { Dropdown, Button, Spinner, Toast } from "react-bootstrap";
import API from '../api/api';
import downloadIcon from '../assets/Download.svg';
import MachinistIcon from '../assets/Machinist.svg';
import { useLocation, useNavigate } from 'react-router-dom';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiChevronDown } from 'react-icons/fi';
import { FaCirclePlus } from "react-icons/fa6";
import { FaCircleMinus } from "react-icons/fa6";
import TrendUp from '../assets/TrendUp.svg';
import TrendDown from '../assets/TrendDown.svg';
import {
    PlanningSheetDndProvider,
    PlanningSheetPreferredEmployeesRenderer,
    PlanningSheetOperatorInfoRenderer,
    createPlanningSheetRowIdGenerator
} from '../components/PlanningSheetDragDrop';
import Footer from '../components/shared/Footer';

import '../index.css'
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { ModuleRegistry } from "@ag-grid-community/core";
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Register required modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

const LoadingOverlay = () => (
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

const PlanningSheet = () => {
    const [activeTab, setActiveTab] = useState('Collar');
    const [manningData, setManningData] = useState(null);
    const [toastMessage, setToastMessage] = useState("");
    const [showToast, setShowToast] = useState(false);
    const [toastType, setToastType] = useState('success');
    const [loading, setLoading] = useState(false);
    const [dragDropLoading, setDragDropLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
    const [pendingAssignments, setPendingAssignments] = useState(new Map());
    const [submitting, setSubmitting] = useState(false);
    const styleDisplayMap = {
        all: 'All',
    };
    const [selectedStyle, setSelectedStyle] = useState('all');
    const [styleOptions, setStyleOptions] = useState('all');
    const [selectedDate, setSelectedDate] = useState(null);
    const [groupedData, setGroupedData] = useState([]);
    const [expandedGroups, setExpandedGroups] = useState(new Set());

    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const line = queryParams.get('line');
    const days = queryParams.get('forecast_period');

    // Tabs data
    const tabs = ['Collar', 'Cuff', 'Front', 'Back', 'Sleeve', 'Assembly'];

    const handleNavigateBack = () => {
        // navigate(`/planning?forecast_period=${days}`);
        navigate('/planning', { state: { forecastPeriod: days } });
    };

    // Breadcrumb component
    const Breadcrumb = () => {
        return (
            <div className="flex items-center text-2xl font-semibold font-satoshi">
                <span
                    className="cursor-pointer font-satoshi text-2xl font-semibold hover:underline"
                    onClick={handleNavigateBack}
                >
                    Manning Sheet
                </span>
                <span className="mx-2">&gt;</span>
                <span className="font-satoshi text-2xl font-semibold">{line}</span>
            </div>
        );
    };

    // Handle capacity change
    const handleCapacityChange = (rowData, capacity) => {
        try {
            const key = rowData.manningId || rowData.id;

            setPendingAssignments(prev => {
                const newMap = new Map(prev);
                const existingAssignment = newMap.get(key) || {};

                // Store the original capacity if we don't have it yet
                let originalCapacity = existingAssignment.originalCapacity;
                if (originalCapacity === undefined) {
                    // If this is the first time we're changing capacity, store the current value as original
                    originalCapacity = rowData.allocatedCapacity;
                }

                const updatedAssignment = {
                    ...existingAssignment,
                    capacity: capacity,
                    rowData: rowData,
                    originalCapacity: originalCapacity
                };

                newMap.set(key, updatedAssignment);
                return newMap;
            });

            // Update local data to show the entered capacity immediately
            setGroupedData(prevData =>
                prevData.map(row => {
                    if ((row.manningId || row.id) === key) {
                        return {
                            ...row,
                            allocatedCapacity: capacity,
                            // Store original capacity if not already stored
                            originalAllocatedCapacity: row.originalAllocatedCapacity !== undefined
                                ? row.originalAllocatedCapacity
                                : rowData.allocatedCapacity
                        };
                    }
                    return row;
                })
            );

        } catch (error) {
            setToastMessage('Failed to update capacity.');
            setToastType('error');
            setShowToast(true);
        }
    };

    // Check if assignment is complete (has both employee and capacity if needed)
    // const isAssignmentComplete = (assignment, rowData) => {
    //     // If the row already has allocated capacity, we only need employee
    //     const hasExistingCapacity = rowData.allocatedCapacity &&
    //         rowData.allocatedCapacity !== '-' &&
    //         rowData.allocatedCapacity !== 0 &&
    //         rowData.allocatedCapacity !== '0';

    //     if (hasExistingCapacity) {
    //         return !!assignment.employee;
    //     }

    //     // If no existing capacity, we need both employee and capacity
    //     return !!(assignment.employee && assignment.capacity);
    // };

    // Improved removeEmployeeAssignment function
    const removeEmployeeAssignment = (rowData) => {
        try {
            const key = rowData.manningId || rowData.id;

            // Get the pending assignment before removing it
            const pendingAssignment = pendingAssignments.get(key);

            // Remove from pending assignments
            setPendingAssignments(prev => {
                const newMap = new Map(prev);
                newMap.delete(key);
                return newMap;
            });

            // Reset the row data to original state
            setGroupedData(prevData => {
                return prevData.map(row => {
                    if ((row.manningId || row.id) === key) {

                        // Determine what the original capacity should be
                        let resetCapacity = '-'; // Default fallback

                        // Try to get original capacity from different sources
                        if (row.originalAllocatedCapacity !== undefined) {
                            resetCapacity = row.originalAllocatedCapacity;
                        } else if (pendingAssignment?.originalCapacity !== undefined) {
                            resetCapacity = pendingAssignment.originalCapacity;
                        } else {
                            // If no original capacity stored, reset to '-' for unassigned rows
                            resetCapacity = '-';
                        }

                        return {
                            ...row,
                            allocatedCapacity: resetCapacity
                        };
                    }
                    return row;
                });
            });

            setToastMessage('Employee assignment and capacity removed successfully.');
            setToastType('success');
            setShowToast(true);

        } catch (error) {
            setToastMessage('Failed to remove employee assignment.');
            setToastType('error');
            setShowToast(true);
        }
    };

    // Submit all pending assignments
    const submitAllAssignments = async () => {
        const assignments = Array.from(pendingAssignments.values());

        // Filter only complete assignments (have both employee and capacity)
        const completeAssignments = assignments.filter(assignment =>
            assignment.employee && assignment.capacity
        );

        if (completeAssignments.length === 0) {
            setToastMessage('No complete assignments to submit. Please ensure all assignments have both employee and capacity.');
            setToastType('warning');
            setShowToast(true);
            return;
        }

        try {
            setSubmitting(true);

            // Prepare the payload in the required format
            const payload = {
                multiple_IDs: completeAssignments.map(assignment => ({
                    preferred_employee: {
                        [assignment.employee.id]: assignment.employee.name
                    },
                    manning_id: assignment.rowData.manningId.toString(),
                    allocated_capacity: assignment.capacity
                }))
            };

            // Call the batch API (you'll need to create this endpoint)
            const response = await API.updateEmployeeOnHold(payload);

            if (response && (response.status === 200 || response.status === 201)) {

                // Show success message
                // setToastMessage(`Successfully assigned ${completeAssignments.length} employee${completeAssignments.length > 1 ? 's' : ''}.`);
                // setToastMessage(`${completeAssignments.length} Allocations have been successfully assigned.`);
                setToastMessage(`${completeAssignments.length} Allocation${completeAssignments.length > 1 ? 's' : ''} ${completeAssignments.length > 1 ? 'have' : 'has'} been successfully assigned.`);
                setToastType('success');
                setShowToast(true);

                // Clear all pending assignments
                setPendingAssignments(new Map());

                // Refresh the data to get updated values from server
                await fetchManningData();
            } else {
                throw new Error('Unexpected API response');
            }

        } catch (error) {
            let errorMessage = 'Failed to submit assignments.';

            if (error.response) {
                const status = error.response.status;
                const serverMessage = error.response.data?.message || error.response.data?.error;

                if (status === 400) {
                    errorMessage += ' Invalid request data.';
                } else if (status === 401) {
                    errorMessage += ' Authentication required.';
                } else if (status === 403) {
                    errorMessage += ' Access denied.';
                } else if (status === 404) {
                    errorMessage += ' Endpoint not found.';
                } else if (status === 409) {
                    errorMessage += ' Some employees are already assigned to other operations.';
                } else if (status >= 500) {
                    errorMessage += ' Server error. Please try again later.';
                } else {
                    errorMessage += serverMessage ? ` ${serverMessage}` : ' Please try again.';
                }
            } else if (error.request) {
                errorMessage += ' Network error. Please check your connection.';
            } else {
                errorMessage += ' Please try again.';
            }

            setToastMessage(errorMessage);
            setToastType('error');
            setShowToast(true);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClearAll = () => {
        try {
            // Store current pending assignments for reverting changes
            const currentPendingAssignments = new Map(pendingAssignments);

            // Clear pending assignments first
            setPendingAssignments(new Map());

            // Reset all data that was modified by pending assignments
            setGroupedData(prevData => {
                return prevData.map(row => {
                    const key = row.manningId || row.id;
                    const hadPendingAssignment = currentPendingAssignments.has(key);

                    if (hadPendingAssignment) {
                        const pendingAssignment = currentPendingAssignments.get(key);

                        return {
                            ...row,
                            // Reset allocated capacity to original value
                            allocatedCapacity: pendingAssignment.originalCapacity ||
                                row.originalAllocatedCapacity ||
                                (row.allocatedCapacity === pendingAssignment.capacity ? '-' : row.allocatedCapacity)
                        };
                    }
                    return row;
                });
            });

            // Show success message
            setToastMessage('All pending assignments and capacity changes cleared successfully.');
            setToastType('success');
            setShowToast(true);

        } catch (error) {
            setToastMessage('Failed to clear all assignments.');
            setToastType('error');
            setShowToast(true);
        }
    };

    // Fixed groupDataByStyle function with proper sequential ordering after grouping
    const groupDataByStyle = (operations) => {
        if (!operations || operations.length === 0) return [];

        // Step 1: Group operations by style while preserving original order within each group
        const grouped = {};
        const styleFirstIndex = {}; // Track first occurrence index for ordering

        operations.forEach((operation, index) => {
            const style = String(operation.style || 'Unknown Style');
            if (!grouped[style]) {
                grouped[style] = [];
                styleFirstIndex[style] = index; // Remember first occurrence
            }
            grouped[style].push({
                ...operation,
                originalIndex: index,
                originalAllocatedCapacity: operation.allocatedCapacity // Store original allocated capacity for later use
            });
        });

        // Step 2: Sort styles by their first occurrence to maintain some logical order
        const sortedStyles = Object.keys(grouped).sort((a, b) => {
            return styleFirstIndex[a] - styleFirstIndex[b];
        });

        // Step 3: Build result array with proper parent-child adjacency
        const result = [];

        sortedStyles.forEach((style) => {
            const styleOperations = grouped[style];

            if (styleOperations.length === 1) {
                // Single operation - add as-is
                result.push({
                    ...styleOperations[0],
                    id: `single-${style}-${result.length}`,
                    rowType: 'single'
                });
            } else {
                // Multiple operations - create parent and potentially children
                const isExpanded = expandedGroups.has(style);

                // Sort operations within the group by their original index
                const sortedOperations = styleOperations.sort((a, b) => a.originalIndex - b.originalIndex);

                // Create parent row
                const parentRow = {
                    ...sortedOperations[0], // Use first operation as base
                    id: `parent-${style}`,
                    style: style,
                    rowType: 'parent',
                    groupCount: styleOperations.length,
                    isExpanded: isExpanded,
                    // Aggregate quantities
                    plannedQty: '-',
                    allocatedCapacity: '-',
                    // Parent-specific display data
                    Employee_ID: '-',
                    operatorName: '-',
                    preferredEmployees: [],
                    operation: `${styleOperations.length} Operations`,
                    color: styleOperations.length > 1 ? 'Multiple' : sortedOperations[0].color,
                    ocNumber: styleOperations.length > 1 ? 'Multiple' : sortedOperations[0].ocNumber
                };

                result.push(parentRow);

                // If expanded, add all children immediately after parent
                if (isExpanded) {
                    sortedOperations.forEach((childOp, childIdx) => {
                        const childRow = {
                            ...childOp,
                            id: `child-${style}-${childIdx}`,
                            rowType: 'child',
                            parentStyle: style,
                            childIndex: childIdx
                        };
                        result.push(childRow);
                    });
                }
            }
        });
        return result;
    };

    // Toggle function
    const toggleGroup = (style) => {

        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(style)) {
                newSet.delete(style);
            } else {
                newSet.add(style);
            }
            return newSet;
        });
    };

    // Handle drag end event - updated to work with pending assignments
    const handleDragEnd = async (employee, targetOperation) => {
        if (!employee || !targetOperation || !targetOperation.manningId) {
            console.error('Missing required data for drag and drop');
            setToastMessage('Invalid assignment data. Please try again.');
            setToastType('error');
            setShowToast(true);
            return;
        }

        // Check if operator is already allocated
        const isAllocated = (targetOperation.Employee_ID &&
            targetOperation.Employee_ID !== '-' &&
            targetOperation.Employee_ID !== 0 &&
            String(targetOperation.Employee_ID) !== '0') ||
            (targetOperation.operatorName && targetOperation.operatorName !== '-');

        if (isAllocated) {
            setToastMessage('Cannot assign employee. This operation already has an allocated operator.');
            setToastType('error');
            setShowToast(true);
            return;
        }

        const key = targetOperation.manningId || targetOperation.id;

        // Check if the row already has allocated capacity
        const hasExistingCapacity = targetOperation.allocatedCapacity &&
            targetOperation.allocatedCapacity !== '-' &&
            targetOperation.allocatedCapacity !== 0 &&
            targetOperation.allocatedCapacity !== '0';

        // Update pending assignments with employee info
        setPendingAssignments(prev => {
            const newMap = new Map(prev);
            const existingAssignment = newMap.get(key) || {};

            const updatedAssignment = {
                ...existingAssignment,
                employee: employee,
                rowData: targetOperation
            };

            // If row already has capacity, add it to the assignment
            if (hasExistingCapacity) {
                updatedAssignment.capacity = targetOperation.allocatedCapacity;
            }

            newMap.set(key, updatedAssignment);
            return newMap;
        });

        // Show appropriate message
        if (hasExistingCapacity) {
            setToastMessage(`Employee ${employee.id} (${employee.name}) assigned. Click Submit to save all changes.`);
        } else {
            setToastMessage(`Employee ${employee.id} (${employee.name}) assigned. Please enter allocated capacity.`);
        }
        setToastType('success');
        setShowToast(true);

        setTimeout(() => {
            // Trigger a re-render by updating the grouped data reference
            setGroupedData(prevData => [...prevData]);
        }, 50);
    };

    // useEffect(() => {
    const fetchManningData = async () => {
        setLoading(true);
        try {
            let plannedDate = null;
            if (selectedDate) {
                // Format as 'YYYY-MM-DD' string
                const year = selectedDate.getFullYear();
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const day = String(selectedDate.getDate()).padStart(2, '0');
                plannedDate = `${year}-${month}-${day}`;
            }

            const response = await API.getManningSheet(
                line,
                activeTab,
                parseInt(days),
                selectedStyle,
                plannedDate
            );

            const apiData = response.data.data;

            if (Array.isArray(apiData.unique_styles) && apiData.unique_styles.length > 0) {
                setStyleOptions([...apiData.unique_styles]);
            }

            const mappedOperations = apiData.table_data.map(item => {
                const smv = item.SMV ? parseFloat(item.SMV) : 0;
                const actualPerfValue = parseFloat(item["Actual Perf%"]);

                const operation = {
                    date: item.Date ?? '-',
                    // orderNumber: item["Order Number"] ?? '-',
                    ocNumber: item["OC Number"] ?? '-',
                    // code: item.Code ?? '-',
                    operation: item.Operation ?? '-',
                    color: item.Color ?? '-',
                    style: item.Style ?? '-',
                    // machine: item["Machine Type"] ?? '-',
                    plannedQty: item["Planned Quantity"] ?? '-',
                    allocatedCapacity: item["Allocated Capacity"] ?? '-',
                    // Employee_ID: !item["Operator ID"] ? '-' : item["Operator ID"],
                    Employee_ID: !item["Operator ID"] || item["Operator ID"] === 0 || item["Operator ID"] === '0' || item["Operator ID"] === '' ? '-' : item["Operator ID"],
                    // operatorName: item["Operator Name"] ?? '-',
                    operatorName: !item["Operator Name"] ? '-' : item["Operator Name"],
                    shortageReason: item["Shortage Reason"] ?? '',
                    preferredEmployees: item["Preferred Employees"] ?? [],
                    manningId: item["Manning_ID"] ?? null,
                    // smv: parseFloat(smv.toFixed(2)),  // Convert to number with 2 decimal places
                    // actualPerf: isNaN(actualPerfValue) ? "0.00" : actualPerfValue.toFixed(2)
                };

                return operation;
            });

            // Define the known keys
            const knownFields = [
                "SNLS", "BUTTON HOLE", "Overlock", "DNCS", "Wrapping",
                "SNES", "DNLS", "Bartack", "B/T", "Ironers"
            ];

            // Extract additional keys that are not part of knownKeys
            const machinistInfo = apiData.machinist_nonMachinist_info || {};
            const otherTotal = Object.entries(machinistInfo)
                .filter(([key]) => !knownFields.includes(key)) // Exclude known fields
                .reduce((sum, [, value]) => sum + (parseFloat(value) || 0), 0);

            // Extract Target and Planned quantities for the current active tab
            const getQuantityForSection = (dataArray, sectionName) => {
                if (!Array.isArray(dataArray)) return 0;
                const sectionData = dataArray.find(item => item.section === sectionName);
                return sectionData ? sectionData.total_planned_qty || 0 : 0;
            };

            // Get target data (assuming it's the first item in Target data array)
            const targetData = (apiData.Target_data && apiData.Target_data.length > 0)
                ? apiData.Target_data[0]
                : (apiData["Target data"] && apiData["Target data"].length > 0)
                    ? apiData["Target data"][0]
                    : {};

            const targetQuantity = getQuantityForSection(targetData.production_target, activeTab);
            const plannedQuantity = getQuantityForSection(targetData.predicted_production, activeTab);

            const mergedData = {
                generalInfo: apiData.info || {},

                SNLS: apiData.machinist_nonMachinist_info?.SNLS || '-',
                "B/H": apiData.machinist_nonMachinist_info?.["BUTTON HOLE"] || '-',
                Overlock: apiData.machinist_nonMachinist_info?.Overlock || '-',
                DNCS: apiData.machinist_nonMachinist_info?.DNCS || '-',
                Wrapping: apiData.machinist_nonMachinist_info?.Wrapping || '-',
                SNES: apiData.machinist_nonMachinist_info?.SNES || '-',
                DNLS: apiData.machinist_nonMachinist_info?.DNLS || '-',
                Bartack: apiData.machinist_nonMachinist_info?.Bartack || '-',
                "B/T": apiData.machinist_nonMachinist_info?.["B/T"] || '-',
                Ironers: apiData.machinist_nonMachinist_info?.Ironers || '-',

                Others: otherTotal > 0 ? otherTotal.toFixed(1) : null,

                // Machinist counts
                Machinist: apiData.machinist_nonMachinist_count?.total_required || 0,
                Actual_Machinist: apiData.machinist_nonMachinist_count?.total_available || 0,
                // "Non Machinist": apiData.machinist_nonMachinist_count?.non_machinist_required || 0,
                // "Actual_Non Machinist": apiData.machinist_nonMachinist_count?.non_machinist_available || 0,
                // "Total Machinist": apiData.machinist_nonMachinist_count?.total_required || 0,
                // "Actual_Total Machinist": apiData.machinist_nonMachinist_count?.total_available || 0,

                // New fields for Target and Planned quantities
                Target_Quantity: targetQuantity,
                Planned_Quantity: plannedQuantity,

                // Table data
                operations: mappedOperations
            };

            setManningData(mergedData);
        } catch (err) {
            console.error('Error fetching manning data:', err);
        } finally {
            setLoading(false);
        }
    };

    //     fetchManningData();
    // }, [activeTab, line, days, selectedStyle, selectedDate]);

    // Update useEffect to use manual grouping with proper dependency handling
    useEffect(() => {
        if (manningData?.operations && Array.isArray(manningData.operations)) {
            // Only process if we actually have operations
            if (manningData.operations.length > 0) {
                const grouped = groupDataByStyle(manningData.operations);

                // Clear and reset the data to force AG Grid to update properly
                setGroupedData([]);

                // Use setTimeout to ensure AG Grid processes the empty array first
                setTimeout(() => {
                    setGroupedData(grouped);
                }, 10);
            } else {
                setGroupedData([]);
            }
        } else {
            setGroupedData([]);
        }
    }, [manningData?.operations, Array.from(expandedGroups).join(',')]);

    useEffect(() => {
        fetchManningData();
    }, [activeTab, line, days, selectedStyle, selectedDate]);


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showDownloadDropdown && !event.target.closest('.download-dropdown-container')) {
                setShowDownloadDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDownloadDropdown]);

    const handleSectionDownload = async () => {
        try {
            setDownloading(true);
            setShowDownloadDropdown(false); // Close dropdown

            let plannedDate = null;
            if (selectedDate) {
                // Format as 'YYYY-MM-DD' string
                const year = selectedDate.getFullYear();
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const day = String(selectedDate.getDate()).padStart(2, '0');
                plannedDate = `${year}-${month}-${day}`;
            }

            const response = await API.downloadSectionManningSheet(line, activeTab, days, selectedStyle, plannedDate);
            console.log('Section manning sheet downloaded:', response.data);

            if (!response.data || response.data.size < 1000 || response.data.type === "application/json") {
                console.error('No data available for download');
                setToastMessage(`No data available for ${line} ${activeTab} ${days} days`);
                setShowToast(true);
                return;
            }

            // Create a downloadable link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `Manning_Sheet_${line}_${activeTab}_${days} days.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);

            setToastMessage(`Manning sheet for ${line} ${activeTab} ${days} days downloaded successfully`);
            setShowToast(true);
        } catch (error) {
            console.error("Error downloading section data:", error);
            setToastMessage(`Failed to download sheet for ${line} ${activeTab} ${days} days`);
            setShowToast(true);
        } finally {
            setDownloading(false);
        }
    };

    // Function to download unallocated employees data
    const handleUnallocatedDownload = async () => {
        try {
            setDownloading(true);
            setShowDownloadDropdown(false); // Close dropdown

            const response = await API.downloadUnallocatedEmployees(line, days);
            console.log('Unallocated employees downloaded:', response.data);

            if (!response.data || response.data.size < 1000 || response.data.type === "application/json") {
                console.error('No data available for download');
                setToastMessage(`No unallocated employees data available for ${line}`);
                setShowToast(true);
                return;
            }

            // Create a downloadable link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `Unallocated_Employees_${line}_${days} days.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);

            setToastMessage(`Unallocated employees list for ${line} downloaded successfully`);
            setShowToast(true);
        } catch (error) {
            console.error("Error downloading unallocated employees:", error);
            setToastMessage(`Failed to download unallocated employees list for ${line}`);
            setShowToast(true);
        } finally {
            setDownloading(false);
        }
    };

    // Toggle dropdown visibility
    const toggleDownloadDropdown = () => {
        setShowDownloadDropdown(!showDownloadDropdown);
    };

    const downloadAllStyles = () => {
        // Check if we have data to download
        if (!manningData || !manningData.operations || manningData.operations.length === 0) {
            alert('No data available for download.');
            return;
        }

        try {
            // Extract unique styles from operations
            const styles = new Set();
            manningData.operations.forEach(operation => {
                if (operation.style && operation.style !== '-') {
                    styles.add(operation.style);
                }
            });

            // If no styles found
            if (styles.size === 0) {
                alert('No style information available for download.');
                return;
            }

            // Convert styles to array and sort alphabetically for better readability
            const stylesArray = Array.from(styles).sort();

            // Convert to CSV format
            const csvContent = [
                'Styles',  // Header
                ...stylesArray  // Each style on its own line
            ].join('\n');

            // Create blob and download link
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `All_Styles.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading styles:', error);
            alert('Failed to download styles. Please try again.');
        }
    };

    // Get count of complete assignments
    const getCompleteAssignmentsCount = () => {
        return Array.from(pendingAssignments.values()).filter(assignment =>
            assignment.employee && assignment.capacity
        ).length;
    };

    // Get count of incomplete assignments
    const getIncompleteAssignmentsCount = () => {
        return Array.from(pendingAssignments.values()).filter(assignment =>
            assignment.employee && !assignment.capacity
        ).length;
    };

    // Allocated Capacity Cell Renderer Component
    const AllocatedCapacityCellRenderer = ({ data, onCapacityChange, pendingAssignments, onRemoveEmployee }) => {
        const [inputValue, setInputValue] = useState('');
        const [isEditing, setIsEditing] = useState(false);
        const inputRef = useRef(null);

        // Check if there's no allocated capacity data
        const hasNoCapacity = !data.allocatedCapacity ||
            data.allocatedCapacity === '-' ||
            data.allocatedCapacity === 0 ||
            data.allocatedCapacity === '0';

        // Check if there's a pending employee assignment for this row
        const key = data.manningId || data.id;
        const pendingAssignment = pendingAssignments.get(key);
        const hasAssignedEmployee = pendingAssignment?.employee;
        const pendingCapacity = pendingAssignment?.capacity;

        // Effect to focus input when editing starts
        useEffect(() => {
            if (isEditing && inputRef.current) {
                // Multiple attempts to ensure focus works
                const focusInput = () => {
                    if (inputRef.current) {
                        inputRef.current.focus();
                        inputRef.current.select();
                    }
                };

                // Immediate focus
                focusInput();

                // Backup focus attempts
                setTimeout(focusInput, 0);
                setTimeout(focusInput, 10);
                setTimeout(focusInput, 50);
                setTimeout(focusInput, 100);
            }
        }, [isEditing]);

        // Wrapper div for consistent centering
        const wrapperStyles = "w-full h-full flex justify-center";

        // Function to handle entering edit mode
        const enterEditMode = (initialValue = '') => {
            // Set state first
            setInputValue(initialValue);
            setIsEditing(true);

            // Force immediate focus using requestAnimationFrame
            requestAnimationFrame(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.select();
                }
            });
        };

        // Function to handle saving changes
        const saveChanges = () => {
            setIsEditing(false);
            if (inputValue && !isNaN(parseInt(inputValue)) && parseInt(inputValue) > 0) {
                onCapacityChange(data, parseInt(inputValue));
            } else {
                setInputValue('');
            }
        };

        // Function to cancel editing
        const cancelEditing = () => {
            setIsEditing(false);
            setInputValue('');
        };

        // Don't show input for parent rows
        if (data.rowType === 'parent') {
            return (
                <div className={wrapperStyles}>
                    <span className="text-center">{data.allocatedCapacity || '-'}</span>
                </div>
            );
        }

        // If there's existing capacity data, show it
        if (!hasNoCapacity && !hasAssignedEmployee) {
            return (
                <div className={wrapperStyles}>
                    <span className="text-center">
                        {typeof data.allocatedCapacity === 'number'
                            ? data.allocatedCapacity.toFixed(0)
                            : data.allocatedCapacity}
                    </span>
                </div>
            );
        }

        // Show pending capacity if exists
        if (pendingCapacity) {
            return (
                <div className={wrapperStyles}>
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            type="number"
                            value={inputValue}
                            onChange={(e) => {
                                // Only allow integer values - remove any decimal points
                                const value = e.target.value.replace(/[.,]/g, '');
                                setInputValue(value);
                            }}
                            onBlur={(e) => {
                                // Delay blur to allow for proper event handling
                                setTimeout(() => {
                                    if (document.activeElement !== inputRef.current) {
                                        saveChanges();
                                    }
                                }, 100);
                            }}
                            onKeyDown={(e) => {
                                e.stopPropagation();
                                // Prevent decimal point entry
                                if (e.key === '.' || e.key === ',') {
                                    e.preventDefault();
                                    return;
                                }
                                if (e.key === 'Enter') {
                                    e.stopPropagation();
                                    saveChanges();
                                }
                                if (e.key === 'Escape') {
                                    e.stopPropagation();
                                    cancelEditing();
                                }
                            }}
                            className="w-20 h-8 px-2 border border-green-400 rounded text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200 text-center"
                            placeholder="Enter"
                            step="1"
                            min="1"
                            autoFocus
                        />
                    ) : (
                        <div className="flex items-center space-x-1">
                            <span className="text-center bg-yellow-100 px-2 py-1 rounded text-sm">
                                {pendingCapacity}
                            </span>
                            <button
                                onMouseDown={(e) => {
                                    // Use mouseDown instead of click for better responsiveness
                                    e.preventDefault();
                                    e.stopPropagation();
                                    enterEditMode(pendingCapacity.toString());
                                }}
                                className="text-blue-600 hover:text-blue-800 text-xs p-1 hover:bg-blue-50 rounded transition-colors"
                                title="Edit capacity"
                                type="button"
                            >
                                ✎
                            </button>
                        </div>
                    )}
                </div>
            );
        }

        // Show assigned employee info and capacity input
        if (hasAssignedEmployee) {
            return (
                <div className={wrapperStyles}>

                    {/* Capacity input */}
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            type="number"
                            value={inputValue}
                            onChange={(e) => {
                                // Only allow integer values - remove any decimal points
                                const value = e.target.value.replace(/[.,]/g, '');
                                setInputValue(value);
                            }}
                            onBlur={(e) => {
                                // Delay blur to allow for proper event handling
                                setTimeout(() => {
                                    if (document.activeElement !== inputRef.current) {
                                        saveChanges();
                                    }
                                }, 100);
                            }}
                            onKeyPress={(e) => {
                                e.stopPropagation();
                                // Prevent decimal point entry
                                if (e.key === '.' || e.key === ',') {
                                    e.preventDefault();
                                    return;
                                }
                                if (e.key === 'Enter') {
                                    saveChanges();
                                }
                                if (e.key === 'Escape') {
                                    cancelEditing();
                                }
                            }}
                            className="w-24 h-8 px-2 border border-green-400 rounded text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200"
                            placeholder="Enter capacity"
                            step="1"
                            min="0"
                            autoFocus
                        />
                    ) : (
                        <button
                            onMouseDown={(e) => {
                                // Use mouseDown for more immediate response
                                e.preventDefault();
                                e.stopPropagation();
                                enterEditMode('');
                            }}
                            className="h-16 px-2 border border-green-400 rounded text-xs text-green-600 hover:border-green-500 hover:text-green-700 bg-green-50 hover:bg-green-100 transition-colors leading-tight flex flex-col items-center justify-center"
                            type="button"
                        >
                            <div>Enter allocated</div>
                            <div>capacity</div>
                        </button>
                    )}
                </div>
            );
        }

        // Show disabled input when no employee is assigned yet
        return (
            <div className={wrapperStyles}>
                <button
                    disabled
                    className="h-16 px-2 border border-dashed border-gray-300 rounded text-xs text-gray-400 bg-gray-100 cursor-not-allowed leading-tight flex flex-col items-center justify-center"
                >
                    <div>Assign employee</div>
                    <div>first</div>
                </button>
            </div>
        );
    };

    const columnDefs = [
        {
            field: 'date', headerName: 'Date', flex: 1, minWidth: 120, tooltipField: 'date',
            cellRenderer: (params) => {
                const data = params.data;

                if (data.rowType === 'parent') {
                    return (
                        <div className="flex items-center cursor-pointer w-full" onClick={(e) => {
                            e.stopPropagation();
                            toggleGroup(data.style);
                        }}>
                            <span className="mr-2 text-lg select-none font-bold">
                                {/* {data.isExpanded ? '−' : '+'} */}
                                {data.isExpanded ? <FaCircleMinus className="text-gray-600" /> : <FaCirclePlus className="text-gray-600" />}
                            </span>
                            <span>{data.date} (Group)</span>
                        </div>
                    );
                }

                if (data.rowType === 'child') {
                    return <span className="pl-2">{data.date}</span>;
                }

                return <span>{data.date}</span>;
            }
        },
        // { field: 'orderNumber', headerName: 'Order Number', flex: 1, minWidth: 110 },
        {
            field: 'ocNumber', headerName: 'OC Number', flex: 1, minWidth: 150, tooltipField: 'ocNumber',
            cellRenderer: (params) => {
                if (params.data.rowType === 'child') {
                    return <span className="pl-2">{params.value}</span>;
                }
                return <span>{params.value}</span>;
            }
        },
        // { field: 'code', headerName: 'Op-Code', flex: 1, minWidth: 90 },
        {
            field: 'operation', headerName: 'Operation', flex: 1, minWidth: 170, tooltipField: 'operation',
            cellRenderer: (params) => {
                if (params.data.rowType === 'child') {
                    return <span className="pl-2">{params.value}</span>;
                }
                return <span>{params.value}</span>;
            }
        },
        {
            field: 'color', headerName: 'Color', flex: 1, minWidth: 150, tooltipField: 'color',
            cellRenderer: (params) => {
                if (params.data.rowType === 'child') {
                    return <span className="pl-2">{params.value}</span>;
                }
                return <span>{params.value}</span>;
            }
        },
        {
            field: 'style',
            headerName: 'Style',
            flex: 1,
            minWidth: 150,
            tooltipField: 'style',
            cellRenderer: (params) => {
                const data = params.data;

                if (data.rowType === 'parent') {
                    return (
                        <div className="flex items-center w-full">
                            <span className="flex-1 truncate font-semibold" title={String(data.style || '')}>
                                {String(data.style || '')}
                            </span>
                            <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">
                                {data.groupCount}
                            </span>
                        </div>
                    );
                }

                if (data.rowType === 'child') {
                    return <span className="pl-2">{String(data.style || '')}</span>;
                }

                return <span className="truncate" title={String(data.style || '')}>{String(data.style || '')}</span>;
            }
        },
        // { field: 'machine', headerName: 'Machine', flex: 1, minWidth: 90 },
        {
            field: 'plannedQty', headerName: 'Planned Qty', flex: 1, minWidth: 90,
            valueFormatter: params => {
                if (params.data.rowType === 'parent' && typeof params.value === 'number') {
                    return params.value.toFixed(0);
                }
                return params.value || '-';
            },
            cellStyle: {
                padding: 0,
                display: 'flex',
                justifyContent: 'center'
            }
        },
        {
            field: 'allocatedCapacity', headerName: 'Allocated Capacity', flex: 1, minWidth: 120,
            // valueFormatter: params => {
            //     if (params.data.rowType === 'parent' && typeof params.value === 'number') {
            //         return params.value.toFixed(2);
            //     }
            //     return params.value || '-';
            // },
            cellRenderer: (params) => {
                // Create a unique operation identifier that matches what the drag-and-drop expects
                const operation = {
                    ...params.data,
                    // Use a more specific identifier that includes rowType and unique IDs
                    dropZoneId: params.data.rowType === 'child'
                        ? `${params.data.id}-${params.data.manningId}`
                        : `${params.data.style}-${params.data.manningId || params.data.id}`
                };

                // if (params.data.rowType === 'child') {
                //     return (
                //         <div className="pl-2 h-full flex items-stretch">
                //             <AllocatedCapacityCellRenderer
                //                 data={operation}
                //                 onCapacityChange={handleCapacityChange}
                //                 pendingAssignments={pendingAssignments}
                //                 onRemoveEmployee={removeEmployeeAssignment}
                //             />
                //         </div>
                //     );
                // }
                return (
                    <AllocatedCapacityCellRenderer
                        data={operation}
                        onCapacityChange={handleCapacityChange}
                        pendingAssignments={pendingAssignments}
                        onRemoveEmployee={removeEmployeeAssignment}
                    />
                );
            },
            cellStyle: {
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
            }
        },
        {
            field: 'operatorName',
            headerName: 'Operator Info',
            flex: 1,
            minWidth: 180,
            cellRenderer: (params) => {
                // For parent rows, show centered dash
                if (params.data.rowType === 'parent') {
                    return (
                        <div className="w-full h-full flex justify-center">
                            <span>-</span>
                        </div>
                    );
                }

                // Check if there's a pending employee assignment for this row
                const key = params.data.manningId || params.data.id;
                const pendingAssignment = pendingAssignments.get(key);
                const pendingEmployee = pendingAssignment?.employee;

                // Create a unique operation identifier that matches what the drag-and-drop expects
                const operation = {
                    ...params.data,
                    // Use a more specific identifier that includes rowType and unique IDs
                    dropZoneId: params.data.rowType === 'child'
                        ? `${params.data.id}-${params.data.manningId}`
                        : `${params.data.style}-${params.data.manningId || params.data.id}`
                };

                // If there's a pending employee assignment, show it with remove option
                if (pendingEmployee) {
                    return (
                        <div className={`w-full h-full flex items-center ${params.data.rowType === 'child' ? 'pl-2' : ''}`}>
                            <div className="flex items-center space-x-2 bg-yellow-100 px-2 py-1 rounded border border-yellow-300 w-full">
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-yellow-800 truncate">
                                        {pendingEmployee.id} - {pendingEmployee.name}
                                    </div>
                                    {/* <div className="text-xs text-yellow-600">
                                        Pending Assignment
                                    </div> */}
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        removeEmployeeAssignment(params.data);
                                    }}
                                    className="text-red-600 hover:text-red-800 text-xs font-bold px-1"
                                    title="Remove assignment"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    );
                }

                // Use your existing PlanningSheetOperatorInfoRenderer for all other cases
                // (including allocated operators, shortage reasons, and drop zones)
                if (params.data.rowType === 'child') {
                    return (
                        <div className="pl-2">
                            <PlanningSheetOperatorInfoRenderer
                                {...params}
                                data={operation}
                                pendingEmployee={pendingEmployee}
                                onRemoveEmployee={removeEmployeeAssignment}
                            />
                        </div>
                    );
                }

                return (
                    <PlanningSheetOperatorInfoRenderer
                        {...params}
                        data={operation}
                        pendingEmployee={pendingEmployee}
                        onRemoveEmployee={removeEmployeeAssignment}
                    />
                );
            },
            tooltipValueGetter: params => {
                if (params.data.rowType === 'parent') return '';

                // Check for pending assignment
                const key = params.data.manningId || params.data.id;
                const pendingAssignment = pendingAssignments.get(key);
                if (pendingAssignment?.employee) {
                    return `Pending: ${pendingAssignment.employee.id} - ${pendingAssignment.employee.name}`;
                }

                // Show shortage reason if no operator
                if (!params.data.operatorName || params.data.operatorName === '-') {
                    return params.data.shortageReason || 'No operator assigned';
                }

                // Show operator info
                const { Employee_ID, operatorName } = params.data;
                const isValidEmpId = Employee_ID &&
                    Employee_ID !== '-' &&
                    Employee_ID !== 0 &&
                    String(Employee_ID) !== '0';
                return isValidEmpId ? `${Employee_ID} - ${operatorName}` : operatorName;
            },
            // cellStyle: {
            //     padding: 0,
            //     display: 'flex',
            //     alignItems: 'center'
            // }
        },
        {
            field: 'preferredEmployees',
            headerName: 'Preferred Employees',
            flex: 1,
            minWidth: 250,
            // cellRenderer: PreferredEmployeesCellRenderer,
            cellRenderer: (params) => {
                if (params.data.rowType === 'child') {
                    return (
                        <div className="pl-2 h-full">
                            <PlanningSheetPreferredEmployeesRenderer {...params} />
                        </div>
                    );
                }
                return <PlanningSheetPreferredEmployeesRenderer {...params} />;
            },
            valueFormatter: params => '',
            // cellStyle: {
            //     padding: 0,
            //     display: 'flex',
            //     alignItems: 'flex-start'
            // }
        },
    ];

    const defaultColDef = useMemo(() => ({
        sortable: false,
        filter: false,
        resizable: false,
        suppressMovable: true,
        cellStyle: {
            fontFamily: 'Satoshi',
            fontSize: '14px',
            fontWeight: 'medium',
            color: '#171717'
        },
    }), []);

    // Date change handler
    const handleDateChange = (date) => {
        setSelectedDate(date);
    };

    // Use the bulletproof row ID generator
    const getRowId = useCallback(createPlanningSheetRowIdGenerator(), []);

    return (
        <PlanningSheetDndProvider onDragEnd={handleDragEnd}>
            <div className="h-screen w-screen flex overflow-hidden">
                {dragDropLoading && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 flex flex-col items-center shadow-lg">
                            <Spinner animation="border" variant="primary" className="mb-3" />
                            <p className="text-gray-700 font-medium">Assigning employee...</p>
                            <p className="text-gray-500 text-sm mt-1">Please wait while we update the data</p>
                        </div>
                    </div>
                )}
                <Sidenav />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 px-4 py-2 overflow-y-auto overflow-x-hidden" >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                {/* <h2 className="font-satoshi text-2xl font-semibold">Manning Sheet {'>'} {line}</h2> */}
                                <Breadcrumb />
                                <h6 className="font-satoshi text-base font-normal">
                                    {line} Manning Sheet for the {days}-Day Operational Plan
                                </h6>
                            </div>

                            {/* Download Button */}
                            <div className="flex gap-2">
                                <div className="date-filter-container">
                                    <DatePicker
                                        selected={selectedDate}
                                        onChange={handleDateChange}
                                        dateFormat="dd/MM/yyyy"
                                        className="date-filter-input"
                                        placeholderText="Filter by date"
                                        isClearable
                                        // showMonthDropdown
                                        // showYearDropdown
                                        dropdownMode="select"
                                        popperPlacement="bottom-start"
                                        popperClassName="date-filter-popper"
                                        minDate={new Date()} // Disable dates before today
                                        maxDate={new Date(new Date().setDate(new Date().getDate() + 60))} // Disable dates after 60 days from today
                                        customInput={
                                            <Button variant="outline-primary" className="date-filter-btn">
                                                {selectedDate ?
                                                    `${String(selectedDate.getDate()).padStart(2, '0')}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${selectedDate.getFullYear()}` :
                                                    "Filter by date"}
                                            </Button>
                                        }
                                    />
                                </div>
                                {/* Style Dropdown */}
                                <Dropdown>
                                    <Dropdown.Toggle variant="outline-primary" className="custom-dropdown">
                                        {styleDisplayMap[selectedStyle] || selectedStyle}
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu className="custom-dropdown-menu">
                                        {/* Download All Styles option */}
                                        <Dropdown.Item
                                            onClick={downloadAllStyles}
                                            className="text-black font-medium font-satoshi"
                                        >
                                            <div className="flex items-center">
                                                <img src={downloadIcon} alt="export" className="mr-1.5 w-5 h-5" />
                                                Download Styles
                                            </div>
                                        </Dropdown.Item>
                                        {/* Divider */}
                                        <Dropdown.Divider />
                                        <Dropdown.Item
                                            key="all"
                                            active={selectedStyle === 'all'}
                                            onClick={() => setSelectedStyle('all')}
                                        >
                                            All
                                        </Dropdown.Item>
                                        {Array.isArray(styleOptions) &&
                                            styleOptions.map((option) => (
                                                <Dropdown.Item
                                                    key={option}
                                                    active={selectedStyle === option}
                                                    onClick={() => setSelectedStyle(option)}
                                                >
                                                    {option}
                                                </Dropdown.Item>
                                            ))
                                        }
                                    </Dropdown.Menu>
                                </Dropdown>

                                <div className="relative download-dropdown-container">
                                    <Button
                                        variant="outline-primary"
                                        className={`bg-[#FFFFFF] border-[#286DB2] text-[#286DB2] flex items-center hover:bg-[#FFFFFF] hover:border-[#286DB2] hover:text-[#286DB2]`}
                                        onClick={toggleDownloadDropdown}
                                        disabled={downloading}
                                    >
                                        {downloading ? (
                                            <span className="font-satoshi text-base font-medium">Downloading...</span>
                                        ) : (
                                            <>
                                                <img src={downloadIcon} alt="export" className="mr-1.5 w-5 h-5" />
                                                <span className="font-satoshi text-base font-medium">Download</span>
                                                <FiChevronDown className="ml-1.5 w-4 h-4" />
                                            </>
                                        )}
                                    </Button>
                                    {showDownloadDropdown && !downloading && (
                                        <div className="absolute z-10 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg">
                                            <ul className="py-1">
                                                <li
                                                    className="px-4 py-2 text-sm font-medium font-satoshi text-gray-700 hover:bg-gray-100 cursor-pointer"
                                                    onClick={handleSectionDownload}
                                                >
                                                    Manning sheet
                                                </li>
                                                <li
                                                    className="px-4 py-2 text-sm font-medium font-satoshi text-gray-700 hover:bg-gray-100 cursor-pointer"
                                                    onClick={handleUnallocatedDownload}
                                                >
                                                    Unallocated list
                                                </li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tabs Navigation */}
                        {/* <div className="flex border-b mb-3">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    className={`px-4 py-3 font-satoshi font-medium text-base transition-colors duration-200 border border-gray-100 
                                    ${activeTab === tab
                                            ? 'bg-[#313D4B] text-white'
                                            : 'bg-[#FAFAFA] text-[#171717] hover:bg-[#FAFAFA]'
                                        }`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div> */}
                        <div className="mt-3 mb-3 border border-gray-200 rounded-lg bg-white">
                            <div className="flex">
                                {tabs.map((tab, index) => (
                                    <button
                                        key={tab}
                                        className={`px-2 py-2 font-satoshi font-medium text-base transition-colors duration-200 flex-1 relative 
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
                                        <span className="relative">{tab}</span>
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
                                <LoadingOverlay />
                            </div>
                        ) : (
                            <>
                                {/* General Information Card */}
                                <div className="bg-white rounded-lg">
                                    <div className='flex gap-4'>
                                        {/* <div className="bg-white rounded-lg mb-3 w-1/2">
                                            <div className="px-3 py-2 border-b border-gray-200">
                                                <h3 className="font-satoshi text-lg font-bold">General Information</h3>
                                            </div>
                                            <div className="flex justify-between gap-4 px-3 py-2 w-full"> */}
                                        {/* Section */}
                                        {/* <div className="space-y-2">
                                                    <p className="font-satoshi text-sm font-medium text-[#171717]/[0.6]">Section</p>
                                                    <p className="font-satoshi text-base font-medium text-[#171717]">{activeTab}</p>
                                                </div> */}

                                        {/* Buyers */}
                                        {/* <div className="space-y-2">
                                                    <p className="font-satoshi text-sm font-medium text-[#171717]/[0.6]">Buyer</p>
                                                    <p className="font-satoshi text-base font-medium">
                                                        {manningData?.generalInfo?.buyers ?? '-'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div> */}


                                        {/* Staffing Cards */}
                                        {/* <div className="grid grid-cols-3 gap-6 mb-3 w-1/2"> */}
                                        {/* Machinist */}
                                        {/* <div className="bg-white rounded-lg mb-3 w-1/2">
                                            <div className="px-3 py-2 border-b border-gray-200">
                                                <h3 className="font-satoshi text-lg font-bold">Total Machinist</h3>
                                            </div>
                                            <div className="flex justify-between gap-4 px-3 py-2 w-full">
                                                <div className="space-y-2">
                                                    <p className="font-satoshi text-sm font-medium text-[#171717]/[0.6]">Required</p>
                                                    <p className="font-satoshi text-3xl font-bold">{manningData?.Machinist || 0}</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="font-satoshi text-sm font-medium text-[#171717]/[0.6]">Actual</p>
                                                    <p className={`font-satoshi text-3xl font-bold ${(manningData?.Actual_Machinist || 0) < (manningData?.Machinist || 0) ? 'text-red-500' : 'text-black'
                                                        }`}>
                                                        {manningData?.Actual_Machinist || 0}
                                                    </p>
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="font-satoshi text-sm font-medium text-[#171717]/[0.6]">Target Quantity</p>
                                                    <p className="font-satoshi text-3xl font-bold text-black">
                                                        {manningData?.Target_Quantity || 0}
                                                    </p>
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="font-satoshi text-sm font-medium text-[#171717]/[0.6]">Predicted Quantity</p>
                                                    <p className="font-satoshi text-3xl font-bold text-black">
                                                        {manningData?.Planned_Quantity || 0}
                                                    </p>
                                                </div>
                                            </div>
                                        </div> */}
                                        <div className="grid grid-cols-4 gap-3 w-full mb-3">
                                            {/* Required Machinist */}
                                            <div className="bg-white rounded-lg border border-gray-200">
                                                <div className="px-3 py-2">
                                                    <h3 className="font-satoshi text-sm font-semibold">Required Machinist</h3>
                                                </div>
                                                <div className="px-3 py-2">
                                                    <p className="font-satoshi text-3xl font-normal text-[#030712]">{manningData?.Machinist || 0}</p>
                                                    <div className="flex items-center mt-2">
                                                        <div className="flex items-center bg-green-50 rounded px-2 py-1">
                                                            <img src={TrendUp} alt="trend up" className="w-4 h-4 mr-1" />
                                                            <span className="font-satoshi text-sm font-medium text-green-600">12%</span>
                                                        </div>
                                                        <span className="font-satoshi text-sm font-medium text-gray-500 ml-1">vs last month</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actual Machinist */}
                                            <div className="bg-white rounded-lg border border-gray-200">
                                                <div className="px-3 py-2">
                                                    <h3 className="font-satoshi text-sm font-semibold">Actual Machinist</h3>
                                                </div>
                                                <div className="px-3 py-2">
                                                    <p className={`font-satoshi text-3xl font-normal text-[#030712]
                                                        }`}>
                                                        {manningData?.Actual_Machinist || 0}
                                                    </p>
                                                    <div className="flex items-center mt-2">
                                                        <div className="flex items-center bg-green-50 rounded px-2 py-1">
                                                            <img src={TrendUp} alt="trend up" className="w-4 h-4 mr-1" />
                                                            <span className="font-satoshi text-sm font-medium text-green-600">10</span>
                                                        </div>
                                                        <span className="font-satoshi text-sm font-medium text-gray-500 ml-1">vs yesterday</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Target Quantity */}
                                            <div className="bg-white rounded-lg border border-gray-200">
                                                <div className="px-3 py-2">
                                                    <h3 className="font-satoshi text-sm font-semibold">Target Quantity</h3>
                                                </div>
                                                <div className="px-3 py-2">
                                                    <p className="font-satoshi text-3xl font-normal text-[#030712]">
                                                        {manningData?.Target_Quantity || 0}
                                                    </p>
                                                    <div className="flex items-center mt-2">
                                                        <div className="flex items-center bg-red-50 rounded px-2 py-1">
                                                            <img src={TrendDown} alt="trend down" className="w-4 h-4 mr-1" />
                                                            <span className="font-satoshi text-sm font-medium text-red-600">14</span>
                                                        </div>
                                                        <span className="font-satoshi text-sm font-medium text-gray-500 ml-1">vs yesterday</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Predicted Quantity */}
                                            <div className="bg-white rounded-lg border border-gray-200">
                                                <div className="px-3 py-2">
                                                    <h3 className="font-satoshi text-sm font-semibold">Predicted Quantity</h3>
                                                </div>
                                                <div className="px-3 py-2">
                                                    <p className="font-satoshi text-3xl font-normal text-[#030712]">
                                                        {manningData?.Planned_Quantity || 0}
                                                    </p>
                                                    <div className="flex items-center mt-2">
                                                        <div className="flex items-center bg-red-50 rounded px-2 py-1">
                                                            <img src={TrendDown} alt="trend down" className="w-4 h-4 mr-1" />
                                                            <span className="font-satoshi text-sm font-medium text-red-600">14</span>
                                                        </div>
                                                        <span className="font-satoshi text-sm font-medium text-gray-500 ml-1">vs yesterday</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Non Machinist */}
                                        {/* <div className="bg-white rounded-lg">
                                            <div className="px-3 py-2 border-b border-gray-200">
                                                <h3 className="font-satoshi text-lg font-bold">Non Machinist</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 px-3 py-2">
                                                <div>
                                                    <p className="font-satoshi text-sm font-medium text-[#171717]/[0.6]">Required</p>
                                                    <p className="font-satoshi text-3xl font-bold">{manningData?.["Non Machinist"] || 0}</p>
                                                </div>
                                                <div>
                                                    <p className="font-satoshi text-sm font-medium text-[#171717]/[0.6]">Actual</p>
                                                    <p className={`font-satoshi text-3xl font-bold ${(manningData?.["Actual_Non Machinist"] || 0) < (manningData?.["Non Machinist"] || 0) ? 'text-red-500' : 'text-black'
                                                        }`}>
                                                        {manningData?.["Actual_Non Machinist"] || 0}
                                                    </p>
                                                </div>
                                            </div>
                                        </div> */}

                                        {/* Total Machinist */}
                                        {/* <div className="bg-white rounded-lg">
                                            <div className="px-3 py-2 border-b border-gray-200">
                                                <h3 className="font-satoshi text-lg font-bold">Total</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 px-3 py-2">
                                                <div>
                                                    <p className="font-satoshi text-sm font-medium text-[#171717]/[0.6]">Required</p>
                                                    <p className="font-satoshi text-3xl font-bold">{manningData?.["Total Machinist"] || 0}</p>
                                                </div>
                                                <div>
                                                    <p className="font-satoshi text-sm font-medium text-[#171717]/[0.6]">Actual</p>
                                                    <p className={`font-satoshi text-3xl font-bold ${(manningData?.["Actual_Total Machinist"] || 0) < (manningData?.["Total Machinist"] || 0) ? 'text-red-500' : 'text-black'
                                                        }`}>
                                                        {manningData?.["Actual_Total Machinist"] || 0}
                                                    </p>
                                                </div>
                                            </div>
                                        </div> */}
                                        {/* </div> */}

                                    </div>

                                    {/* Metrics Card */}
                                    <div className="bg-white rounded-lg mb-3 w-full border border-gray-200">
                                        <div className="flex px-3 py-2 items-center border-b border-gray-200">
                                            <img src={MachinistIcon} alt="list" className="w-4 h-4 mr-2" />
                                            <h3 className="font-satoshi text-lg font-bold">Machinists</h3>
                                        </div>
                                        <div className="flex justify-between items-center px-3 py-2">
                                            {/* SNLS */}
                                            <div className="space-y-2">
                                                <p className="font-satoshi text-sm font-medium text-[#171717]/[0.6]">SNLS</p>
                                                <p className="font-satoshi text-base font-medium">{manningData?.SNLS ?? '-'}</p>
                                            </div>

                                            {/* Overlock */}
                                            <div className="space-y-2">
                                                <p className="font-satoshi text-sm font-medium text-[#171717]/[0.6]">Overlock</p>
                                                <p className="font-satoshi text-base font-medium">{manningData?.Overlock ?? '-'}</p>
                                            </div>

                                            {/* DNCS */}
                                            <div className="space-y-2">
                                                <p className="font-satoshi text-sm font-medium text-[#171717]/[0.6]">DNCS</p>
                                                <p className="font-satoshi text-base font-medium">{manningData?.DNCS ?? '-'}</p>
                                            </div>

                                            {/* B/H */}
                                            <div className="space-y-2">
                                                <p className="font-satoshi text-sm font-medium text-[#171717]/[0.6]">B/H</p>
                                                <p className="font-satoshi text-base font-medium">{manningData?.["B/H"] ?? '-'}</p>
                                            </div>

                                            {/* Wrapping */}
                                            <div className="space-y-2">
                                                <p className="font-satoshi text-sm font-medium text-[#171717]/[0.6]">Wrapping</p>
                                                <p className="font-satoshi text-base font-medium">{manningData?.Wrapping ?? '-'}</p>
                                            </div>

                                            {/* SNES */}
                                            <div className="space-y-2">
                                                <p className="font-satoshi text-sm font-medium text-[#171717]/[0.6]">SNES</p>
                                                <p className="font-satoshi text-base font-medium">{manningData?.SNES || '-'}</p>
                                            </div>

                                            {/* DNLS */}
                                            <div className="space-y-2">
                                                <p className="font-satoshi text-sm font-medium text-[#171717]/[0.6]">DNLS</p>
                                                <p className="font-satoshi text-base font-medium">{manningData?.DNLS || '-'}</p>
                                            </div>

                                            {/* Bartack */}
                                            <div className="space-y-2">
                                                <p className="font-satoshi text-sm font-medium text-[#171717]/[0.6]">Bartack</p>
                                                <p className="font-satoshi text-base font-medium">{manningData?.Bartack ?? '-'}</p>
                                            </div>

                                            {/* B/T */}
                                            <div className="space-y-2">
                                                <p className="font-satoshi text-sm font-medium text-[#171717]/[0.6]">B/T</p>
                                                <p className="font-satoshi text-base font-medium">{manningData?.["B/T"] ?? '-'}</p>
                                            </div>

                                            {/* Ironers */}
                                            <div className="space-y-2">
                                                <p className="font-satoshi text-sm font-medium text-[#171717]/[0.6]">Ironers</p>
                                                <p className="font-satoshi text-base font-medium">{manningData?.Ironers ?? '-'}</p>
                                            </div>

                                            <div className="space-y-2">
                                                {manningData?.Others != null && !isNaN(Number(manningData.Others)) && (
                                                    <div className="space-y-2">
                                                        <p className="font-satoshi text-sm font-medium text-[#171717]/[0.6]">Others</p>
                                                        <p className="font-satoshi text-base font-medium">
                                                            {Number(manningData.Others) % 1 === 0
                                                                ? Number(manningData.Others)
                                                                : Number(manningData.Others).toFixed(1)}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    </div>



                                    {/* Operations Table */}
                                    <div className="bg-white rounded-lg overflow-x-auto" style={{ width: '100%', overflowX: 'auto' }}>
                                        <div className="h-screen w-full ag-theme-alpine custom-ag-theme">
                                            <AgGridReact
                                                // rowData={manningData?.operations || []}
                                                rowData={groupedData}
                                                columnDefs={columnDefs}
                                                defaultColDef={defaultColDef}
                                                animateRows={false}
                                                pagination={true}
                                                paginationPageSize={100}
                                                rowHeight={90}
                                                headerHeight={52}
                                                domLayout="normal"
                                                suppressContextMenu={true}
                                                loadingOverlayComponent={LoadingOverlay}
                                                noRowsOverlayComponent={NoRowsOverlay}
                                                loading={loading}
                                                overlayNoRowsTemplate="No data available"
                                                groupHideOpenParents={true}
                                                suppressCellFocus={true}
                                                suppressColumnMoveAnimation={true}
                                                suppressRowTransform={true} // Prevent row position changes
                                                maintainColumnOrder={true}
                                                ensureDomOrder={true} // Ensure DOM order matches data order
                                                suppressSorting={true} // Disable all sorting
                                                suppressColumnVirtualisation={true} // Prevent column virtualization issues
                                                suppressRowVirtualisation={true} // Prevent row virtualization issues
                                                getRowStyle={params => {
                                                    const hasValidEmployeeId = params.data.Employee_ID &&
                                                        params.data.Employee_ID !== '-' &&
                                                        params.data.Employee_ID !== 0 &&
                                                        String(params.data.Employee_ID) !== '0' &&
                                                        String(params.data.Employee_ID).toLowerCase() !== 'nan' &&
                                                        String(params.data.Employee_ID).toLowerCase() !== 'undefined' &&
                                                        String(params.data.Employee_ID).toLowerCase() !== 'null' &&
                                                        String(params.data.Employee_ID).toLowerCase() !== 'invalid number';

                                                    const hasValidOperatorName = params.data.operatorName &&
                                                        params.data.operatorName !== '-';

                                                    // Apply pink background for unallocated operators
                                                    const isUnallocated = !hasValidEmployeeId && !hasValidOperatorName;

                                                    if (params.data.rowType === 'parent') {
                                                        return {
                                                            backgroundColor: '#e2e8f0',
                                                            fontWeight: 'bold'
                                                        };
                                                    }
                                                    if (params.data.rowType === 'child') {
                                                        // For child rows, check if unallocated
                                                        if (isUnallocated) {
                                                            return {
                                                                backgroundColor: '#EF21291A'
                                                            };
                                                        }
                                                        return {
                                                            backgroundColor: '#f8fafc'
                                                        };
                                                    }

                                                    // For single/regular rows
                                                    if (isUnallocated) {
                                                        return { backgroundColor: '#EF21291A' };
                                                    }
                                                    // if (!params.data.operatorName || params.data.operatorName === '-') {
                                                    //     return { backgroundColor: '#EF21291A' };
                                                    // }
                                                    // Check if operator is not allocated

                                                    return null;
                                                }}
                                                getRowId={getRowId}
                                            />
                                        </div>
                                        {/* Submit button section */}
                                        {pendingAssignments.size > 0 && (
                                            <div className=" flex items-center justify-end px-4 py-3 bg-gray-50 border-t border-gray-200">
                                                <div className="flex items-center space-x-4 text-sm">
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={handleClearAll}
                                                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm font-medium"
                                                            disabled={submitting}
                                                            type="button"
                                                        >
                                                            Clear All
                                                        </button>
                                                        <button
                                                            onClick={submitAllAssignments}
                                                            disabled={getCompleteAssignmentsCount() === 0 || submitting}
                                                            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            {submitting ? 'Submitting...' : `Submit`}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <Footer />
                            </>
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
                                delay={toastType === 'error' ? 5000 : 3000} // Longer delay for errors
                                autohide
                                bg={toastType === 'success' ? 'success' : toastType === 'error' ? 'danger' : 'warning'}
                                className="mb-3"
                            >
                                <Toast.Header closeButton={true}>
                                    <span className="me-2">
                                        {toastType === 'success' ? '✓' : toastType === 'error' ? '✗' : '⚠'}
                                    </span>
                                    <strong className="me-auto text-dark">
                                        {toastType === 'success' ? 'Success' : toastType === 'error' ? 'Error' : 'Warning'}
                                    </strong>
                                </Toast.Header>
                                <Toast.Body className={toastType === 'warning' ? 'text-dark' : 'text-white'}>
                                    {toastMessage}
                                </Toast.Body>
                            </Toast>
                        </div>
                    </main>
                </div >

            </div >
        </PlanningSheetDndProvider>
    )
}

export default PlanningSheet;