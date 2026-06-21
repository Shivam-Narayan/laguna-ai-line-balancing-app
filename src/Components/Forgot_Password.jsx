import React, { useState } from 'react';
import { Form, Button } from "react-bootstrap";
import LoginHeader from '../Shared_Components/Login_Header';
import { IoIosArrowRoundBack, IoMdEyeOff, IoMdEye } from "react-icons/io";
import LoginFooter from '../Shared_Components/Login_Footer';
import Success from '../assets/Success.svg'
import { useNavigate } from 'react-router-dom';
import API from '../API/api';
import BGImage from '../assets/Login_BG.png';
import formBG from '../assets/Form_BG.png';

const ForgotPassword = ({ onBack }) => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isResetSuccessful, setIsResetSuccessful] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState('');

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

    const validateConfirmPassword = (value) => {
        // Check for leading/trailing spaces
        if (value !== value.trim()) {
            setConfirmPasswordError('Password cannot have leading or trailing spaces.');
            return false;
        }
        setConfirmPasswordError('');

        if (!value) {
            setConfirmPasswordError('Please confirm your password.');
            return false;
        }

        if (value !== password) {
            setConfirmPasswordError('Passwords do not match.');
            return false;
        }

        return true;
    };


    const handlePasswordChange = (e) => {
        const value = e.target.value;
        setPassword(value);
        validatePassword(value);

        if (confirmPassword) {
            validateConfirmPassword(confirmPassword);
        }
    };

    const handleConfirmPasswordChange = (e) => {
        const value = e.target.value;
        setConfirmPassword(value);
        validateConfirmPassword(value);
    };


    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };


    const handleSubmitPassword = async (e) => {
        e.preventDefault();
        setApiError('');
        setIsLoading(true);

        try {
            const isPasswordValid = validatePassword(password);
            const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

            if (!isPasswordValid || !isConfirmPasswordValid) {
                setIsLoading(false);
                return;
            }

            const token = new URLSearchParams(window.location.search).get('token');

            if (!token) {
                throw new Error('Reset token not found');
            }

            const requestData = {
                token: token,
                new_password: password,
                confirm_password: confirmPassword
            };

            await API.forgotPassword(requestData);
            setIsResetSuccessful(true);

            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (error) {
            setApiError(
                error.response?.data?.message ||
                error.message ||
                'An error occurred while resetting your password. Please try again.'
            );
            setIsResetSuccessful(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToLogin = () => {
        navigate('/login');
    };
    // Check if form is valid
    const isFormValid = () => {
        return !passwordError &&
            !confirmPasswordError &&
            password.trim() !== '' &&
            confirmPassword.trim() !== '' &&
            !isLoading;
    };

    const inputClasses = `w-full px-3 py-2 border-2 rounded-md
    bg-[#0000001A] !important`;

    // const inputClasses = `w-full px-3 py-2 border-2 rounded-md 
    // focus:ring-1 focus:ring-[#171717] focus:border-transparent  
    // disabled:bg-gray-50 disabled:cursor-not-allowed
    // ${passwordError ? 'border-red-100 focus:ring-red-500' : ''}`;

    return (
        <div className="h-screen w-screen overflow-hidden relative">
            <style>
                {`
            @keyframes zoomInEffect {
            from { transform: scale(1); }
            to { transform: scale(1.50); }
            }
        `}
            </style>
            {/* Animated background div */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: `url(${BGImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    animation: 'zoomInEffect 10s ease-out forwards',
                    zIndex: 0
                }}
            />

            {/* Content container */}
            <div className="relative z-10 h-full flex flex-col">
                {/* <div className="w-full items-center px-6">
                    <LoginHeader />
                </div> */}
                <div className="w-full flex items-center justify-end pr-56 pb-40 pt-40">
                    <div className="w-full max-w-sm px-6 py-6 backdrop-blur-[100px] rounded-lg border-2 border-[#FFFFFF]/[0.1]"
                        style={{
                            backgroundImage: `url(${formBG})`,
                            // backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                        }}>
                        <LoginHeader />
                        {!isResetSuccessful ? (
                            <><h2 className="font-satoshi text-2xl font-bold mb-1 text-start text-white">Set new password</h2>
                                <h6 className="font-satoshi text-lg/2 font-normal text-start mb-4 text-[#FFFFFF]/[0.6]">
                                    Must be at least 8 character
                                </h6>
                                {apiError && (
                                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">
                                        {apiError}
                                    </div>
                                )}
                                <Form onSubmit={handleSubmitPassword}>

                                    <Form.Group className="mb-4">
                                        <div className='relative'>
                                            <Form.Control
                                                type={showPassword ? "text" : "password"}
                                                placeholder="New Password"
                                                value={password}
                                                onChange={handlePasswordChange}
                                                className={inputClasses}
                                                style={{
                                                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                                    color: 'white',  // This ensures the text is white
                                                    borderColor: 'rgba(255, 255, 255, 0.4)'
                                                  }}
                                                disabled={isLoading}
                                                required />
                                            <button
                                                type="button"
                                                onClick={togglePasswordVisibility}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white"
                                                style={{ zIndex: 2 }}
                                                disabled={isLoading}
                                            >
                                                {showPassword ? <IoMdEye size={20} /> : <IoMdEyeOff size={20} />}
                                            </button>
                                        </div>
                                        <Form.Control.Feedback type="invalid" style={{ display: passwordError ? 'block' : 'none', color: 'white' }}>
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
                                                style={{
                                                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                                    color: 'white',  // This ensures the text is white
                                                    borderColor: 'rgba(255, 255, 255, 0.4)'
                                                  }}
                                                disabled={isLoading}
                                                required />
                                            <button
                                                type="button"
                                                onClick={toggleConfirmPasswordVisibility}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white"
                                                style={{ zIndex: 2 }}
                                                disabled={isLoading}
                                            >
                                                {showConfirmPassword ? <IoMdEye size={20} /> : <IoMdEyeOff size={20} />}
                                            </button>
                                        </div>
                                        <Form.Control.Feedback type="invalid" style={{ display: confirmPasswordError ? 'block' : 'none', color: 'white' }}>
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
                                        className="w-full font-satoshi text-base font-semibold"
                                        disabled={!isFormValid()}
                                    >
                                        {isLoading ? 'Resetting Password...' : 'Reset Password'}
                                        {/* Reset Password */}
                                    </Button>
                                    <div className='flex justify-center mt-3'>
                                        <Button
                                            variant="link"
                                            onClick={handleBackToLogin}
                                            className="text-base font-medium text-[#286DB2] font-satoshi p-0 d-flex align-items-center justify-content-center hover:underline focus:outline-none"
                                        >
                                            <IoIosArrowRoundBack size={20} />
                                            Back to Login
                                        </Button>
                                    </div>
                                    <LoginFooter />
                                </Form>
                                </>
                        ) : (
                            <>
                                <div className="w-full flex justify-center pb-3">
                                    <img
                                        src={Success}
                                        className='w-10 h-10 object-contain' />
                                </div>
                                <h2 className="font-satoshi text-2xl font-bold text-start mb-1 text-white">
                                    Your password has been successfully reset.
                                </h2>
                                <h6 className="font-satoshi text-xl font-normal text-start mb-8 text-[#FFFFFF]/[0.6]">
                                    Please login using the new password
                                </h6>
                                <div className='flex justify-center mt-3'>
                                    <Button
                                        variant="link"
                                        onClick={onBack}
                                        className="text-base font-medium text-[#286DB2] font-satoshi p-0 d-flex align-items-center justify-content-center hover:text-[#286DB2] focus:outline-none"
                                    >
                                        <IoIosArrowRoundBack size={20} />
                                        Back to Login
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                {/* <div className="w-full flex justify-center absolute bottom-2">
                    <LoginFooter />
                </div> */}
            </div>
        </div>
    );
};

export default ForgotPassword;