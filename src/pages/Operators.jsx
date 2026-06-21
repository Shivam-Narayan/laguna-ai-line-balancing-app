import React, { useState, useMemo, useEffect } from 'react';
import Header from '../components/shared/Header';
import Sidenav from '../components/shared/Sidenav';
import API from '../api/api';
import { Form, Dropdown, Toast, Spinner } from 'react-bootstrap';
import { IoClose } from "react-icons/io5";
import { FiSearch } from "react-icons/fi";
import Footer from '../components/shared/Footer';

import exportIcon from '../assets/Export new.svg'; 
import GreenCheckCircle from '../assets/CheckCircle.svg';
import RedCrossCircle from '../assets/simple-line-icons_close.svg';


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

const Operators = () => {
    const [activeTab, setActiveTab] = useState('All');
    const [rowData, setRowData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [originalData, setOriginalData] = useState([]);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [emails, setEmails] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [emailError, setEmailError] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Function to convert string to pascal case
    const toPascalCase = (str) => {
        if (!str) return '';
        return str.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const columnDefs = [
        {
            field: 'emp_code',
            headerName: 'Employee Code',
            minWidth: 160,
            flex: 1,
            headerClass: 'ag-header-cell-label',
            valueFormatter: params => toPascalCase(params.value?.toString())
        },
        {
            field: 'emp_name',
            headerName: 'Employee Name',
            minWidth: 180,
            flex: 1,
            headerClass: 'ag-header-cell-label',
            valueFormatter: params => toPascalCase(params.value)
        },
        {
            field: 'line',
            headerName: 'Line',
            minWidth: 120,
            flex: 1,
            headerClass: 'ag-header-cell-label',
            valueFormatter: params => toPascalCase(params.value)
        },
        {
            field: 'section',
            headerName: 'Section',
            minWidth: 130,
            flex: 1,
            headerClass: 'ag-header-cell-label',
            valueFormatter: params => toPascalCase(params.value)
        },
        {
            field: 'designation',
            headerName: 'Designation',
            minWidth: 160,
            flex: 1,
            headerClass: 'ag-header-cell-label',
            valueFormatter: params => toPascalCase(params.value)
        },
        {
            field: 'primary',
            headerName: 'Primary Skill',
            minWidth: 220,
            flex: 2,
            headerClass: 'ag-header-cell-label',
            cellStyle: { display: 'flex', alignItems: 'center', paddingLeft: '10px' },
            cellRenderer: params => {
                const displaySkill = toPascalCase(params.value);
                
                // Define color sequence that repeats every 4 rows
                const colorSequence = [
                { bg: '#236DFF1A', text: '#4B5563', border: '#81D4FA' }, 
                { bg: '#D26A211A', text: '#4B5563', border: '#FFCC80' },   
                { bg: '#A823FF1A', text: '#4B5563', border: '#CE93D8' },
                { bg: '#C60B6F1A', text: '#4B5563', border: '#F48FB1' }  
                ];
                
                // Use row index to determine color (repeats every 4 rows)
                const colorIndex = params.node.rowIndex % colorSequence.length;
                const colors = colorSequence[colorIndex];
                
                return (
                <div 
                    className="flex items-center px-3 py-1.5 border rounded-full shadow-sm"
                    style={{
                    backgroundColor: colors.bg,
                    color: colors.text,
                    borderColor: colors.border
                    }}
                >
                    <span className="text-sm font-medium">
                    {displaySkill}
                    </span>
                </div>
                );
            }
        },
        {
            field: 'secondary',
            headerName: 'Secondary Skill',
            minWidth: 200,
            flex: 2,
            headerClass: 'ag-header-cell-label',
            valueFormatter: params => toPascalCase(params.value)
        },
        {
            field: 'status',
            headerName: 'Status',
            minWidth: 120,
            flex: 1,
            headerClass: 'ag-header-cell-label',
            cellStyle: { display: 'flex', alignItems: 'center', paddingLeft: '10px' },
            cellRenderer: params => {
                const isActive = params.value === 'active';
                const displayStatus = toPascalCase(params.value);
                const dotImage = isActive ? GreenCheckCircle : RedCrossCircle;

                if (isActive) {
                    return (
                        <div className="inline-flex items-center px-3 py-1.5 rounded-full border" style={{ backgroundColor: '#ECFDF5', borderColor: '#D1FAE5' }}>
                            <img
                                src={dotImage}
                                alt={displayStatus}
                                className="w-4 h-4 mr-2"
                            />
                            <span className="font-medium text-sm text-green-500">
                                {displayStatus}
                            </span>
                        </div>
                    );
                } else {
                    return (
                        <div className="inline-flex items-center px-3 py-1.5 rounded-full border" style={{ backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' }}>
                            <img
                                src={dotImage}
                                alt={displayStatus}
                                className="w-4 h-4 mr-2"
                            />
                            <span className="font-medium text-sm text-red-500">
                                {displayStatus}
                            </span>
                        </div>
                    );
                }
            }
        },
    ]

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            try {
                const line = activeTab === 'All' ? 'All' : activeTab;
                const response = await API.getOperatorsData(line);

                if (response?.data?.data && response.data.data.length > 0) {
                    // setOriginalData(response.data.data);
                    // setRowData(response.data.data);
                    const sanitizedData = response.data.data.map(row => {
                        return Object.fromEntries(
                            Object.entries(row).map(([key, value]) => [
                                key,
                                (value === null ||
                                    value === undefined ||
                                    value === "" ||
                                    value === "NaN" ||
                                    value === "nan" ||   // Handling "nan" as a string
                                    (typeof value === "number" && isNaN(value)))
                                    ? '-'
                                    : value
                            ])
                        );
                    });

                    setOriginalData(sanitizedData);
                    setRowData(sanitizedData);
                } else {
                    setOriginalData([]);
                    setRowData([]);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setOriginalData([]);
                setRowData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeTab]);


    const handleExcelExport = async () => {
        try {
            const response = await API.exportOperatorsData(activeTab);

            const blob = new Blob([response.data], {
                type: 'text/csv'
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `OperatorsData_${activeTab}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            setToastMessage('Excel file downloaded successfully');
            setShowToast(true);
        } catch (error) {
            console.error('Error exporting data:', error);
            showNotification('Failed to download Excel file', 'error');
        }
    };

    // const handleOpenEmailModal = () => {
    //     setEmails(''); // Clear email field
    //     setEmailError(''); // Clear any previous errors
    //     setShowEmailModal(true);
    // };

    // const handleCloseEmailModal = () => {
    //     setEmails([]);        // Clear emails array
    //     setInputValue('');    // Clear input field
    //     setEmailError('');    // Clear error message
    //     setShowEmailModal(false);
    // };

    // const validateEmail = (value) => {
    //     // Check for leading/trailing spaces
    //     if (value.trim() !== value) {
    //         setEmailError('Email cannot have leading or trailing spaces.');
    //         return false;
    //     }

    //     // Remove leading and trailing spaces
    //     const trimmedEmail = value.trim();

    //     // 1. Mandatory Field Check
    //     if (!trimmedEmail) {
    //         setEmailError('Email address is required.');
    //         return false;
    //     }

    //     // 7. No Whitespace Check
    //     if (/\s/.test(trimmedEmail)) {
    //         setEmailError('Email cannot contain spaces.');
    //         return false;
    //     }

    //     // 4. Character Limits Check
    //     if (trimmedEmail.length < 5 || trimmedEmail.length > 64) {
    //         setEmailError('Email must be between 5 and 64 characters.');
    //         return false;
    //     }

    //     // 5. Allowed Characters & 2. Format Validation
    //     const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    //     if (!emailRegex.test(trimmedEmail)) {
    //         // Check if the issue is with allowed characters
    //         if (!/^[a-zA-Z0-9._@-]+$/.test(trimmedEmail)) {
    //             setEmailError('Email can only contain letters, numbers, and valid symbols like \'.\', \'-\', \'_\', and \'@\'.');
    //             return false;
    //         }
    //         // If the characters are valid but format is wrong
    //         setEmailError('Please enter a valid email address.');
    //         return false;
    //     }

    //     // 3. Domain Validation
    //     const domain = trimmedEmail.split('@')[1];
    //     const validDomains = ['com', 'org', 'edu', 'gov', 'net', 'io', 'co', 'in'];
    //     const topLevelDomain = domain.split('.').pop().toLowerCase();
    //     if (!validDomains.includes(topLevelDomain)) {
    //         setEmailError('Invalid email domain.');
    //         return false;
    //     }

    //     setEmailError('');
    //     return true;
    // };

    // const handleEmailChange = (e) => {
    //     // setInputValue(e.target.value);
    //     const value = e.target.value.trim();
    //     setInputValue(e.target.value);

    //     if (value && !validateEmail(value)) {
    //         setEmailError('Invalid email format');
    //     } else {
    //         setEmailError('');
    //     }
    // };

    // const handleKeyDown = (e) => {
    //     if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
    //         e.preventDefault();
    //         const trimmedEmail = inputValue.trim();
    //         if (trimmedEmail && validateEmail(trimmedEmail)) {
    //             setEmails([...emails, trimmedEmail]);  // Add new email to the array
    //             setInputValue(''); // Reset input
    //             setEmailError('');
    //         } else {
    //             setEmailError('Invalid email format');
    //         }
    //     }
    // };

    // const removeEmail = (index) => {
    //     const updatedEmails = emails.filter((_, i) => i !== index);
    //     setEmails(updatedEmails);

    //     // Ensure the button is disabled when no emails are present
    //     if (updatedEmails.length === 0) {
    //         setEmailError(''); // Clear error
    //     }
    // };

    // const handleEmailSubmit = async (e) => {
    //     e.preventDefault();
    //     // if (!validateEmail(email)) {
    //     //     return;
    //     // }
    //     if (emails.length === 0) {
    //         setEmailError('Please enter at least one valid email');
    //         return;
    //     }

    //     try {
    //         await API.exportOperatorsDataEmail(activeTab, emails.join(','));
    //         // setShowEmailModal(false);
    //         setShowSuccessModal(true);
    //         // setEmail('');
    //         handleCloseEmailModal();
    //         setTimeout(() => {
    //             setShowSuccessModal(false);
    //         }, 3000);
    //     } catch (error) {
    //         console.error('Error sending email:', error);
    //         setToastMessage('Failed to send email. Please try again later.');
    //         setShowToast(true);
    //         handleCloseEmailModal();
    //     }
    // };

    const defaultColDef = useMemo(() => ({
        sortable: true,
        filter: false,
        resizable: false,
    }), []);


    // Tabs data
    const tabs = [
        'All', 'Line 1', 'Line 2', 'Line 3', 'Line 4',
        'Line 5', 'Line 6', 'Line 7', 'Line 8', 'Line 9', 'Line 10'
    ];

    const getRowClass = params => {
        return params.node.rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50';
    };

    // Handle search functionality
    const handleSearch = (value) => {
        setSearchText(value);

        if (!value.trim()) {
            setRowData(originalData);
            return;
        }

        const searchValue = value.toLowerCase();
        const filteredData = originalData.filter(row => {
            return (
                String(row.emp_code).toLowerCase().includes(searchValue) ||
                String(row.emp_name).toLowerCase().includes(searchValue) ||
                String(row.line).toLowerCase().includes(searchValue) ||
                String(row.section).toLowerCase().includes(searchValue) ||
                String(row.designation).toLowerCase().includes(searchValue) ||
                String(row.primary).toLowerCase().includes(searchValue) ||
                String(row.secondary).toLowerCase().includes(searchValue) ||
                String(row.status).toLowerCase().includes(searchValue)
            );
        });

        setRowData(filteredData);
    };

    const hasValidData = () => {
        return rowData && rowData.length > 0;
    };

    const inputClasses = `w-full px-3 py-2 border-2 rounded-md 
    focus:ring-1 focus:ring-[#171717] focus:border-transparent  
    disabled:bg-gray-50 disabled:cursor-not-allowed
    ${emailError ? 'border-red-100 focus:ring-red-500' : ''}`;

    return (
        <div className="h-screen w-screen flex overflow-hidden">
            <Sidenav />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 px-4 py-2 overflow-y-auto overflow-x-hidden">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <h2 className="font-satoshi text-2xl font-semibold">Operators</h2>
                        </div>
                        <div className="flex space-x-2">
                            <div className="ml-auto">
                                <button
                                    onClick={handleExcelExport}
                                    disabled={!hasValidData()}
                                    className={`custom-dropdown export-dropdown px-6 bg-[#FFFFFF] border border-[#286DB2] rounded-md flex items-center
                                            ${!hasValidData()
                                            ? 'opacity-50 cursor-not-allowed text-gray-500 border-gray-300'
                                            : 'text-[#286DB2] hover:bg-[#FFFFFF] hover:border-[#286DB2] hover:text-[#286DB2]'
                                        }`}
                                >
                                    <div className="flex items-center">
                                        <img
                                            src={exportIcon}
                                            alt="export"
                                            className={`mr-1.5 w-5 h-5 ${!hasValidData() ? 'opacity-50' : ''}`}
                                        />
                                        <span className="font-satoshi text-base font-medium">
                                            Export
                                        </span>
                                    </div>
                                </button>
                            </div>
                        </div>


                        {/* <div className="flex space-x-2 ">
                            <div className="ml-auto">
                                <Dropdown>
                                    <Dropdown.Toggle
                                        variant="outline-primary"
                                        className={`custom-dropdown export-dropdown px-6 bg-[#FFFFFF] border-[#286DB2] flex items-center
                                            ${!hasValidData()
                                                ? 'opacity-50 cursor-not-allowed text-gray-500 border-gray-300'
                                                : 'text-[#286DB2] hover:bg-[#FFFFFF] hover:border-[#286DB2] hover:text-[#286DB2]'
                                            }`}
                                        disabled={!hasValidData()}
                                    >
                                        <div className="flex items-center">
                                            <img
                                                src={exportIcon}
                                                alt="export"
                                                className={`mr-1.5 w-5 h-5 ${!hasValidData() ? 'opacity-50' : ''}`}
                                            />
                                            <span className="font-satoshi text-base font-medium">
                                                Export
                                            </span>
                                        </div>
                                    </Dropdown.Toggle>

                                    <Dropdown.Menu>
                                        <Dropdown.Item onClick={handleExcelExport}
                                            disabled={!hasValidData()}>
                                            Export as excel
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={handleOpenEmailModal}
                                            disabled={!hasValidData()}>
                                            Share via Email
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </div>
                        </div> */}
                    </div>

                    {/* Table Container */}
                    <div className="rounded-lg border border-gray-200 bg-white">
                        {/* Table Header and Search */}
                        <div className="py-2 px-3 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h3 className="font-satoshi text-lg font-medium">Operators Data</h3>
                                <div className="relative w-96">
                                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                                        value={searchText}
                                        onChange={(e) => handleSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tabs Navigation */}
                        {/* <div className="flex bg-[#FAFAFA]">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    className={`px-4 py-3 font-satoshi font-medium text-base transition-colors duration-200 border-r border-gray-200 
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

                        {/* AG Grid Table */}
                        <div className="bg-white border border-gray-200 rounded-b-lg">
                            <div className="h-[calc(100vh-200px)] w-full ag-theme-alpine custom-ag-theme">
                                <AgGridReact
                                    columnDefs={columnDefs}
                                    rowData={rowData}
                                    defaultColDef={defaultColDef}
                                    animateRows={true}
                                    pagination={true}
                                    paginationPageSize={20}
                                    domLayout="normal"
                                    rowHeight={48}
                                    headerHeight={48}
                                    suppressCellFocus={true}
                                    getRowClass={getRowClass}
                                    loadingOverlayComponent={LoadingOverlay}
                                    noRowsOverlayComponent={NoRowsOverlay}
                                    loading={loading}
                                    overlayNoRowsTemplate="No data available"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Email Share Modal */}
                    {/* {showEmailModal && (
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
                    )} */}

                    {/* Success Modal */}
                    {/* {showSuccessModal && (
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
                    )} */}

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
                            <Toast.Body className="text-white">
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

export default Operators;