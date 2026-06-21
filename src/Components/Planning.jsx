import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../Shared_Components/Header';
import Sidenav from '../Shared_Components/Sidenav';
import { Dropdown, Button, Spinner, Toast, Modal, Form } from "react-bootstrap";
import API from '../API/api';
import { Tooltip } from "react-tooltip"; ''
import LoadingOverlay from '../Shared_Components/LoadingOverlay';
import Footer from '../Shared_Components/Footer';
import newDownloadIcon from '../assets/DownloadIcon.svg';
import newUploadIcon from '../assets/new_Upload.svg';
import newManningSheet from '../assets/New_Manning_Preview.svg';
import generateIcon from '../assets/Generate new.svg';

const Planning = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const stateForeCastPeriod = location.state?.forecastPeriod;
    const [selectedDays, setSelectedDays] = useState(stateForeCastPeriod || '60');
    const daysOptions = ['1', '7', '30', '60'];
    const [isUploading, setIsUploading] = useState(false);
    const [isUploadingWip, setIsUploadingWip] = useState(false);
    const [loadingSheetId, setLoadingSheetId] = useState(null);
    const [toastMessage, setToastMessage] = useState("");
    const [showToast, setShowToast] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isFriday, setIsFriday] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [currentUserEmail, setCurrentUserEmail] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [lineCapacities, setLineCapacities] = useState({
        "Line 1": "",
        "Line 2": "",
        "Line 3": "",
        "Line 4": "",
        "Line 5": "",
        "Line 6": "",
        "Line 7": "",
        "Line 8": "",
        "Line 9": "",
        "Line 10": ""
    });

    const [manningDataByLine, setManningDataByLine] = useState({});
    const [isLoadingData, setIsLoadingData] = useState(false);

    useEffect(() => {
        const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday
        setIsFriday(today === 5);

        const userEmail = localStorage.getItem('userEmail');
        setCurrentUserEmail(userEmail || '');
    }, []);

    const fetchManningDataForLine = async (lineNumber) => {
        try {
            const lineName = `Line ${lineNumber}`;
            let plannedDate = null;

            // You can adjust these parameters as needed
            const response = await API.getManningSheet(
                lineName,
                'Collar', // or your default activeTab
                parseInt(selectedDays),
                null, // selectedStyle
                plannedDate
            );

            const apiData = response.data.data;
            const operatorNames = [];
            if (apiData.table_data && Array.isArray(apiData.table_data)) {
                const uniqueOperators = new Set();
                apiData.table_data.forEach(row => {
                    if (row['Operator Name'] && row['Operator Name'].trim()) {
                        uniqueOperators.add(row['Operator Name'].trim());
                    }
                });
                operatorNames.push(...Array.from(uniqueOperators));
            }

            return {
                total_required: apiData.machinist_nonMachinist_count?.total_required || 0,
                total_available: apiData.machinist_nonMachinist_count?.total_available || 0,
                info: apiData.machinist_nonMachinist_info || {},
                operators: operatorNames
            };
        } catch (error) {
            console.error(`Error fetching data for ${lineNumber}:`, error);
            return {
                total_required: 0,
                total_available: 0,
                info: {},
                operators: []
            };
        }
    };


    const fetchAllManningData = async () => {
        setIsLoadingData(true);
        const dataPromises = manningSheets.slice(0, 8).map(sheet =>
            fetchManningDataForLine(sheet.id)
        );

        try {
            const results = await Promise.all(dataPromises);
            const dataByLine = {};

            manningSheets.slice(0, 8).forEach((sheet, index) => {
                dataByLine[sheet.id] = results[index];
            });

            setManningDataByLine(dataByLine);
        } catch (error) {
            console.error('Error fetching manning data:', error);
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        fetchAllManningData();
    }, [selectedDays]);



    const isWipUploadAllowed = currentUserEmail === 'alok_kumar@laguna-clothing.com' || currentUserEmail === 'naveen_kumar@laguna-clothing.com';

    const handleUploadClick = () => {
        setShowModal(true);
    };

    const handleWipUploadClick = () => {
        // Create hidden file input and trigger click
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.xlsx,.xls,.csv';
        fileInput.style.display = 'none';

        fileInput.onchange = async (event) => {
            const file = event.target.files[0];
            if (file) {
                await handleWipFileUpload(file);
            }
        };

        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    };

    const handleWipFileUpload = async (file) => {
        setIsUploadingWip(true);

        try {
            const formData = new FormData();
            formData.append('file', file, file.name);

            const response = await API.uploadWipData(formData);

            if (response && response.data) {
                console.log('WIP Upload successful:', response.data);
                setToastMessage("WIP data uploaded successfully!");
            } else {
                console.error("WIP Upload failed: No response data.");
                setToastMessage("WIP upload failed. Please try again.");
            }
        } catch (error) {
            console.error('Error uploading WIP data:', error);
            setToastMessage(error.response?.data?.message || "Error uploading WIP data. Please try again.");
        } finally {
            setShowToast(true);
            setIsUploadingWip(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedFile(null);
        // Reset line capacities
        setLineCapacities({
            "Line 1": "",
            "Line 2": "",
            "Line 3": "",
            "Line 4": "",
            "Line 5": "",
            "Line 6": "",
            "Line 7": "",
            "Line 8": "",
            "Line 9": "",
            "Line 10": ""
        });
    };

    const handleLineCapacityChange = (line, value) => {
        // Only allow integers
        const intValue = value.replace(/\D/g, '').substring(0, 4);

        setLineCapacities({
            ...lineCapacities,
            [line]: intValue
        });
    };

    const handleFileSelection = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleSubmit = async () => {
        setIsUploading(true);

        try {
            // Filter out empty capacity values
            const filteredCapacities = Object.fromEntries(
                Object.entries(lineCapacities).filter(([_, value]) => value !== "")
            );

            // Convert string values to integers
            const numericCapacities = Object.fromEntries(
                Object.entries(filteredCapacities).map(([key, value]) => [JSON.stringify(key), parseInt(Number(value), 10)])
            );

            // Create form data
            const formData = new FormData();

            // Add file if selected
            if (selectedFile) {
                formData.append('file', selectedFile, selectedFile.name);
            }

            // Add line capacities to the payload
            formData.append('line_capacities', JSON.stringify(numericCapacities));

            const response = await API.uploadLoadingPlan(formData);

            if (response && response.data) {
                console.log('Upload successful:', response.data);
                setToastMessage("Loading Plan uploaded successfully!");
                handleCloseModal();
            } else {
                console.error("Upload failed: No response data.");
                setToastMessage("Upload failed. Please try again.");
            }
        } catch (error) {
            console.error('Error uploading plan:', error);
            setToastMessage(error.response?.data?.message || "Error uploading plan. Please try again.");
        } finally {
            setShowToast(true);
            setIsUploading(false);
        }
    };

    const [manningSheets, setManningSheets] = useState([
        { id: 1, name: 'Line 1' },
        { id: 2, name: 'Line 2' },
        { id: 3, name: 'Line 3' },
        { id: 4, name: 'Line 4' },
        { id: 5, name: 'Line 5' },
        { id: 6, name: 'Line 6' },
        { id: 7, name: 'Line 7' },
        { id: 8, name: 'Line 8' },
        { id: 9, name: 'Line 9' },
        { id: 10, name: 'Line 10' },
    ]);

    const handleDaysSelection = (days) => {
        setSelectedDays(days);
    };

    const handleCardClick = (e, sheetId) => {
        // Prevent navigation if clicking the download button
        if (e.target.closest('.download-button')) {
            e.stopPropagation();
            return;
        }
        const formattedLine = `Line ${sheetId}`;
        navigate(`/planning_sheet?line=${formattedLine}&forecast_period=${selectedDays}`);
    };

    // const handleDownloadAll = async () => {
    //     try {
    //         const response = await API.downloadManningSheet('All', selectedDays);

    //         // Handle file download
    //         const blob = new Blob([response.data], { type: 'application/octet-stream' });
    //         const url = window.URL.createObjectURL(blob);
    //         const a = document.createElement('a');
    //         a.href = url;
    //         a.download = `All_Manning_Sheets.zip`;
    //         document.body.appendChild(a);
    //         a.click();
    //         document.body.removeChild(a);

    //         setToastMessage('Downloaded all Manning Sheets');
    //         setShowToast(true);
    //     } catch (error) {
    //         console.error('Error downloading all sheets:', error);
    //         setToastMessage('Download failed. Please try again.');
    //         setShowToast(true);
    //     }
    // };

    const handleDownload = async (e, sheetId) => {
        e.stopPropagation();
        setLoadingSheetId(sheetId);

        try {
            const lineValue = `Line ${sheetId}`; // Correct format
            const selectedDaysString = Array.isArray(selectedDays)
                ? selectedDays.join("_")
                : String(selectedDays);

            const response = await API.downloadManningSheet(lineValue, selectedDays);
            console.log('Manning sheet downloaded:', response.data);

            const dayText = selectedDays === '1' ? 'day' : 'days';

            if (!response.data || response.data.size < 1000 || response.data.type === "application/json") {
                console.error('No data available for download');
                setToastMessage(`No data available for Line ${sheetId} in ${selectedDaysString} ${dayText}`);
                setShowToast(true);
                return;
            }

            // Handle file download
            const blob = new Blob([response.data], { type: 'application/octet-stream' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Line_${sheetId}_Manning_Sheet_${selectedDaysString}_days.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            setToastMessage(`Manning sheet for ${lineValue} in ${selectedDaysString} days is downloaded successfully`);
            setShowToast(true);
        } catch (error) {
            console.error('Error downloading manning sheet:', error);
            setToastMessage(`Failed to download sheet for Line ${sheetId}`);
            setShowToast(true);
        } finally {
            setLoadingSheetId(null);
        }
    };

    const generateManningSheet = async () => {
        try {
            setLoading(true);
            const response = await API.generateManningSheet();
            console.log('Manning sheet generated:', response.data);
            setToastMessage('Manning sheet generated successfully');
        } catch (error) {
            console.error('Error generating manning sheet:', error);
            setToastMessage('Failed to generate manning sheet');
        } finally {
            setLoading(false);
            setShowToast(true);
        }
    };

    return (
        <div className="h-screen w-screen flex overflow-hidden">
            <Sidenav />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 px-4 py-2 overflow-y-auto" style={{ paddingBottom: '70px' }}>
                    <div className="px-4 py-2">
                        <div className="flex justify-between items-start mb-3">
                            <div className="space-y-2">
                                <h2 className="font-satoshi text-2xl font-semibold">Manning Sheets</h2>
                                <h6 className="font-satoshi text-base font-normal">
                                    The manning sheets for the selected day plan have been generated.
                                </h6>
                            </div>

                            {/* Header Controls */}
                            <div className="flex items-center justify-between mt-2 mb-3">
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline-primary"
                                        className={` bg-[#FFFFFF] border-[#4F46E5] text-[#4F46E5] flex items-center hover:bg-[#FFFFFF] hover:border-[#4F46E5] hover:text-[#4F46E5] `}
                                        onClick={handleUploadClick}
                                        disabled={isUploading}
                                    >
                                        <img
                                            src={newUploadIcon}
                                            alt="export"
                                            className="mr-1.5 w-5 h-5"
                                        />
                                        <span className="font-satoshi text-base font-medium" style={{ color: "#030712" }}>
                                            Export
                                        </span>
                                    </Button>

                                    {/* Day Dropdown */}
                                    <Dropdown>
                                        <Dropdown.Toggle variant="outline-primary" className="custom-dropdown">
                                            {selectedDays === '1' ? "1 Day" : `${selectedDays} Days`}
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu >
                                            {daysOptions.map((option) => (
                                                <Dropdown.Item
                                                    key={option}
                                                    active={selectedDays === option}
                                                    onClick={() => handleDaysSelection(option)}
                                                >
                                                    {option === '1' ? "1 Day" : `${option} Days`}
                                                </Dropdown.Item>
                                            ))}
                                        </Dropdown.Menu>
                                    </Dropdown>

                                    {isWipUploadAllowed && (
                                        <Button
                                            variant="outline-primary"
                                            className="bg-[#FFFFFF] border-[#286DB2] text-[#286DB2] flex items-center hover:bg-[#FFFFFF] hover:border-[#286DB2] hover:text-[#286DB2]"
                                            onClick={handleWipUploadClick}
                                            disabled={isUploadingWip}
                                        >
                                            <img
                                                src={newUploadIcon}
                                                alt="upload"
                                                className="mr-1.5 w-5 h-5"
                                            />
                                            <span className="font-satoshi text-base font-medium">
                                                {isUploadingWip ? "Uploading..." : "Upload WIP"}
                                            </span>
                                        </Button>
                                    )}

                                    {/* Submit Button */}
                                    <Button
                                        variant="primary"
                                        className="font-satoshi bg-[#4F46E5] border-[#4F46E5] flex items-center hover:bg-[#4F46E5] hover:border-[#4F46E5]"
                                        onClick={generateManningSheet}
                                        disabled={loading}
                                    >
                                        <img
                                            src={generateIcon}
                                            alt="generate"
                                            className="mr-1.5 w-5 h-5"
                                        />
                                        <span className="font-satoshi text-base font-medium">
                                            Generate
                                        </span>
                                    </Button>
                                </div>



                                {/* Download Button */}
                                {/* <div className="flex items-center gap-2">
                                    {isWipUploadAllowed && (
                                        <Button
                                            variant="outline-primary"
                                            className="bg-[#FFFFFF] border-[#286DB2] text-[#286DB2] flex items-center hover:bg-[#FFFFFF] hover:border-[#286DB2] hover:text-[#286DB2]"
                                            onClick={handleWipUploadClick}
                                            disabled={isUploadingWip}
                                        >
                                            <img
                                                src={newUploadIcon}
                                                alt="upload"
                                                className="mr-1.5 w-5 h-5"
                                            />
                                            <span className="font-satoshi text-base font-medium">
                                                {isUploadingWip ? "Uploading..." : "Upload WIP"}
                                            </span>
                                        </Button>
                                    )} */}

                                {/* Submit Button */}
                                {/* <Button
                                        variant="primary"
                                        className="font-satoshi bg-[#4F46E5] border-[#4F46E5] flex items-center hover:bg-[#4F46E5] hover:border-[#4F46E5]"
                                        onClick={generateManningSheet}
                                        disabled={loading}
                                    >
                                        <img
                                            src={generateIcon}
                                            alt="generate"
                                            className="mr-1.5 w-5 h-5"
                                        />
                                        <span className="font-satoshi text-base font-medium">
                                            Generate
                                        </span>
                                    </Button> */}

                                {/* <div data-tooltip-id="upload-tooltip">
                                <Button
                                    variant="outline-primary"
                                    className={` bg-[#FFFFFF] border-[#4F46E5] text-[#4F46E5] flex items-center hover:bg-[#FFFFFF] hover:border-[#4F46E5] hover:text-[#4F46E5] `}
                                    onClick={handleUploadClick}
                                    disabled={ isUploading}
                                >
                                    <img
                                        src={newUploadIcon}
                                        alt="export"
                                        className="mr-1.5 w-5 h-5"
                                    />
                                    <span className="font-satoshi text-base font-medium"style={{ color: "#030712" }}>
                                        Export
                                    </span>
                                </Button> */}
                                {/* <Button
                                variant="outline-primary"
                                className={` bg-[#FFFFFF] border-[#286DB2] text-[#286DB2] flex items-center hover:bg-[#FFFFFF] hover:border-[#286DB2] hover:text-[#286DB2] ml-2`}
                                onClick={handleDownloadAll}
                            >
                                <img
                                    src={downloadIcon}
                                    alt="export"
                                    className="mr-1.5 w-5 h-5"
                                />
                                <span className="font-satoshi text-base font-medium">
                                    Download All
                                </span>
                            </Button> */}
                                {/* </div> */}
                                {/* Tooltip for disabled button */}
                                {/* {!isFriday && (
                                <Tooltip id="upload-tooltip" place="top" effect="solid"
                                    style={{
                                        backgroundColor: "#212121",
                                        color: "#fff",
                                        padding: "8px 12px",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
                                        transition: "opacity 0.3s ease-in-out, transform 0.2s",
                                    }}>
                                    This button will be enabled only on Friday.
                                </Tooltip>
                            )} */}
                                {/* </div> */}
                            </div>
                        </div>



                        {loading && (
                            <LoadingOverlay
                                title="Preparing the Manning sheets"
                                message="Please hold on for a moment"
                            />
                        )}

                        {/* Manning Sheet Cards Grid */}
                        {(isUploading || isUploadingWip) ? (
                            <div className="flex flex-col items-center justify-center py-10">
                                <Spinner
                                    animation="border"
                                    variant="primary"
                                    style={{ width: '3rem', height: '3rem' }}
                                />
                                <p className="mt-3 text-gray-700 font-medium">
                                    {isUploading ? "Processing your file. Please wait..." : "Uploading WIP data. Please wait..."}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-20">
                                {manningSheets.map((sheet) => {
                                    const lineData = manningDataByLine[sheet.id] || {};
                                    const totalRequired = lineData.total_required || 0;
                                    const totalAvailable = lineData.total_available || 0;
                                    const machinistInfo = lineData.info || {};
                                    const operators = lineData.operators || [];

                                    // Calculate machinist vs non-machinist breakdown
                                    const nonMachinistTotal = Object.values(machinistInfo).reduce((sum, val) => sum + (parseInt(val) || 0), 0);
                                    const machinistCount = totalAvailable - nonMachinistTotal;

                                    // Function to get initials from operator name
                                    const getInitials = (name) => {
                                        if (!name) return 'OP';
                                        const words = name.trim().split(' ');
                                        if (words.length === 1) {
                                            return words[0].substring(0, 2).toUpperCase();
                                        }
                                        return words.map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase();
                                    };

                                    return (
                                        <div key={sheet.id} className="rounded-lg border border-gray-200 cursor-pointer hover:shadow-md transition-shadow duration-200"
                                            onClick={(e) => handleCardClick(e, sheet.id)}>
                                            {/* Preview Section with blue background */}
                                            {/* <div className="px-3 pt-3 pb-2" style={{ backgroundColor: '#F9FAFB' }}>
                                            <div className="flex justify-start">
                                            <div className="w-12 h-12 rounded-md overflow-hidden bg-white shadow-sm">
                                                <img
                                                    src={newManningSheet}
                                                    alt="Manning Sheet Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>
                                        </div> */}
                                            <div className="px-4 pt-4 pb-2 bg-gray-50 border-b border-gray-100">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center">
                                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                                                            <img
                                                                src={newManningSheet}
                                                                alt="Manning Sheet Preview"
                                                                className="w-6 h-6 object-cover"
                                                            />
                                                        </div>
                                                        <span className="text-sm text-gray-600">Manning sheet</span>
                                                    </div>
                                                </div>

                                                {/* Information Section */}
                                                {/* <div className="p-3 pt-2 bg-white">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h3 className="font-satoshi text-lg font-bold leading-tight mb-0.5">{sheet.name}</h3>
                                                    <span className="font-medium text-sm text-gray-600">Manning Sheet </span>
                                                </div>
                                                <div className="bg-gray-100 p-1.5 rounded-lg mb-2">
                                                    <button
                                                        className="text-[#286DB2] hover:text-[#1a4d80]"
                                                        aria-label="Download"
                                                        onClick={(e) => handleDownload(e, sheet.id)}
                                                        disabled={loadingSheetId === sheet.id}
                                                    >
                                                        {loadingSheetId === sheet.id ? (
                                                            <Spinner animation="border" size="sm" className="mr-2" />
                                                        ) : (
                                                            <img src={newDownloadIcon} alt="export" className="w-6 h-6" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))} */}
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-bold text-lg text-gray-900">{sheet.name}</h3>
                                                    <button
                                                        className="text-gray-400 hover:text-gray-600 download-button p-1"
                                                        aria-label="Download"
                                                        onClick={(e) => handleDownload(e, sheet.id)}
                                                        disabled={loadingSheetId === sheet.id}
                                                    >
                                                        {loadingSheetId === sheet.id ? (
                                                            <Spinner animation="border" size="sm" />
                                                        ) : (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>

                                                <p className="text-xs text-gray-500 mt-1">Last updated: Nov 28 2024</p>
                                            </div>

                                            {/* Stats Section */}
                                            <div className="px-4 py-3">
                                                <div className="grid grid-cols-3 gap-2 text-xs">
                                                    <div>
                                                        <span className="text-gray-500 block">Machinist</span>
                                                        <span className="font-semibold text-gray-900">
                                                            {isLoadingData ? '...' : `${Math.max(0, machinistCount)}/${totalRequired}`}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 block">Non-machinist</span>
                                                        <span className="font-semibold text-gray-900">
                                                            {isLoadingData ? '...' : `${nonMachinistTotal}/${Math.max(0, totalRequired - machinistCount)}`}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 block">Total</span>
                                                        <span className="font-semibold text-gray-900">
                                                            {isLoadingData ? '...' : `${totalAvailable}/${totalRequired}`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bottom Section with Avatars and Export */}
                                            <div className="px-4 pb-4 flex items-center justify-between">
                                                <div className="flex items-center">
                                                    {/* Avatar Stack - Using actual operator names */}
                                                    <div className="flex -space-x-1">
                                                        {operators.slice(0, 4).map((operatorName, index) => (
                                                            <div
                                                                key={`${operatorName}-${index}`}
                                                                className={`w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center text-white border-2 border-white ${index % 4 === 0 ? 'bg-orange-400' :
                                                                        index % 4 === 1 ? 'bg-green-400' :
                                                                            index % 4 === 2 ? 'bg-blue-400' : 'bg-purple-400'
                                                                    }`}
                                                                style={{ zIndex: 10 - index }}
                                                                title={operatorName}
                                                            >
                                                                {getInitials(operatorName)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <span className="ml-2 text-sm font-medium text-gray-700">
                                                        {isLoadingData ? '...' : operators.length > 4 ? `+${operators.length - 4}` : `+${Math.max(0, operators.length)}`}
                                                    </span>
                                                </div>

                                                <button
                                                    className="text-sm text-blue-600 font-medium hover:text-blue-800 flex items-center download-button"
                                                    onClick={(e) => handleDownload(e, sheet.id)}
                                                    disabled={loadingSheetId === sheet.id}
                                                >
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    Export
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Upload Plan Modal */}
                        <Modal
                            show={showModal}
                            onHide={handleCloseModal}
                            className="font-satoshi !absolute !right-0 !left-auto !w-96 !my-0 !h-full"
                            dialogClassName="modal-right"
                            aria-labelledby="upload-plan-modal"

                        >
                            <Modal.Header className="p-4 border-b" closeButton>
                                <Modal.Title className="text-xl font-bold">Upload Plan</Modal.Title>
                            </Modal.Header>
                            <Modal.Body className="overflow-y-auto flex-1 p-4">
                                {/* Line Capacity Inputs */}
                                <Form>
                                    <h5 className="font-bold mb-4">Line Capacities for next week</h5>

                                    {Object.keys(lineCapacities).map((line) => (
                                        <Form.Group key={line} className="mb-3">
                                            <div className="d-flex align-items-center">
                                                <Form.Label className="me-3 mb-0 w-25 font-normal">{line}</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={lineCapacities[line]}
                                                    onChange={(e) => handleLineCapacityChange(line, e.target.value)}
                                                    placeholder="Enter daily capacity"
                                                    className="py-2.5 px-2.5 rounded"
                                                    maxLength={4}
                                                />
                                            </div>
                                        </Form.Group>
                                    ))}

                                    {/* File Upload Section */}
                                    <div className="text-center">
                                        <Form.Control
                                            type="file"
                                            className="d-none"
                                            id="file-upload"
                                            onChange={handleFileSelection}
                                            accept=".xlsx,.xls,.csv"
                                        />
                                        {selectedFile ? (
                                            <div className="mb-2">
                                                <span className="text-gray-700">{selectedFile.name}</span>
                                                <button
                                                    type="button"
                                                    className="ml-2 text-red-500 hover:text-red-700"
                                                    onClick={() => setSelectedFile(null)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ) : null}
                                        <Form.Label
                                            htmlFor="file-upload"
                                            className="mb-0 cursor-pointer w-full"
                                        >
                                            <Button
                                                variant="outline-primary"
                                                as="span"
                                                className="d-flex align-items-center justify-content-center"
                                            >
                                                <img
                                                    src={newUploadIcon}
                                                    alt="export"
                                                    className="mr-1.5 w-5 h-5"
                                                />
                                                Upload File
                                            </Button>
                                        </Form.Label>
                                    </div>
                                </Form>
                            </Modal.Body>
                            <Modal.Footer className="flex flex-col p-4 gap-2 border-top">
                                <Button
                                    variant="primary"
                                    onClick={handleSubmit}
                                    disabled={isUploading || !selectedFile}
                                    className="w-full py-2.5 px-0 m-0 rounded-md font-medium bg-[#286DB2] border-[#286DB2] disabled:bg-[#E6E6E6] disabled:border-[#E6E6E6] disabled:text-gray-500"
                                >
                                    {isUploading ? "Uploading..." : "Submit Plan"}
                                </Button>
                                <Button
                                    variant="outline-secondary"
                                    onClick={handleCloseModal}
                                    className="w-full py-2.5 px-0 m-0 rounded-md font-medium text-black border-[#ccc] bg-white"
                                >
                                    Cancel
                                </Button>
                            </Modal.Footer>
                        </Modal>
                    </div>

                    <Footer />



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

                </main>
            </div>
        </div>
    )
}

export default Planning;