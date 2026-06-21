import React, { useState, useEffect, useRef } from 'react';
import Header from '../Shared_Components/Header';
import Sidenav from '../Shared_Components/Sidenav';
import { FaPlus } from "react-icons/fa6";
import { Table, Button, Form, Modal, Toast } from 'react-bootstrap';
import { IoMdEyeOff, IoMdEye } from 'react-icons/io';
import { IoClose } from "react-icons/io5";
import API from '../API/api';
import { useUser } from '../Context/UserContext';

import EditIcon from '../assets/edit.svg';
import DeleteIcon from '../assets/delete.svg';
import GreenDot from '../assets/Green.svg';
import RedDot from '../assets/Red.svg';
import uploadIcon from '../assets/upload_calendar.svg';

const AdminDashboard = () => {
    const { userName } = useUser();
    const [show, setShow] = useState('');
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [location, setLocation] = useState('');
    const [userType, setUserType] = useState('');
    const [department, setDepartment] = useState('');
    const [status, setStatus] = useState('');
    const [sendMail, setSendMail] = useState('');

    const [usernameError, setUsernameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [latitudeError, setLatitudeError] = useState('');
    const [longitudeError, setLongitudeError] = useState('');

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef(null);

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    // Username validation
    const validateUsername = (username) => {
        // Check if empty
        if (!username) {
            return "Username is required.";
        }

        // Check length
        if (username.length < 3 || username.length > 50) {
            return "Username must be between 3 and 50 characters.";
        }

        // Check for valid characters (letters, numbers, underscore, hyphen, period)
        const validUsernameRegex = /^[a-zA-Z0-9\s._-]+$/;
        if (!validUsernameRegex.test(username)) {
            return "Username can only contain letters, numbers, spaces, underscores, hyphens, or periods.";
        }

        return "";
    };

    // Username validation handler
    const handleUsernameChange = (e) => {
        const value = e.target.value;
        setUsername(value);
        const error = validateUsername(value);
        setUsernameError(error);
    };

    // Email validation
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
        const value = e.target.value;
        setEmail(value);
        validateEmail(value);
    };

    // Phone validation
    const validatePhone = (phone) => {
        if (!phone) {
            return "Phone number is required.";
        }

        const validPhoneRegex = /^\d{10}$/;
        if (!validPhoneRegex.test(phone)) {
            return "Phone number must be exactly 10 digits.";
        }

        return "";
    };

    // Phone validation handler
    const handlePhoneChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
        setPhone(value);
        const error = validatePhone(value);
        setPhoneError(error);
    };

    // Password validation
    const validatePassword = (value) => {
        // Check for leading/trailing spaces
        if (value !== value.trim()) {
            setPasswordError('Password cannot have leading or trailing spaces.');
            return false;
        }

        const trimmedPassword = value.trim();
        setPasswordError('');

        // Check if password is empty
        if (!trimmedPassword) {
            setPasswordError('Password is required.');
            return false;
        }

        // Check password length
        if (trimmedPassword.length < 8 || trimmedPassword.length > 50) {
            setPasswordError('Password must be between 8 and 50 characters.');
            return false;
        }

        // Check for spaces
        if (/\s/.test(trimmedPassword)) {
            setPasswordError('Password cannot contain spaces.');
            return false;
        }

        // Complexity rules
        const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%&*])[A-Za-z\d@#$%&*]+$/;
        if (!complexityRegex.test(trimmedPassword)) {
            setPasswordError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
            return false;
        }

        return true;
    };

    const handlePasswordChange = (e) => {
        const value = e.target.value;
        setPassword(value);
        validatePassword(value);
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleLatitudeChange = (e) => {
        const value = e.target.value;

        // Allow empty field initially for typing
        if (!value) {
            setLatitude(value);
            setLatitudeError('Latitude is required');
            return;
        }

        // Regex to match the pattern: Optional negative sign, digits, optional decimal point with up to 6 decimal places
        const coordinateRegex = /^-?\d*\.?\d{0,6}$/;

        // Additional check to prevent multiple decimal points
        if (value.split('.').length > 2) {
            return;
        }

        // Allow typing negative sign at the start
        if (value === '-') {
            setLatitude(value);
            setLatitudeError('Please enter a valid number');
            return;
        }

        // Check if value matches our pattern
        if (coordinateRegex.test(value)) {
            setLatitude(value);

            // Validate the numeric value
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
                if (numValue < -90 || numValue > 90) {
                    setLatitudeError('Latitude must be between -90 and 90 degrees');
                } else {
                    setLatitudeError('');
                }
            } else {
                setLatitudeError('Please enter a valid number');
            }
        }
    };

    const handleLongitudeChange = (e) => {
        const value = e.target.value;

        // Allow empty field initially for typing
        if (!value) {
            setLongitude(value);
            setLongitudeError('Longitude is required');
            return;
        }

        // Regex to match the pattern: Optional negative sign, digits, optional decimal point with up to 6 decimal places
        const coordinateRegex = /^-?\d*\.?\d{0,6}$/;

        // Additional check to prevent multiple decimal points
        if (value.split('.').length > 2) {
            return;
        }

        // Allow typing negative sign at the start
        if (value === '-') {
            setLongitude(value);
            setLongitudeError('Please enter a valid number');
            return;
        }

        // Check if value matches our pattern
        if (coordinateRegex.test(value)) {
            setLongitude(value);

            // Validate the numeric value
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
                if (numValue < -180 || numValue > 180) {
                    setLongitudeError('Longitude must be between -180 and 180 degrees');
                } else {
                    setLongitudeError('');
                }
            } else {
                setLongitudeError('Please enter a valid number');
            }
        }
    };

    const fetchUsers = async () => {
        setLoading(true); // Start loading
        setError(null);   // Reset error state

        try {
            const response = await API.getUsers();
            const usersData = response.data?.data || response.data || [];
            setUsers(Array.isArray(usersData) ? usersData : []);
        } catch (err) {
            setError('Failed to fetch users.');
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false); // End loading
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);


    const handleSubmit = async (e) => {
        e.preventDefault();

        const phoneError = validatePhone(phone);
        setPhoneError(phoneError);

        if (phoneError || !isFormValid()) return;

        setIsSubmitting(true);
        // setSubmitError('');

        try {
            const userData = {
                username,
                email,
                phonenumber: phone,
                location,
                user_type: userType === "admin" ? 1 : 0,
                department,
                status: status.toLowerCase() === 'active',
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                send_mail: sendMail === 'True' ? true : false
            };

            if (password || !isEditMode) {
                userData.password = password;
            }

            let response;
            if (isEditMode) {
                response = await API.updateUser(selectedUser.id, userData);
            } else {
                response = await API.createUser(userData);
            }

            if (response.data) {
                handleModalClose();
                await fetchUsers();
                setToastMessage(isEditMode ? 'User updated successfully!' : 'User created successfully!');
                setToastType('success');
                setShowToast(true);
            } else {
                throw new Error(`Invalid response format from ${isEditMode ? 'update' : 'create'}`);
            }
        } catch (error) {
            console.error('Error saving user:', error);
            const errorMsg = error.response?.data?.message ||
                error.message ||
                `Failed to ${isEditMode ? 'update' : 'create'} user. Please try again.`;
            // setSubmitError(errorMsg);
            setToastMessage(errorMsg);
            setToastType('error');
            setShowToast(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset form function
    const resetForm = () => {
        setUsername('');
        setEmail('');
        setPhone('');
        setPassword('');
        setLocation('');
        setUserType('');
        setDepartment('');
        setStatus('');
        setLatitude('');
        setLongitude('');
        setSendMail('');

        // Reset error states
        setUsernameError('');
        setEmailError('');
        setPhoneError('');
        setPasswordError('');
        setLatitudeError('');
        setLongitudeError('');
        // setSubmitError('');

        // Reset other states
        setSelectedUser(null);
        setIsEditMode(false);
        setIsSubmitting(false);
        setShowPassword(false);
    };

    // Handle modal close
    const handleModalClose = () => {
        resetForm();
        handleClose();
    };

    const handleEdit = async (user) => {
        try {
            setIsEditMode(true);
            setSelectedUser(user);

            // Basic user data setup
            setUsername(user.username || '');
            setEmail(user.email || '');
            setPhone(user.phonenumber || '');
            setLocation(user.location || '');
            setDepartment(user.department || '');
            setStatus(user.status ? 'Active' : 'Inactive');
            // setUserType("user");
            setUserType(user.user_type === 1 ? "admin" : "user");
            setSendMail(user.send_mail ? 'True' : 'False');

            setLatitude(user.latitude?.toString() || '');
            setLongitude(user.longitude?.toString() || '');

            setPassword('');
            handleShow();

            // Fetch additional details
            setIsSubmitting(true);
            try {
                const response = await API.getUserDetails(user.id);

                if (response.data && response.data.data) {
                    const userDetails = response.data.data;

                    setUsername(userDetails.username || user.username || '');
                    setEmail(userDetails.email || user.email || '');
                    setPhone(userDetails.phonenumber || user.phonenumber || '');
                    setLocation(userDetails.location || user.location || '');
                    setDepartment(userDetails.department || user.department || '');
                    setStatus(userDetails.status ? 'Active' : 'Inactive');
                    // setUserType("user");
                    setUserType(userDetails.user_type === 1 ? "admin" : "user");
                    setSendMail(userDetails.send_mail ? 'True' : 'False');

                    if (userDetails.latitude !== undefined) {
                        setLatitude(userDetails.latitude.toString());
                    }
                    if (userDetails.longitude !== undefined) {
                        setLongitude(userDetails.longitude.toString());
                    }
                }
            } catch (error) {
                setToastMessage('Failed to fetch user details');
                setToastType('error');
                setShowToast(true);
            } finally {
                setIsSubmitting(false);
            }
        } catch (error) {
            setToastMessage('Failed to load user for editing');
            setToastType('error');
            setShowToast(true);
        }
    };

    // Handle delete click
    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setShowDeleteModal(true);
    };

    // Delete confirmation
    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;

        setIsDeleting(true);
        try {
            await API.deleteUser(userToDelete.id);
            setShowDeleteModal(false);
            setUserToDelete(null);
            // Fetch fresh data after successful deletion
            await fetchUsers();
            setToastMessage('User deleted successfully!');
            setToastType('success');
            setShowToast(true);
        } catch (error) {
            console.error('Error deleting user:', error);
            const errorMsg = error.response?.data?.message || 'Failed to delete user. Please try again.';
            setToastMessage(errorMsg);
            setToastType('error');
            setShowToast(true);
        } finally {
            setIsDeleting(false);
        }
    };

    // Handle file selection
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Accept both CSV and XLSX formats
            if (file.type === 'text/csv' ||
                file.name.endsWith('.csv') ||
                file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                file.name.endsWith('.xlsx')) {

                setSelectedFile(file);
                handleFileUpload(file);
            } else {
                setUploadError('Please select a CSV or Excel file');
                setToastMessage('Please select a CSV or Excel file');
                setToastType('error');
                setShowToast(true);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        }
    };


    // Handle file upload
    const handleFileUpload = async (file) => {
        setIsUploading(true);
        setUploadError('');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await API.uploadHolidayCalendar(formData);

            if (response && response.data) {
                // Success - make sure we're checking the right property
                setToastMessage('File uploaded successfully!');
                setToastType('success');
                setShowToast(true);

                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                setSelectedFile(null);
            }
        } catch (error) {
            console.error('Upload error:', error);
            setToastMessage('File not uploaded!');
            setToastType('error');
            setShowToast(true);
        } finally {
            setIsUploading(false);
        }
    };

    // Trigger file input click
    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            // Add a small delay before clicking to ensure the reset takes effect
            setTimeout(() => {
                fileInputRef.current.click();
            }, 10);
        }
    };

    // Check if form is valid
    const isFormValid = () => {
        return (
            username?.trim() !== '' &&
            !usernameError &&
            email?.trim() !== '' &&
            !emailError &&
            phone?.trim() !== '' &&
            !phoneError &&
            ((!isEditMode && password?.trim() !== '') || isEditMode) &&
            !passwordError &&
            latitude?.trim() !== '' &&
            !latitudeError &&
            longitude?.trim() !== '' &&
            !longitudeError &&
            location !== '' &&
            userType !== '' &&
            department !== '' &&
            status !== '' &&
            sendMail !== ''
        );
    };

    const inputClasses = `w-full px-3 py-2 border-2 rounded-md 
    focus:ring-1 focus:ring-[#171717] focus:border-transparent  
    disabled:bg-gray-50 disabled:cursor-not-allowed`;

    const getInputClassesWithValidation = (error) => `${inputClasses} 
        ${error ? 'border-red-100 focus:ring-red-500' : ''}`;

    return (
        <div className="h-screen w-screen flex overflow-hidden">
            <Sidenav />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 px-4 py-2 overflow-y-auto">
                    <div className="flex justify-between items-center mb-3">
                        <div>
                            <h2 className="font-satoshi text-2xl font-semibold">Good Morning, {userName}</h2>
                            <h6 className="font-satoshi text-base font-normal">
                                Your dashboard is ready with updated Information
                            </h6>
                        </div>
                        <div className="flex space-x-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept=".csv,.xlsx"
                                className="hidden"
                            />
                            <Button
                                variant="outline-primary"
                                className={` bg-[#FFFFFF] border-[#286DB2] text-[#286DB2] flex items-center hover:bg-[#FFFFFF] hover:border-[#286DB2] hover:text-[#286DB2] ${isUploading ? 'opacity-75' : ''
                                    }`}
                                onClick={triggerFileInput}
                                disabled={isUploading}
                            >
                                {/* <MdOutlineFileUpload className="mr-1.5" size={20} /> */}
                                <img
                                    src={uploadIcon}
                                    alt="upload"
                                    className="mr-1.5 w-5 h-5"
                                />
                                <span className="font-satoshi text-base font-medium">
                                    {isUploading ? 'Uploading...' : 'Upload Calendar'}
                                </span>
                            </Button>
                            <Button
                                variant="primary"
                                className="font-satoshi bg-[#286DB2] border-[#286DB2] flex items-center hover:bg-[#286DB2] hover:border-[#286DB2]"
                                onClick={handleShow}
                            >
                                <FaPlus className='mr-1.5' />
                                <span className="font-satoshi text-base font-medium">
                                    Add User
                                </span>
                            </Button>
                        </div>
                    </div>

                    <Modal
                        show={show}
                        onHide={() => { handleModalClose(); setIsEditMode(false) }}
                        aria-labelledby="add-user-modal"
                        className="font-satoshi !absolute !right-0 !left-auto !w-96 !my-0 !h-full"
                    >
                        <div className="h-full flex flex-col">
                            <Modal.Header className="p-4 border-b sticky top-0 bg-white z-10">
                                <Modal.Title id="add-user-modal" className="font-satoshi text-xl font-semibold">
                                    {isEditMode ? 'Edit User' : 'Add New User'}
                                </Modal.Title>
                                <Button
                                    variant="link"
                                    onClick={handleModalClose}
                                    className="text-gray-500 hover:text-gray-700 absolute right-4 top-4 p-0"
                                >
                                    <IoClose className="w-6 h-6" />
                                </Button>
                            </Modal.Header>

                            <div className="flex-1 overflow-y-auto">
                                <Modal.Body className="p-3">
                                    {isSubmitting && (
                                        <div className="flex justify-center items-center h-full">
                                            <div className="text-center font-satoshi">
                                                <div className="spinner-border text-primary" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                                <p className="mt-2">Loading user details...</p>
                                            </div>
                                        </div>
                                    )}
                                    <Form onSubmit={handleSubmit} autoComplete="off" className="h-full flex flex-col">
                                        <div className="flex-1 overflow-y-auto flex flex-col items-center">
                                            <div className="w-[90%] space-y-3">
                                                <Form.Group className="mb-3" controlId="formUsername">
                                                    <Form.Control
                                                        type="text"
                                                        placeholder="Username"
                                                        value={username}
                                                        onChange={handleUsernameChange}
                                                        isInvalid={!!usernameError}
                                                        className={getInputClassesWithValidation(usernameError)}
                                                        autoComplete="new-username"
                                                        disabled={isEditMode}
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {usernameError}
                                                    </Form.Control.Feedback>
                                                </Form.Group>

                                                <Form.Group className="mb-3" controlId="formEmail">
                                                    <Form.Control
                                                        type="email"
                                                        placeholder="Email"
                                                        value={email || ''}
                                                        onChange={handleEmailChange}
                                                        isInvalid={!!emailError}
                                                        isValid={email && email?.length > 0 && !emailError}
                                                        className={getInputClassesWithValidation(emailError)}
                                                        autoComplete="new-email"
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {emailError}
                                                    </Form.Control.Feedback>
                                                    {/* <Form.Control.Feedback type="valid">
                                                    Looks good!
                                                </Form.Control.Feedback> */}
                                                </Form.Group>

                                                <Form.Group className="mb-3" controlId="formPhone">
                                                    <Form.Control
                                                        type="tel"
                                                        placeholder="Phone"
                                                        value={phone}
                                                        maxLength={10}
                                                        onChange={handlePhoneChange}
                                                        isInvalid={!!phoneError}
                                                        className={getInputClassesWithValidation(phoneError)}
                                                        autoComplete="new-phone"
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {phoneError}
                                                    </Form.Control.Feedback>
                                                </Form.Group>

                                                {!isEditMode && (
                                                    <Form.Group className="mb-3" controlId="formPassword">
                                                        <div className="relative">
                                                            <Form.Control
                                                                type={showPassword ? "text" : "password"}
                                                                placeholder="Password"
                                                                value={password}
                                                                onChange={handlePasswordChange}
                                                                className={getInputClassesWithValidation(passwordError)}
                                                                autoComplete="new-password"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={togglePasswordVisibility}
                                                                className="absolute right-3 top-6 transform -translate-y-1/2 text-gray-600"
                                                                style={{ zIndex: 2 }}
                                                            >
                                                                {showPassword ? <IoMdEye size={20} /> : <IoMdEyeOff size={20} />}
                                                            </button>
                                                        </div>
                                                        <Form.Control.Feedback type="invalid" style={{ display: passwordError ? 'block' : 'none' }}>
                                                            {passwordError}
                                                        </Form.Control.Feedback>
                                                    </Form.Group>
                                                )}

                                                <Form.Group className="mb-3" controlId="formLatitude">
                                                    <Form.Control
                                                        type="text"
                                                        placeholder="Latitude (e.g., 12.971234)"
                                                        value={latitude}
                                                        onChange={handleLatitudeChange}
                                                        isInvalid={!!latitudeError}
                                                        className={getInputClassesWithValidation(latitudeError)}
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {latitudeError}
                                                    </Form.Control.Feedback>
                                                </Form.Group>

                                                <Form.Group className="mb-3" controlId="formLongitude">
                                                    <Form.Control
                                                        type="text"
                                                        placeholder="Longitude (e.g., 77.594563)"
                                                        value={longitude}
                                                        onChange={handleLongitudeChange}
                                                        isInvalid={!!longitudeError}
                                                        className={getInputClassesWithValidation(longitudeError)}
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {longitudeError}
                                                    </Form.Control.Feedback>
                                                </Form.Group>

                                                <Form.Group className="mb-3" controlId="formLocation">
                                                    <Form.Select
                                                        className={inputClasses}
                                                        value={location}
                                                        onChange={(e) => setLocation(e.target.value)}
                                                        autoComplete="off">
                                                        <option value="">Location</option>
                                                        <option value="Kanakapura">Kanakapura</option>
                                                        <option value="Doddaballapura">Doddaballapura</option>
                                                        <option value="Mysore">Mysore</option>
                                                        <option value="Bengaluru">Bengaluru</option>
                                                    </Form.Select>
                                                </Form.Group>

                                                <Form.Group className="mb-3" controlId="formUserType">
                                                    <Form.Select
                                                        className={inputClasses}
                                                        value={userType || ''}
                                                        onChange={(e) => setUserType(e.target.value)}
                                                        autoComplete="off">
                                                        <option value="">Select User Type</option>
                                                        <option value="admin">Admin</option>
                                                        <option value="user">User</option>
                                                    </Form.Select>
                                                </Form.Group>

                                                <Form.Group className="mb-3" controlId="formDepartment">
                                                    <Form.Select
                                                        className={inputClasses}
                                                        value={department}
                                                        onChange={(e) => setDepartment(e.target.value)}
                                                        autoComplete="off">
                                                        <option value="">Select Department</option>
                                                        <option value="HR Department">HR Department</option>
                                                        <option value="IE Department">IE Department</option>
                                                        <option value="IT Department">IT Department</option>
                                                    </Form.Select>
                                                </Form.Group>

                                                <Form.Group className="mb-3" controlId="formStatus">
                                                    <Form.Select
                                                        className={inputClasses}
                                                        value={status}
                                                        onChange={(e) => setStatus(e.target.value)}
                                                        autoComplete="off">
                                                        <option value="">Select Status</option>
                                                        <option value="Active">Active</option>
                                                        <option value="Inactive">Inactive</option>
                                                    </Form.Select>
                                                </Form.Group>

                                                <Form.Group className="mb-3" controlId="formSendMail">
                                                    <Form.Select
                                                        className={inputClasses}
                                                        value={sendMail}
                                                        onChange={(e) => setSendMail(e.target.value)}
                                                        autoComplete="off">
                                                        <option value="">Send Mail</option>
                                                        <option value="True">True</option>
                                                        <option value="False">False</option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </div>
                                        </div>
                                        {/* {submitError && (
                                            <div className="mt-2 text-red-500 text-sm">
                                                {submitError}
                                            </div>
                                        )} */}

                                        <div className="w-[90%] mx-auto pt-4 sticky bottom-0 bg-white">
                                            <Button
                                                variant="primary"
                                                type="submit"
                                                style={{
                                                    backgroundColor: isFormValid() ? '#286DB2' : '#E6E6E6',
                                                    borderColor: isFormValid() ? '#286DB2' : '#E6E6E6',
                                                    color: isFormValid() ? '#FFFFFF' : '#171717'
                                                }}
                                                className="w-full font-satoshi text-xl"
                                                disabled={!isFormValid() || isSubmitting}
                                            >
                                                {isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update' : 'Add')}
                                            </Button>

                                            <Button
                                                variant="primary"
                                                type="button"
                                                className="w-full bg-[#FFFFFF] border-[#171717] hover:bg-[#FFFFFF] hover:border-[#171717] text-[#171717] hover:text-[#171717] mt-2"
                                                onClick={handleModalClose}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </Form>
                                </Modal.Body>
                            </div>
                        </div>
                    </Modal>

                    {/* Delete Confirmation Modal */}
                    <Modal
                        show={showDeleteModal}
                        onHide={() => setShowDeleteModal(false)}
                        className="font-satoshi !absolute !right-0 !left-auto !w-96 !my-0 !h-full"
                    >
                        <div className="h-full flex flex-col">
                            <Modal.Header className="p-4 border-b sticky top-0 bg-white z-10">
                                <Modal.Title className="font-satoshi text-xl font-semibold">Confirm Delete</Modal.Title>
                                <Button
                                    variant="link"
                                    onClick={() => setShowDeleteModal(false)}
                                    className="text-gray-500 hover:text-gray-700 absolute right-4 top-4 p-0"
                                >
                                    <IoClose className="w-6 h-6" />
                                </Button>
                            </Modal.Header>
                            <Modal.Body className="p-4 flex-1">
                                <p>Are you sure you want to delete this user?</p>
                                {userToDelete && (
                                    <p className="font-satoshi mt-2 text-gray-600">
                                        Username: {userToDelete.username}
                                    </p>
                                )}
                            </Modal.Body>
                            <Modal.Footer className="p-4 border-t sticky bottom-0 bg-white">
                                <div className="flex flex-col gap-2 w-full">
                                    <Button
                                        variant="primary"
                                        onClick={handleDeleteConfirm}
                                        disabled={isDeleting}
                                        className="font-satoshi w-full bg-[#286DB2] hover:bg-[#286DB2] text-white border-[#286DB2]"
                                    >
                                        {isDeleting ? 'Deleting...' : 'Delete'}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setShowDeleteModal(false)}
                                        className="w-full bg-[#FFFFFF] border-[#171717] hover:bg-[#FFFFFF] hover:border-[#171717] text-[#171717] hover:text-[#171717] mt-2"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </Modal.Footer>
                        </div>
                    </Modal>

                    {/* Toast Component */}
                    <Toast
                        show={showToast}
                        onClose={() => setShowToast(false)}
                        className="position-fixed top-0 end-0 m-4"
                        delay={5000}
                        autohide
                        style={{
                            backgroundColor: toastType === 'success' ? '#1CB65C' : '#F15A5B',
                            color: '#FFFFFF'
                        }}
                    >
                        <Toast.Header
                            closeButton
                        >
                            <strong className="me-auto">
                                {toastType === 'success' ? 'Success' : 'Error'}
                            </strong>
                        </Toast.Header>
                        <Toast.Body className="text-white">
                            {toastMessage}
                        </Toast.Body>
                    </Toast>

                    {/* Table Section */}
                    <div className="rounded-lg border border-[#E6E6E6] overflow-hidden">
                        <div className="bg-[#FAFAFA] p-4">
                            <h3 className="font-satoshi text-lg font-semibold">User Management</h3>
                        </div>
                        {loading ? (
                            <p className="font-satoshi p-4">Loading users...</p>
                        ) : error ? (
                            <p className="font-satoshi p-4 text-red-600">{error}</p>
                        ) : (
                            <Table bordered striped responsive className="m-0 rounded-lg table-striped">
                                <thead className="bg-[#F8F9FA]">
                                    <tr>
                                        <th className='font-satoshi text-base font-bold !text-[#747474]'>Username</th>
                                        <th className='font-satoshi text-base font-bold !text-[#747474]'>Email</th>
                                        <th className='font-satoshi text-base font-bold !text-[#747474]'>Phone</th>
                                        <th className='font-satoshi text-base font-bold !text-[#747474]'>Location</th>
                                        <th className='font-satoshi text-base font-bold !text-[#747474]'>Department</th>
                                        <th className='font-satoshi text-base font-bold !text-[#747474]'>Status</th>
                                        {/* <th className='font-satoshi text-base font-bold !text-[#747474]'>Staff</th> */}
                                        <th className='font-satoshi text-base font-bold !text-[#747474]'>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="font-satoshi">
                                    {users.length > 0 ? (
                                        users.map((user) => (
                                            <tr key={user.id}>
                                                <td>{user.username}</td>
                                                <td>{user.email}</td>
                                                <td>{user.phonenumber}</td>
                                                <td>{user.location || 'N/A'}</td>
                                                <td>{user.department || 'N/A'}</td>
                                                <td>
                                                    <span
                                                        className="inline-flex items-center gap-2 px-2 py-1 border rounded-md shadow-md bg-white"
                                                    >
                                                        <img
                                                            src={user.status ? GreenDot : RedDot}
                                                            alt={user.status ? 'Active Status' : 'Inactive Status'}
                                                            className="w-4 h-4"
                                                        />
                                                        {user.status ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                {/* <td>{user.staff ? 'Yes' : 'No'}</td> */}
                                                <td className="p-2">
                                                    <div className="flex items-center justify-start gap-2">
                                                        <button
                                                            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                                                            onClick={() => handleEdit(user)}
                                                        >
                                                            <img
                                                                src={EditIcon}
                                                                alt="Edit"
                                                                className="w-6 h-6"
                                                            />
                                                        </button>
                                                        <button
                                                            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                                                            onClick={() => handleDeleteClick(user)}
                                                        >
                                                            <img
                                                                src={DeleteIcon}
                                                                alt="Delete"
                                                                className="w-6 h-6"
                                                            />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="font-satoshi text-center">
                                                No users found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
export default AdminDashboard;