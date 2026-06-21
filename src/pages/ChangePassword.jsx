import React, { useState } from 'react';
import { Form, Button } from "react-bootstrap";
import { IoMdEyeOff, IoMdEye } from "react-icons/io";
import Success from '../assets/Success.svg'
import Header from '../components/shared/Header';
import Sidenav from '../components/shared/Sidenav';
import API from '../api/api';

const ChangePassword = () => {
    const [oldPassword, setOldPassword] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [oldPasswordError, setOldPasswordError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isResetSuccessful, setIsResetSuccessful] = useState(false);

    const validateOldPassword = (value) => {
        const trimmedPassword = value.trim();
        setOldPasswordError('');

        if (!trimmedPassword) {
            setOldPasswordError('Current password is required.');
            return false;
        }

        return true;
    };

    const validatePassword = (value) => {
        // Check for leading/trailing spaces
        if (value !== value.trim()) {
            setPasswordError('Password cannot have leading or trailing spaces.');
            return false;
        }

        const trimmedPassword = value.trim();
        setPasswordError('');

        if (!trimmedPassword) {
            setPasswordError('Password is required.');
            return false;
        }

        if (trimmedPassword.length < 8 || trimmedPassword.length > 50) {
            setPasswordError('Password must be between 8 and 50 characters.');
            return false;
        }

        if (/\s/.test(trimmedPassword)) {
            setPasswordError('Password cannot contain spaces.');
            return false;
        }

        const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%&*])[A-Za-z\d@#$%&*]+$/;
        if (!complexityRegex.test(trimmedPassword)) {
            setPasswordError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
            return false;
        }

        return true;
    };

    const validateConfirmPassword = (newPassword, confirmValue = confirmPassword) => {
        const valueToValidate = confirmValue || confirmPassword;

        // Check for leading/trailing spaces
        if (valueToValidate !== valueToValidate.trim()) {
            setConfirmPasswordError('Password cannot have leading or trailing spaces.');
            return false;
        }
        setConfirmPasswordError('');

        if (!valueToValidate) {
            setConfirmPasswordError('Please confirm your password.');
            return false;
        }

        if (valueToValidate !== newPassword) {
            setConfirmPasswordError('Passwords do not match.');
            return false;
        }

        return true;
    };

    const handleOldPasswordChange = (e) => {
        const value = e.target.value;
        setOldPassword(value);
        validateOldPassword(value);
    };

    const handlePasswordChange = (e) => {
        const value = e.target.value;
        setPassword(value);
        validatePassword(value);

        if (confirmPassword) {
            validateConfirmPassword(value);
        }
    };

    const handleConfirmPasswordChange = (e) => {
        const value = e.target.value;
        setConfirmPassword(value);
        validateConfirmPassword(password, value);
    };

    const toggleOldPasswordVisibility = () => {
        setShowOldPassword(!showOldPassword);
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const handleSubmitPassword = async (e) => {
        e.preventDefault();
    
        const isOldPasswordValid = validateOldPassword(oldPassword);
        const isPasswordValid = validatePassword(password);
        const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);
    
        if (isOldPasswordValid && isPasswordValid && isConfirmPasswordValid) {
            try {
                const response = await API.changePassword({
                    current_password: oldPassword,
                    new_password: password,
                    confirm_password: confirmPassword
                });
    
                if (response.data.status === 'success') {
                    setIsResetSuccessful(true);
                } else {
                    // Handle any error messages from the API
                    setOldPasswordError(response.data.message || 'Password change failed');
                }
            } catch (error) {
                console.error('Error changing password:', error);
                // Handle different types of errors
                if (error.response?.data?.message) {
                    // API error with message
                    setOldPasswordError(error.response.data.message);
                } else if (error.response?.status === 401) {
                    // Unauthorized - current password is wrong
                    setOldPasswordError('Current password is incorrect');
                } else if (error.response?.status === 400) {
                    // Unauthorized - current password is wrong
                    if (error.response?.data?.error === 'New password must be different from the previous passwords') {
                        setPasswordError('New password must be different from the previous passwords');
                        setOldPasswordError('');
                    } else {
                        // Case where current password is incorrect
                        setOldPasswordError('Current password is incorrect');
                        setPasswordError('');
                    }
                } else {
                    // Generic error
                    setOldPasswordError('Failed to change password. Please try again.');
                }
            }
        }
    };

   
    // Check if form is valid
    const isFormValid = () => {
        return !oldPasswordError && !passwordError && !confirmPasswordError && oldPassword.trim() !== '' && password.trim() !== '' && confirmPassword.trim() !== '';
    };

    const inputClasses = `w-full px-3 py-2 border-2 rounded-md 
    focus:ring-1 focus:ring-[#171717] focus:border-transparent  
    disabled:bg-gray-50 disabled:cursor-not-allowed
    ${passwordError ? 'border-red-100 focus:ring-red-500' : ''}`;

    return (
        <div className="min-h-screen w-screen flex overflow-hidden">
            
            <Sidenav />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)]">
                    {/* <div className="w-full flex items-center justify-center"> */}
                        <div className="w-full max-w-lg px-6 pb-20">
                            {!isResetSuccessful ? (
                                <><h2 className="font-satoshi text-2xl font-bold mb-1 text-center">Change password</h2>
                                    <h6 className="font-satoshi text-lg/6 font-normal text-center mb-8 text-[#747474]">
                                        Must be at least 8 character
                                    </h6>
                                    <Form onSubmit={handleSubmitPassword}>
                                        <Form.Group className="mb-4">
                                                        <div className='relative'>
                                                            <Form.Control
                                                                type={showOldPassword ? "text" : "password"}
                                                                placeholder="Current Password"
                                                                value={oldPassword}
                                                                onChange={handleOldPasswordChange}
                                                                className={inputClasses}
                                                                required />
                                                            <button
                                                                type="button"
                                                                onClick={toggleOldPasswordVisibility}
                                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600"
                                                                style={{ zIndex: 2 }}
                                                            >
                                                                {showOldPassword ? <IoMdEye size={20} /> : <IoMdEyeOff size={20} />}
                                                            </button>
                                                        </div>
                                                        <Form.Control.Feedback type="invalid" style={{ display: oldPasswordError ? 'block' : 'none' }}>
                                                            {oldPasswordError}
                                                        </Form.Control.Feedback>
                                                    </Form.Group>

                                        <Form.Group className="mb-4">
                                            <div className='relative'>
                                                <Form.Control
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="New Password"
                                                    value={password}
                                                    onChange={handlePasswordChange}
                                                    className={inputClasses}
                                                    required />
                                                <button
                                                    type="button"
                                                    onClick={togglePasswordVisibility}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600"
                                                    style={{ zIndex: 2 }}
                                                >
                                                    {showPassword ? <IoMdEye size={20} /> : <IoMdEyeOff size={20} />}
                                                </button>
                                            </div>
                                            <Form.Control.Feedback type="invalid" style={{ display: passwordError ? 'block' : 'none' }}>
                                                {passwordError}
                                            </Form.Control.Feedback>
                                        </Form.Group>

                                        <Form.Group className="mb-4">
                                            <div className='relative'>
                                                <Form.Control
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="Confirm Password"
                                                    value={confirmPassword}
                                                    onChange={handleConfirmPasswordChange}
                                                    className={inputClasses}
                                                    required />
                                                <button
                                                    type="button"
                                                    onClick={toggleConfirmPasswordVisibility}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600"
                                                    style={{ zIndex: 2 }}
                                                >
                                                    {showConfirmPassword ? <IoMdEye size={20} /> : <IoMdEyeOff size={20} />}
                                                </button>
                                            </div>
                                            <Form.Control.Feedback type="invalid" style={{ display: confirmPasswordError ? 'block' : 'none' }}>
                                                {confirmPasswordError}
                                            </Form.Control.Feedback>
                                        </Form.Group>

                                        <Button
                                            variant="primary"
                                            type="submit"
                                            style={{
                                                backgroundColor: isFormValid() ? '#286DB2' : '#E6E6E6',
                                                borderColor: isFormValid() ? '#286DB2' : '#E6E6E6',
                                                color: isFormValid() ? '#FFFFFF' : '#171717'
                                            }}
                                            className="w-full font-satoshi text-xl font-bold"
                                            disabled={!isFormValid()}
                                        >
                                            Change Password
                                        </Button>
                                    </Form></>
                            ) : (
                                <>
                                    <div className="w-full flex justify-center pb-3">
                                        <img
                                            src={Success}
                                            className='w-10 h-10 object-contain' />
                                    </div>
                                    <h2 className="font-satoshi text-2xl font-bold text-center mb-1">
                                        Your password has been successfully changed.
                                    </h2>
                                    {/* <h6 className="font-satoshi text-xl font-normal text-center mb-8 text-[#747474]">
                                        Please login using the new password
                                    </h6> */}
                                </>
                            )}
                        </div>
                    {/* </div> */}
                </main>
            </div>
        </div>
    )
};

export default ChangePassword;