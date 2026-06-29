import React, { useState, useMemo, useEffect } from 'react';
import Header from '../components/shared/Header';
import Sidenav from '../components/shared/Sidenav';
import API from '../api/api';
import { Form, Dropdown, Toast, Spinner, Button } from 'react-bootstrap';
import Footer from '../components/shared/Footer';



const ApplicationTesting = () => {
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const [uploadingStates, setUploadingStates] = useState({
        absenteeism: false,
        attendance: false,
        activeEmployees: false,
        skillMatrix: false,
        productionPlan: false,
        styleOB: false,
        holidayCalendar: false
    });

    // Download template function
    const downloadTemplate = (filename) => {
        const link = document.createElement('a');
        link.href = `/public/${filename}`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Show toast notification
    const showNotification = (message, type = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
    };

    // Generic upload handler
    const handleFileUpload = async (file, uploadType, apiFunction, extraData = {}) => {
        if (!file) {
            showNotification('Please select a file to upload.', 'error');
            return;
        }

        // Update uploading state
        setUploadingStates(prev => ({ ...prev, [uploadType]: true }));

        try {
            const formData = new FormData();
            formData.append('file', file);
            
            // Append extra data
            Object.keys(extraData).forEach(key => {
                formData.append(key, extraData[key]);
            });

            const response = await apiFunction(formData);
            showNotification(`${uploadType} file uploaded successfully!`, 'success');
            
            // Clear the file input
            const fileInput = document.getElementById(`${uploadType}Upload`);
            if (fileInput) fileInput.value = '';
            
        } catch (error) {
            console.error(`Upload error for ${uploadType}:`, error);
            const errorMessage = error.response?.data?.message || `Failed to upload ${uploadType} file. Please try again.`;
            showNotification(errorMessage, 'error');
        } finally {
            setUploadingStates(prev => ({ ...prev, [uploadType]: false }));
        }
    };

    // Individual upload handlers
    const handleAbsenteeismUpload = (event) => {
        const file = event.target.files[0];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const currentDate = new Date();
        const month = monthNames[currentDate.getMonth()];
        const year = currentDate.getFullYear();
        handleFileUpload(file, 'absenteeism', API.uploadAbsenteeism, { month, year });
    };

    const handleAttendanceUpload = (event) => {
        const file = event.target.files[0];
        handleFileUpload(file, 'attendance', API.uploadAttendanceMaster);
    };

    const handleActiveEmployeesUpload = (event) => {
        const file = event.target.files[0];
        handleFileUpload(file, 'activeEmployees', API.uploadActiveEmployees);
    };

    const handleSkillMatrixUpload = (event) => {
        const file = event.target.files[0];
        handleFileUpload(file, 'skillMatrix', API.uploadEMPFact);
    };

    const handleProductionPlanUpload = (event) => {
        const file = event.target.files[0];
        handleFileUpload(file, 'productionPlan', API.uploadLoadingPlanData);
    };

    const handleStyleOBUpload = (event) => {
        const file = event.target.files[0];
        handleFileUpload(file, 'styleOB', API.uploadStyleOB);
    };

    const handleHolidayCalendarUpload = (event) => {
        const file = event.target.files[0];
        handleFileUpload(file, 'holidayCalendar', API.uploadLocalHolidayCalendar);
    };


    return (
        <div className="h-screen w-screen flex overflow-hidden">
            <Sidenav />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 px-4 py-2 overflow-y-auto overflow-x-hidden">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <h2 className="font-satoshi text-2xl font-semibold">Application Testing</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {/* Heading 1 - Absenteeism Data */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                            <div className="flex items-center justify-center w-12 h-12 bg-red-50 rounded-lg mb-4">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                            </div>
                            <h3 className="font-satoshi text-lg font-semibold text-gray-900 mb-2">Absenteeism Data</h3>
                            <p className="font-satoshi text-sm text-gray-600 mb-4">Track and manage employee absenteeism patterns and trends</p>

                            <div className="flex flex-col gap-2">
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="absenteeismUpload"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleAbsenteeismUpload}
                                        disabled={uploadingStates.absenteeism}
                                    />
                                    <Button 
                                        className="w-full py-2 bg-[#4F46E5] hover:bg-[#4F46E5] text-white font-satoshi font-medium rounded-md border-0 text-sm"
                                        disabled={uploadingStates.absenteeism}
                                    >
                                        {uploadingStates.absenteeism ? (
                                            <>
                                                <Spinner
                                                    as="span"
                                                    animation="border"
                                                    size="sm"
                                                    role="status"
                                                    aria-hidden="true"
                                                    className="me-2"
                                                />
                                                Uploading...
                                            </>
                                        ) : (
                                            'Upload File'
                                        )}
                                    </Button>
                                </div>
                                <Button
                                    variant="outline-primary"
                                    className="w-full py-2 border-[#4F46E5] text-[#4F46E5] hover:bg-blue-50 font-satoshi font-medium rounded-md text-sm"
                                    onClick={() => downloadTemplate('absenteeism_data.csv')}
                                >
                                    Download Template
                                </Button>
                            </div>
                        </div>

                        {/* Heading 2 - Daily Attendance Data */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                            <div className="flex items-center justify-center w-12 h-12 bg-green-50 rounded-lg mb-4">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="font-satoshi text-lg font-semibold text-gray-900 mb-2">Daily Attendance Data</h3>
                            <p className="font-satoshi text-sm text-gray-600 mb-4">Monitor daily employee attendance and working hours</p>

                            <div className="flex flex-col gap-2">
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="attendanceUpload"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleAttendanceUpload}
                                        disabled={uploadingStates.attendance}
                                    />
                                    <Button 
                                        className="w-full py-2 bg-[#4F46E5] hover:bg-[#4F46E5] text-white font-satoshi font-medium rounded-md border-0 text-sm"
                                        disabled={uploadingStates.attendance}
                                    >
                                        {uploadingStates.attendance ? (
                                            <>
                                                <Spinner
                                                    as="span"
                                                    animation="border"
                                                    size="sm"
                                                    role="status"
                                                    aria-hidden="true"
                                                    className="me-2"
                                                />
                                                Uploading...
                                            </>
                                        ) : (
                                            'Upload File'
                                        )}
                                    </Button>
                                </div>
                                <Button
                                    variant="outline-primary"
                                    className="w-full py-2 border-[#4F46E5] text-[#4F46E5] hover:bg-blue-50 font-satoshi font-medium rounded-md text-sm"
                                    onClick={() => downloadTemplate('attendance_master.csv')}
                                >
                                    Download Template
                                </Button>
                            </div>
                        </div>

                        {/* Heading 3 - Active Employees */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                            <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-lg mb-4">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="font-satoshi text-lg font-semibold text-gray-900 mb-2">Active Employees</h3>
                            <p className="font-satoshi text-sm text-gray-600 mb-4">Manage active employee roster and status information</p>

                            <div className="flex flex-col gap-2">
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="activeEmployeesUpload"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleActiveEmployeesUpload}
                                        disabled={uploadingStates.activeEmployees}
                                    />
                                    <Button 
                                        className="w-full py-2 bg-[#4F46E5] hover:bg-[#4F46E5] text-white font-satoshi font-medium rounded-md border-0 text-sm"
                                        disabled={uploadingStates.activeEmployees}
                                    >
                                        {uploadingStates.activeEmployees ? (
                                            <>
                                                <Spinner
                                                    as="span"
                                                    animation="border"
                                                    size="sm"
                                                    role="status"
                                                    aria-hidden="true"
                                                    className="me-2"
                                                />
                                                Uploading...
                                            </>
                                        ) : (
                                            'Upload File'
                                        )}
                                    </Button>
                                </div>
                                <Button
                                    variant="outline-primary"
                                    className="w-full py-2 border-[#4F46E5] text-[#4F46E5] hover:bg-blue-50 font-satoshi font-medium rounded-md text-sm"
                                    onClick={() => downloadTemplate('active_employees.csv')}
                                >
                                    Download Template
                                </Button>
                            </div>
                        </div>

                        {/* Heading 4 - Employee Skill Matrix */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                            <div className="flex items-center justify-center w-12 h-12 bg-purple-50 rounded-lg mb-4">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <h3 className="font-satoshi text-lg font-semibold text-gray-900 mb-2">Employee Skill Matrix</h3>
                            <p className="font-satoshi text-sm text-gray-600 mb-4">Track employee skills and competency levels across departments</p>

                            <div className="flex flex-col gap-2">
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="skillMatrixUpload"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleSkillMatrixUpload}
                                        disabled={uploadingStates.skillMatrix}
                                    />
                                    <Button 
                                        className="w-full py-2 bg-[#4F46E5] hover:bg-[#4F46E5] text-white font-satoshi font-medium rounded-md border-0 text-sm"
                                        disabled={uploadingStates.skillMatrix}
                                    >
                                        {uploadingStates.skillMatrix ? (
                                            <>
                                                <Spinner
                                                    as="span"
                                                    animation="border"
                                                    size="sm"
                                                    role="status"
                                                    aria-hidden="true"
                                                    className="me-2"
                                                />
                                                Uploading...
                                            </>
                                        ) : (
                                            'Upload File'
                                        )}
                                    </Button>
                                </div>
                                <Button
                                    variant="outline-primary"
                                    className="w-full py-2 border-[#4F46E5] text-[#4F46E5] hover:bg-blue-50 font-satoshi font-medium rounded-md text-sm"
                                    onClick={() => downloadTemplate('emp_fact.csv')}
                                >
                                    Download Template
                                </Button>
                            </div>
                        </div>

                        {/* Heading 5 - Production Plan */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                            <div className="flex items-center justify-center w-12 h-12 bg-orange-50 rounded-lg mb-4">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            </div>
                            <h3 className="font-satoshi text-lg font-semibold text-gray-900 mb-2">Production Plan</h3>
                            <p className="font-satoshi text-sm text-gray-600 mb-4">Manage production schedules and manufacturing plans</p>

                            <div className="flex flex-col gap-2">
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="productionPlanUpload"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleProductionPlanUpload}
                                        disabled={uploadingStates.productionPlan}
                                    />
                                    <Button 
                                        className="w-full py-2 bg-[#4F46E5] hover:bg-[#4F46E5] text-white font-satoshi font-medium rounded-md border-0 text-sm"
                                        disabled={uploadingStates.productionPlan}
                                    >
                                        {uploadingStates.productionPlan ? (
                                            <>
                                                <Spinner
                                                    as="span"
                                                    animation="border"
                                                    size="sm"
                                                    role="status"
                                                    aria-hidden="true"
                                                    className="me-2"
                                                />
                                                Uploading...
                                            </>
                                        ) : (
                                            'Upload File'
                                        )}
                                    </Button>
                                </div>
                                <Button
                                    variant="outline-primary"
                                    className="w-full py-2 border-[#4F46E5] text-[#4F46E5] hover:bg-blue-50 font-satoshi font-medium rounded-md text-sm"
                                    onClick={() => downloadTemplate('loading_plan.csv')}
                                >
                                    Download Template
                                </Button>
                            </div>
                        </div>

                        {/* Heading 6 - Style OB */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                            <div className="flex items-center justify-center w-12 h-12 bg-teal-50 rounded-lg mb-4">
                                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                            </div>
                            <h3 className="font-satoshi text-lg font-semibold text-gray-900 mb-2">Style OB</h3>
                            <p className="font-satoshi text-sm text-gray-600 mb-4">Manage style order books and garment specifications</p>

                            <div className="flex flex-col gap-2">
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="styleOBUpload"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleStyleOBUpload}
                                        disabled={uploadingStates.styleOB}
                                    />
                                    <Button 
                                        className="w-full py-2 bg-[#4F46E5] hover:bg-[#4F46E5] text-white font-satoshi font-medium rounded-md border-0 text-sm"
                                        disabled={uploadingStates.styleOB}
                                    >
                                        {uploadingStates.styleOB ? (
                                            <>
                                                <Spinner
                                                    as="span"
                                                    animation="border"
                                                    size="sm"
                                                    role="status"
                                                    aria-hidden="true"
                                                    className="me-2"
                                                />
                                                Uploading...
                                            </>
                                        ) : (
                                            'Upload File'
                                        )}
                                    </Button>
                                </div>
                                <Button
                                    variant="outline-primary"
                                    className="w-full py-2 border-[#4F46E5] text-[#4F46E5] hover:bg-blue-50 font-satoshi font-medium rounded-md text-sm"
                                    onClick={() => downloadTemplate('style_ob.csv')}
                                >
                                    Download Template
                                </Button>
                            </div>
                        </div>

                        {/* Heading 7 - Local Holiday Calendar */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                            <div className="flex items-center justify-center w-12 h-12 bg-indigo-50 rounded-lg mb-4">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="font-satoshi text-lg font-semibold text-gray-900 mb-2">Local Holiday Calendar</h3>
                            <p className="font-satoshi text-sm text-gray-600 mb-4">Manage local holidays and important dates for workforce planning</p>

                            <div className="flex flex-col gap-2">
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="holidayCalendarUpload"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleHolidayCalendarUpload}
                                        disabled={uploadingStates.holidayCalendar}
                                    />
                                    <Button 
                                        className="w-full py-2 bg-[#4F46E5] hover:bg-[#4F46E5] text-white font-satoshi font-medium rounded-md border-0 text-sm"
                                        disabled={uploadingStates.holidayCalendar}
                                    >
                                        {uploadingStates.holidayCalendar ? (
                                            <>
                                                <Spinner
                                                    as="span"
                                                    animation="border"
                                                    size="sm"
                                                    role="status"
                                                    aria-hidden="true"
                                                    className="me-2"
                                                />
                                                Uploading...
                                            </>
                                        ) : (
                                            'Upload File'
                                        )}
                                    </Button>
                                </div>
                                <Button
                                    variant="outline-primary"
                                    className="w-full py-2 border-[#4F46E5] text-[#4F46E5] hover:bg-blue-50 font-satoshi font-medium rounded-md text-sm"
                                    onClick={() => downloadTemplate('local_holiday_calendar.csv')}
                                >
                                    Download Template
                                </Button>
                            </div>
                        </div>
                    </div>

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
export default ApplicationTesting;