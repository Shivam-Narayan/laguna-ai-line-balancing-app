import React, { useState } from 'react';
import { Form, Button } from "react-bootstrap";
import LoginHeader from '../Shared_Components/Login_Header';
import LoginFooter from '../Shared_Components/Login_Footer';
import { IoIosArrowRoundBack } from "react-icons/io";
import Success from '../assets/Success.svg';
import { useNavigate } from 'react-router-dom';
import API from '../API/api';
import BGImage from '../assets/Login_BG.png';
import formBG from '../assets/Form_BG.png';

const EmailRecovery = ({ onBack }) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [messageSent, setMessageSent] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiError, setApiError] = useState('');

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
        setApiError('');
    };

    const handleForgotPasswordSubmit = async (e) => {
        e.preventDefault();
        const isEmailValid = validateEmail(email);

        if (isEmailValid) {
            setIsSubmitting(true);
            setApiError('');

            try {
                const response = await API.emailRecovery({ email: email.trim() });
                console.log('Password reset requested for:', email);
                setMessageSent(true);
            } catch (error) {
                console.error('Error requesting password reset:', error);
                setApiError(
                    error.response?.data?.message ||
                    'Failed to send reset link. Please try again later.'
                );
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleBackToLogin = () => {
        navigate('/login');
    };


    // Check if form is valid
    const isFormValid = () => {
        return !emailError && email.trim() !== '';
    };

    const inputClasses = `w-full px-3 py-2 border-2 rounded-md
    bg-[#0000001A] !important`;

    // const inputClasses = `w-full px-3 py-2 border-2 rounded-md bg-[#0000001A] 
    // focus:ring-1 focus:ring-[#171717] focus:border-transparent  
    // disabled:bg-gray-50 disabled:cursor-not-allowed
    // ${emailError ? 'border-red-100 focus:ring-red-500' : ''}`;

    return (
        <div className="h-screen w-screen overflow-hidden relative">
            <style>
          {`
            @keyframes zoomInEffect {
            from { transform: scale(1); }
            to { transform: scale(1.50); }
            }
        ` }
            </style>

            <div className="absolute inset-0"
                style={{
                    backgroundImage: `url(${BGImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    animation: 'zoomInEffect 10s ease-out forwards',
                    zIndex: 0,
                }}
            />
            <div className="relative z-10 h-full flex flex-col">
                {/* <div className="w-full items-center px-6">
                    <LoginHeader />
                </div> */}
                <div className="w-full flex items-center justify-end pr-56 pt-40">
                    <div className="w-full max-w-sm px-6 py-6 backdrop-blur-[100px] rounded-lg border-2 border-[#FFFFFF]/[0.1]"
                    style={{
                        backgroundImage: `url(${formBG})`,
                        // backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                      }}>
                        <LoginHeader />
                        {messageSent ? (
                            <>
                                <div className="w-full flex justify-center pb-3">
                                    <img
                                        src={Success}
                                        className='w-10 h-10 object-contain' />
                                </div>
                                <h2 className="font-satoshi text-2xl font-bold text-start mb-1 text-white">
                                    Your password reset link has been sent to your email.
                                </h2>
                                <h6 className="font-satoshi text-xl font-normal text-start mb-4 text-[#FFFFFF]/[0.6]">
                                    Check your email for the reset link
                                </h6>
                            </>
                        ) : (
                            <>
                                <h2 className="font-satoshi text-2xl font-bold mb-1 text-start text-white">Forgot Password?</h2>
                                <h6 className="font-satoshi text-lg/2 font-normal text-start mb-4 text-[#FFFFFF]/[0.6]">
                                    Please enter your email for the password reset link
                                </h6>
                                <Form noValidate onSubmit={handleForgotPasswordSubmit} className="email-recovery-form">
                                    <Form.Group className="mb-4" controlId="formBasicEmail">
                                        <Form.Control
                                            type="email"
                                            placeholder="Email address"
                                            value={email}
                                            onChange={handleEmailChange}
                                            isInvalid={!!emailError || !!apiError}
                                            isValid={email.length > 0 && !emailError && !apiError}
                                            className={inputClasses}
                                            style={{
                                                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                                color: 'white',  // This ensures the text is white
                                                borderColor: 'rgba(255, 255, 255, 0.4)'
                                              }}
                                            disabled={isSubmitting}
                                            required
                                        />
                                        <Form.Control.Feedback type="invalid" style={{ color: 'white' }}>
                                            {emailError || apiError}
                                        </Form.Control.Feedback>
                                        <Form.Control.Feedback type="valid" style={{ color: 'white' }}>
                                            Looks good!
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
                                        {isSubmitting ? 'Sending...' : 'Send'}
                                    </Button>
                                    <div className='flex justify-center mt-3'>
                                        <Button
                                            variant="link"
                                            onClick={handleBackToLogin}
                                            className="text-base font-medium text-[#286DB2] font-satoshi p-0 d-flex align-items-center justify-content-center hover:text-[#286DB2] focus:outline-none"
                                        >
                                            <IoIosArrowRoundBack size={20} />
                                            Back to Login
                                        </Button>
                                    </div>
                                    <LoginFooter />
                                </Form>
                            </>
                        )}
                    </div>
                </div>
                {/* <div className="w-full flex justify-center absolute bottom-6">
                    <LoginFooter />
                </div> */}
            </div>
        </div>
    );
};

export default EmailRecovery;
