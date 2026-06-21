import React, { useState, useRef, useEffect } from 'react';
import Logo from '../assets/Ascendum_logo.svg';
import { MdKeyboardArrowDown } from "react-icons/md";
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import API from '../API/api';
import userIcon from '../assets/user-circle.svg';
import refreshNew from '../assets/Refresh New.svg';
import newDownloadIcon from '../assets/DownloadIcon.svg';
import notificationNew from '../assets/Notification new.svg';
import { useUser } from '../Context/UserContext';

const Header = () => {
    const { userName } = useUser();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [currentDateTime, setCurrentDateTime] = useState(new Date());
    const dropdownRef = useRef(null);
    const notificationsRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setIsNotificationsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Update date and time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatDate = (date) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Update date and time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Fetch notifications once on load and poll every 5 minutes
    useEffect(() => {
        // Always fetch once on initial load to show existing notifications
        fetchNotifications();

        // Set up polling every 5 minutes
        const notificationInterval = setInterval(() => {
            fetchNotifications();
        }, 300000); // 5 minutes = 300,000 ms

        // Cleanup function
        return () => {
            if (notificationInterval) {
                clearInterval(notificationInterval);
            }
        };
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await API.getNotifications();

            // Get data directly from response.data
            const notificationArray = response.data?.data?.notifications || [];

            setNotifications(notificationArray);

            // Calculate unread count
            const unread = notificationArray.filter(notification => !notification.is_read).length;
            setUnreadCount(unread);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setNotifications([]);
        }
    };

    const handleMarkAsRead = (notificationId) => {
        API.markNotificationsRead({ notification_id: notificationId })
            .then(() => {
                // Update the local state to mark the notification as read
                setNotifications(notifications.map(notification =>
                    notification.id === notificationId
                        ? { ...notification, read: true }
                        : notification
                ));
                setUnreadCount(prevCount => Math.max(0, prevCount - 1));
            })
            .catch(error => {
                console.error('Error marking notification as read:', error);
            });
    };

    const handleMarkAllAsRead = () => {
        API.markNotificationsRead({ mark_all: true })
            .then(() => {
                // Update all notifications to read in local state
                setNotifications(notifications.map(notification => ({ ...notification, read: true })));
                setUnreadCount(0);
            })
            .catch(error => {
                console.error('Error marking all notifications as read:', error);
            });
    };

    // Handle notification click - check for file attachment and handle download
    const handleNotificationClick = (notification) => {
        // Always mark as read if not already read
        if (!notification.is_read) {
            handleMarkAsRead(notification.id);
        }

        // Check if there's file data attached to the notification
        if (notification.data && notification.data.fileName) {
            downloadNotificationFile(notification.id, notification.data.fileName);
        }
    };

    // Download file attached to notification
    const downloadNotificationFile = (notificationId, fileName) => {

        // Check if we have a valid notification ID
        if (!notificationId) {
            console.error('No notification ID provided for download');
            return;
        }

        // Send notification_id as a query parameter
        API.notificationsDownload(notificationId.toString())
            .then(response => {
                // Handle successful response
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;

                // Try to get filename from Content-Disposition header
                let downloadFileName = fileName || '';

                if (!downloadFileName) {
                    const contentDisposition = response.headers['content-disposition'];
                    if (contentDisposition) {
                        const filenameMatch = contentDisposition.match(/filename="?([^"]*)"?/);
                        if (filenameMatch && filenameMatch[1]) {
                            downloadFileName = filenameMatch[1];
                        }
                    }

                    // Use default if neither source provides a filename
                    if (!downloadFileName) {
                        downloadFileName = 'download.xlsx';
                    }
                }

                link.setAttribute('download', downloadFileName);
                document.body.appendChild(link);
                link.click();

                // Cleanup
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            })
            .catch(error => {
                console.error('Error downloading file:', error);
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    const responseData = error.response.data;
                    console.error('Response status:', error.response.status);
                    console.error('Response headers:', error.response.headers);

                    // Try to read the error message from the blob
                    if (responseData instanceof Blob) {
                        const reader = new FileReader();
                        reader.onload = () => {
                            try {
                                const errorObj = JSON.parse(reader.result);
                                console.error('Response error data:', errorObj);
                            } catch (e) {
                                console.error('Error parsing response data:', e);
                            }
                        };
                        reader.readAsText(responseData);
                    } else {
                        console.error('Response data:', responseData);
                    }
                } else {
                    // Something happened in setting up the request
                    console.error('Failed to download the file. Please try again later.');
                }
            });
    };

    // Format any timestamps found in the message text
    const formatMessageTimestamps = (message) => {
        if (!message) return '';

        // Pattern to match ISO-like timestamps (e.g., 2025-04-23 08:00:00.627526)
        const timestampPattern = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?)/g;

        return message.replace(timestampPattern, (match) => {
            try {
                // Parse the timestamp
                const dateTimeParts = match.split(' ');
                if (dateTimeParts.length !== 2) return match;

                const datePart = dateTimeParts[0]; // YYYY-MM-DD
                const timePart = dateTimeParts[1]; // HH:MM:SS.microseconds

                // Extract time components
                const timeComponents = timePart.split(':');
                if (timeComponents.length < 2) return match;

                let hours = parseInt(timeComponents[0], 10);
                const minutes = parseInt(timeComponents[1], 10);

                // Convert to 12-hour format with AM/PM
                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12;
                hours = hours ? hours : 12; // The hour '0' should be '12'

                // Format as YYYY-MM-DD H:MM AM/PM
                return `${datePart} ${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
            } catch (e) {
                console.error('Error formatting timestamp in message:', e);
                return match; // Return the original match if formatting fails
            }
        });
    };

    const formatNotificationTimeAgo = (dateString) => {
        if (!dateString) return '';

        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) {
            return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hr${diffHours !== 1 ? 's' : ''} ago`;
        } else if (diffDays < 7) {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        } else {
            // For older notifications, show the specific date and time
            return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
    };

    const handleChangePassword = () => {
        setIsDropdownOpen(false); // Close dropdown
        navigate('/change-password');
    };

    // const handleLogout = async () => {
    //     try {
    //         const email = localStorage.getItem('userEmail');
    //         const response = await API.logout({ email });
    //         console.log('Logout response:', response);

    //         localStorage.removeItem('authToken');
    //         localStorage.removeItem('userEmail');

    //         // Small delay before redirect to ensure API response is visible
    //         setTimeout(() => {
    //             window.location.href = '/login';
    //         }, 100);

    //     } catch (error) {
    //         console.error('Logout error:', error.response?.data || error.message);
    //     }
    // };

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
        <div className="w-full flex justify-end items-center bg-white border-b border-gray-200 h-14">
            {/* <div className="px-6">
                <img
                    src={Logo}
                    alt="Laguna Logo"
                    className="w-32 h-14 object-contain"
                />
            </div> */}

            <div className="flex items-center pr-4" ref={dropdownRef}>
                {/* Date and Time */}
                <div className="flex flex-row gap-1 items-end mr-6">
                    <span className="font-satoshi text-[#171717] text-base font-medium">
                        {formatDate(currentDateTime)}
                    </span>
                    <span className="font-satoshi text-[#171717] text-base font-medium">
                        {formatTime(currentDateTime)}
                    </span>
                </div>

                {/* Action Icons */}
                <div className="flex items-center gap-2">
                    <button className="p-1.5 hover:bg-gray-50 rounded-full"
                        onClick={() => window.location.reload()}>
                        <img src={refreshNew} alt="Refresh" className="w-6 h-6" />
                    </button>
                    {/* <button className="p-1.5 hover:bg-gray-50 rounded-full">
                        <img src={infoIcon} alt="Info" className="w-6 h-6" />
                    </button> */}
                    {/* Notification Icon with Badge */}
                    <div className="relative" ref={notificationsRef}>
                        <button
                            className="p-1.5 hover:bg-gray-50 rounded-full relative"
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                        >
                            <img src={notificationNew} alt="Notifications" className="w-6 h-6" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {isNotificationsOpen && (
                            <div className="absolute right-0 top-10 w-80 bg-white rounded-lg shadow-lg py-2 z-50 max-h-96 overflow-y-auto">
                                <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100">
                                    <h3 className="font-medium text-gray-800">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={handleMarkAllAsRead}
                                            className="text-sm text-blue-600 hover:text-blue-800"
                                        >
                                            Mark all as read
                                        </button>
                                    )}
                                </div>

                                {!notifications || notifications.length === 0 ? (
                                    <div className="px-4 py-3 text-center text-gray-500">
                                        No notifications
                                    </div>
                                ) : (
                                    <div>
                                        {notifications.map((notification, index) => (
                                            <div
                                                key={notification.id || index}
                                                className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${!notification.is_read ? 'bg-blue-50' : ''}`}
                                                onClick={() => handleNotificationClick(notification)}>
                                                
                                                {/* Title */}
                                                <div className="flex items-center justify-between">
                                                    <h3 className={`font-satoshi text-base ${!notification.is_read ? 'font-medium' : 'font-normal'}`}>
                                                        {notification.title}
                                                    </h3>
                                                </div>

                                                {/* Message */}
                                                <p className={`font-satoshi text-sm text-[#696969] mt-1 ${!notification.is_read ? 'font-medium' : 'font-normal'}`}>
                                                    {formatMessageTimestamps(notification.message)}
                                                </p>

                                                {/* Time */}
                                                <p className="font-satoshi text-xs font-normal text-[#959595] mb-3">
                                                    {formatNotificationTimeAgo(notification.created_at)}
                                                </p>

                                                {/* Download Button - Positioned at bottom */}
                                                {notification.data && notification.data.fileName && (
                                                    <button 
                                                        className="text-black text-sm flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                                        title={`Download: ${notification.data.fileName}`}
                                                    >
                                                        <img 
                                                            src={newDownloadIcon} 
                                                            alt="Download icon"
                                                            className="w-4 h-4"
                                                        />
                                                        <span>Download</span>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Vertical Separator */}
                <div className="h-8 w-px bg-gray-200 mx-2"></div>

                <div className="relative">
                    <button
                        className="flex items-center gap-1 py-2 px-3 rounded-full hover:bg-gray-50 transition-colors duration-200"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                            <img
                                src={userIcon}
                                alt="Profile"
                                className="w-8 h-8"
                            />
                        </div>
                        <span className="text-gray-700 font-medium font-satoshi">{userName}</span>
                        <MdKeyboardArrowDown
                            size={25}
                            className={`text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''
                                }`}
                        />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 top-14 w-40 bg-white rounded-lg shadow-lg py-1 z-50">
                            <button
                                onClick={handleChangePassword}
                                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100"
                            >
                                Change Password
                            </button>
                            {/* <Button
                                variant="light"
                                onClick={handleLogout}
                                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                            >
                                Logout
                            </Button> */}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
export default Header;