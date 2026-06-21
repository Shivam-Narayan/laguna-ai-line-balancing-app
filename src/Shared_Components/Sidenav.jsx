import React, { useState, useEffect } from 'react';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { Button } from 'react-bootstrap';
import Logo from '../assets/Ascendum_logo.svg';
import NewLogo from '../assets/Ascendum Logo Black.svg';
import { RiDashboardFill } from "react-icons/ri";
import { RiDashboardLine } from "react-icons/ri";
import { useNavigate, useLocation } from 'react-router-dom';
import PlanningBlack from '../assets/Planning Black.svg';
import PlanningWhite from '../assets/Planning White.svg';
import ForecastBlack from '../assets/Forecast Black.svg';
import ForecastWhite from '../assets/Forecast White.svg';
import OperatorsBlack from '../assets/Operators Black.svg';
import OperatorsWhite from '../assets/Operators White.svg';
import DdayNew from '../assets/D_Day new.svg';
import PlanningNew from '../assets/Planning New.svg';
import ForecastNew from '../assets/Forecast New.svg';
import OperatorsNew from '../assets/Operators New.svg';
import LogoutNew from '../assets/Logout New.svg';
import API from '../API/api';

const Sidenav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const userType = parseInt(localStorage.getItem('userType'));
    const [selectedItem, setSelectedItem] = useState(() => {
        // Initialize selected item based on current path
        const path = window.location.pathname;
        if (path.includes('planning')) return 'planning';
        if (path.includes('forecast')) return 'forecast';
        if (path.includes('operators')) return 'operators';
        if (path.includes('application_testing')) return 'application_testing';
        return 'dashboard';
    });

    const [currentForecastPeriod, setCurrentForecastPeriod] = useState(null);

    useEffect(() => {
        const path = location.pathname;
        if (path.includes('planning')) {
            setSelectedItem('planning');
        } else if (path.includes('forecast')) {
            setSelectedItem('forecast');
        } else if (path.includes('operators')) {
            setSelectedItem('operators');
        } else if (path.includes('application_testing')) { // Add this condition
            setSelectedItem('application_testing');
        } else if (path.includes('dashboard')) {
            setSelectedItem('dashboard');
        }

        // If on planning_sheet, extract the forecast period
        if (path.includes('planning_sheet')) {
            const queryParams = new URLSearchParams(location.search);
            const forecastPeriod = queryParams.get('forecast_period');
            if (forecastPeriod) {
                setCurrentForecastPeriod(forecastPeriod);
            }
        }
    }, [location.pathname, location.search]);

    const handleNavigation = (route, item) => (e) => {
        e.preventDefault();
        // Set the selected item immediately before navigation
        setSelectedItem(item);
        // navigate(route);
        if (item === 'planning' && location.pathname.includes('planning_sheet') && currentForecastPeriod) {
            navigate('/planning', { state: { forecastPeriod: currentForecastPeriod } });
        } else {
            navigate(route);
        }
    };

    const handleLogout = async () => {
        try {
            const email = localStorage.getItem('userEmail');

            // Attempt to call the API logout endpoint
            const response = await API.logout({ email });
            console.log('Logout response:', response);

        } catch (error) {
            console.error('Logout error:', error.response?.data || error.message);
        } finally {
            // Always clear local storage and redirect to login, even if API fails
            localStorage.removeItem('authToken');
            localStorage.removeItem('userEmail');

            setTimeout(() => {
                window.location.href = '/login';
            }, 100);
        }
    };

    return (

        // <Navbar className="w-60 min-h-screen bg-[#F3F4F6] flex flex-col p-4">
        <div className="w-60 min-h-screen bg-[#F9FAFB] flex flex-col border-r border-gray-200">
            {/* Header */}
            <div className="px-6">
                <img
                    src={NewLogo}
                    alt="Laguna Logo"
                    className="w-32 h-14 object-contain"
                />
            </div>

            <div className="flex-1 px-4 py-6">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4 px-2">
                    PAGES
                </div>

                <Nav className="!flex !flex-col space-y-1">
                    <Nav.Link
                        onClick={handleNavigation(userType === 1 ? '/admin-dashboard' : '/user-dashboard', 'dashboard')}
                        className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-200 ${selectedItem === 'dashboard'
                            ? 'bg-blue-50 border-r-2 border-blue-700'
                            : 'hover:bg-gray-50'
                            }`}
                        style={{
                            color: selectedItem === 'dashboard' ? '#4F46E5' : '#030712'
                        }}
                    >
                        {/* <RiDashboardLine
                            className="w-5 h-5 mr-3"
                            style={{
                                color: selectedItem === 'dashboard' ? '#4F46E5' : '#030712'
                            }}
                        /> */}
                        <img
                            src={DdayNew}
                            alt="D-Day"
                            className="w-5 h-5 mr-3"
                            style={{
                                filter: selectedItem === 'dashboard'
                                    ? 'brightness(0) saturate(100%) invert(32%) sepia(94%) saturate(3283%) hue-rotate(232deg) brightness(95%) contrast(90%)'
                                    : 'brightness(0) saturate(100%) invert(5%) sepia(12%) saturate(2018%) hue-rotate(189deg) brightness(95%) contrast(98%)'
                            }}
                        />
                        <span className="font-satoshi text-base font-medium">D-Day</span>
                    </Nav.Link>

                    {userType === 0 && (
                        <>
                            <Nav.Link
                                onClick={handleNavigation('/planning', 'planning')}
                                className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-200 ${selectedItem === 'planning'
                                    ? 'bg-blue-50 border-r-2 border-blue-700'
                                    : 'hover:bg-gray-50'
                                    }`}
                                style={{
                                    color: selectedItem === 'planning' ? '#4F46E5' : '#030712'
                                }}
                            >
                                {/* <div className={`p-2 rounded-lg ${selectedItem === 'planning' ? 'bg-black' : 'bg-white'}`}> */}
                                <img
                                    src={PlanningNew}
                                    alt="Planning"
                                    // className="w-5 h-5"
                                    className="w-5 h-5 mr-3"
                                    style={{
                                        filter: selectedItem === 'planning'
                                            ? 'brightness(0) saturate(100%) invert(32%) sepia(94%) saturate(3283%) hue-rotate(232deg) brightness(95%) contrast(90%)'
                                            : 'brightness(0) saturate(100%) invert(5%) sepia(12%) saturate(2018%) hue-rotate(189deg) brightness(95%) contrast(98%)'
                                    }}
                                />
                                {/* </div> */}
                                <span className="font-satoshi text-base font-medium">Planning</span>
                            </Nav.Link>

                            <Nav.Link
                                onClick={handleNavigation('/forecast', 'forecast')}
                                className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-200 ${selectedItem === 'forecast'
                                    ? 'bg-blue-50 border-r-2 border-blue-700'
                                    : 'hover:bg-gray-50'
                                    }`}
                                style={{
                                    color: selectedItem === 'forecast' ? '#4F46E5' : '#030712'
                                }}
                            >
                                {/* <div className={`p-2 rounded-lg ${selectedItem === 'forecast' ? 'bg-black' : 'bg-white'}`}> */}
                                <img
                                    src={ForecastNew}
                                    alt="Forecast"
                                    // className="w-5 h-5"
                                    className="w-5 h-5 mr-3"
                                    style={{
                                        filter: selectedItem === 'forecast'
                                            ? 'brightness(0) saturate(100%) invert(32%) sepia(94%) saturate(3283%) hue-rotate(232deg) brightness(95%) contrast(90%)'
                                            : 'brightness(0) saturate(100%) invert(5%) sepia(12%) saturate(2018%) hue-rotate(189deg) brightness(95%) contrast(98%)'
                                    }}
                                />
                                {/* </div> */}
                                <span className="font-satoshi text-base font-medium">Forecast</span>
                            </Nav.Link>

                            <Nav.Link
                                onClick={handleNavigation('/operators', 'operators')}
                                className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-200 ${selectedItem === 'operators'
                                    ? 'bg-blue-50 border-r-2 border-blue-700'
                                    : 'hover:bg-gray-50'
                                    }`}
                                style={{
                                    color: selectedItem === 'operators' ? '#4F46E5' : '#030712'
                                }}
                            >
                                {/* <div className={`p-2 rounded-lg ${selectedItem === 'operators' ? 'bg-black' : 'bg-white'}`}> */}
                                <img
                                    src={OperatorsNew}
                                    alt="Operators"
                                    // className="w-5 h-5"
                                    className="w-5 h-5 mr-3"
                                    style={{
                                        filter: selectedItem === 'operators'
                                            ? 'brightness(0) saturate(100%) invert(32%) sepia(94%) saturate(3283%) hue-rotate(232deg) brightness(95%) contrast(90%)'
                                            : 'brightness(0) saturate(100%) invert(5%) sepia(12%) saturate(2018%) hue-rotate(189deg) brightness(95%) contrast(98%)'
                                    }}
                                />
                                {/* </div> */}
                                <span className="font-satoshi text-base font-medium">Operators</span>
                            </Nav.Link>
                            <Nav.Link
                                onClick={handleNavigation('/application_testing', 'application_testing')}
                                className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-200 ${selectedItem === 'application_testing'
                                    ? 'bg-blue-50 border-r-2 border-blue-700'
                                    : 'hover:bg-gray-50'
                                    }`}
                                style={{
                                    color: selectedItem === 'application_testing' ? '#4F46E5' : '#030712'
                                }}
                            >
                                {/* <div className={`p-2 rounded-lg ${selectedItem === 'operators' ? 'bg-black' : 'bg-white'}`}> */}
                                {/* <img
                                    src={OperatorsNew}
                                    alt="Application Testing"
                                    // className="w-5 h-5"
                                    className="w-5 h-5 mr-3"
                                    style={{
                                        filter: selectedItem === 'application_testing'
                                            ? 'brightness(0) saturate(100%) invert(32%) sepia(94%) saturate(3283%) hue-rotate(232deg) brightness(95%) contrast(90%)'
                                            : 'brightness(0) saturate(100%) invert(5%) sepia(12%) saturate(2018%) hue-rotate(189deg) brightness(95%) contrast(98%)'
                                    }}
                                /> */}
                                <svg
                                    className="w-5 h-5 mr-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    style={{
                                        color: selectedItem === 'application_testing' ? '#4F46E5' : '#030712'
                                    }}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                    />
                                </svg>
                                {/* </div> */}
                                <span className="font-satoshi text-base font-medium">Application Testing</span>
                            </Nav.Link>
                        </>
                    )}
                </Nav>
                {/* </Navbar> */}
            </div>
            {/* Logout */}
            <div className="px-4 pb-1 border-t border-gray-200">
                <Button
                    variant="light"
                    onClick={handleLogout}
                    className="flex items-center px-3 py-2.5 text-[#030712] hover:bg-gray-50 rounded-md text-sm font-semibold transition-colors duration-200 w-full "
                    style={{ color: '#030712' }}
                >
                    {/* <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg> */}
                    <img
                        src={LogoutNew}
                        alt="Logout"
                        className="w-5 h-5 mr-3"
                        style={{
                            filter: 'brightness(0) saturate(100%) invert(5%) sepia(12%) saturate(2018%) hue-rotate(189deg) brightness(95%) contrast(98%)'
                        }}
                    />
                    <span className="font-satoshi text-base font-semibold">Log out</span>
                </Button>
            </div>
        </div>
    )
}
export default Sidenav;