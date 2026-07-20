import React, { useState, useEffect } from 'react';
import { Form, Button, Toast } from 'react-bootstrap';
import EmailRecovery from './EmailRecovery';
import LoginHeader from '../components/shared/LoginHeader';
import { IoMdEyeOff, IoMdEye } from 'react-icons/io';
import LoginFooter from '../components/shared/LoginFooter';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import { useUser } from '../context/UserContext';
import BGImage from '../assets/Login_BG.png';
import formBG from '../assets/Form_BG.png';
import { useGoogleLogin } from '@react-oauth/google';

const LoginPage = () => {
  const { updateUserDetails } = useUser();
  const navigate = useNavigate();

  const [email, setEmail] = useState(() => localStorage.getItem('rememberedEmail') || '');
  const [password, setPassword] = useState(() => localStorage.getItem('rememberedPassword') || '');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('rememberedEmail'));

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

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

  const handleForgotPassword = () => {
    console.log('Forgot password clicked');
    // setShowForgotPassword(true);
    navigate('/email-recovery');
  };
  const handleBackToLogin = () => {
    setShowForgotPassword(false);
  };

  // Check if form is valid
  const isFormValid = () => {
    return !emailError && !passwordError && email.trim() !== '' && password.trim() !== '';
  };

  // const handleLogin = async (e) => {
  //   e.preventDefault();

  //   try {
  //     // Authenticate user with credentials
  //     const loginResponse = await API.login({ email, password });

  //     if (loginResponse.data.status === 'success') {
  //       // Store user information in localStorage after successful login
  //       localStorage.setItem('authToken', loginResponse.data.data.Authorization);
  //       localStorage.setItem('userType', loginResponse.data.data.user_details.user_type);
  //       localStorage.setItem('userEmail', loginResponse.data.data.user_details.email);

  //       const userType = loginResponse.data.data.user_details.user_type;

  //       // Check if browser supports geolocation
  //       console.log("navigator geo location", navigator.geolocation)
  //       if (!navigator.geolocation) {
  //         return;
  //       }

  //       // Get user's current location
  //       else {
  //         console.log("entered geo location")
  //       navigator.geolocation.getCurrentPosition(
  //         async (position) => {
  //           console.log("function called", position)
  //           try {
  //             // Prepare location data for validation
  //             console.log(position.coords.latitude, position.coords.longitude)
  //             const formData = new FormData();
  //             formData.append('latitude', position.coords.latitude);
  //             formData.append('longitude', position.coords.longitude);

  //             // Validate user's location
  //             console.log("from data 1", formData, API.validateLocation)
  //             const locationResponse = await API.validateLocation(formData);
  //             console.log("location response", locationResponse)
  //             //  console.log("form data", formData, validateLocation)
  //             // Check if location is valid and user is within geofence
  //             console.log(locationResponse.data.status === 'success', locationResponse.data.message.within_geofence)
  //             if (locationResponse.data.status === 'success' && 
  //                 locationResponse.data.message.within_geofence === true) {

  //               // Navigate based on user type
  //               console.log("user type", userType)
  //               if (userType === 0) {
  //                 navigate('/user-dashboard');      // Regular user dashboard
  //               } else if (userType === 1) {
  //                 navigate('/admin-dashboard');     // Admin dashboard
  //               } else {
  //                 // Clear stored data if user type is invalid
  //                 localStorage.removeItem('authToken');
  //                 localStorage.removeItem('userType');
  //                 localStorage.removeItem('userEmail');
  //               }
  //             } else {
  //               // Clear stored data if location validation fails
  //               localStorage.removeItem('authToken');
  //               localStorage.removeItem('userType');
  //               localStorage.removeItem('userEmail');
  //             }
  //           } catch (error) {
  //             console.log("caught an error", error)
  //             // Clear stored data if location validation throws an error
  //             localStorage.removeItem('authToken');
  //             localStorage.removeItem('userType');
  //             localStorage.removeItem('userEmail');
  //           }
  //         },
  //         () => {
  //           // Clear stored data if geolocation permission is denied or fails
  //           localStorage.removeItem('authToken');
  //           localStorage.removeItem('userType');
  //           localStorage.removeItem('userEmail');
  //         },
  //         {
  //           // Geolocation options for better accuracy
  //           enableHighAccuracy: true,
  //           timeout: 10000,
  //           maximumAge: 0
  //         }
  //       );
  //     }
  //     }
  //   } catch (loginError) {
  //     console.log("caught login error", loginError)
  //     // Silent error handling for login failures
  //   }
  // };

  useEffect(() => {
    const checkAutoLogin = async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      const rememberedEmail = localStorage.getItem('rememberedEmail');
      const rememberedPassword = localStorage.getItem('rememberedPassword');
      if (refreshToken && rememberedEmail && rememberedPassword) {
        try {
          // Call your API endpoint to validate refresh token and get new access token
          const response = await API.refreshToken({ refreshToken });
          if (response.data.status === 'success') {
            handleLoginSuccess(response.data.data);
          }
        } catch (error) {
          // If refresh token is invalid, clear stored tokens
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberedPassword');
        }
      }
    };

    checkAutoLogin();
  }, []);

  const handleLoginSuccess = (userData) => {
    localStorage.setItem('authToken', userData.access_token);
    localStorage.setItem('userType', userData.user_details.user_type);
    localStorage.setItem('userEmail', userData.user_details.email);

    // Update user context with all user details
    updateUserDetails(userData.user_details);

    if (rememberMe) {
      // Store refresh token and email for "Remember Me"
      localStorage.setItem('refreshToken', userData.refresh_token);
      localStorage.setItem('rememberedEmail', email);
      localStorage.setItem('rememberedPassword', password);
    } else {
      // Clear any existing "Remember Me" data
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('rememberedEmail');
      localStorage.removeItem('rememberedPassword');
    }

    // Navigate based on user type
    // if (userData.user_details.user_type === 0) {
    //   navigate('/user-dashboard');
    // } else if (userData.user_details.user_type === 1) {
    //   navigate('/admin-dashboard');
    // }
    navigate('/terms-and-conditions');
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const loginResponse = await API.login({ email, password });

      if (loginResponse.data.status === 'success') {
        handleLoginSuccess(loginResponse.data.data);
      }
    } catch (loginError) {
      let errorMessage = 'An error occurred during login. Please try again.';

      if (loginError.response?.status === 401) {
        errorMessage = 'Invalid email or password.';
      } else if (loginError.response?.status === 404) {
        errorMessage = 'No user found with this email.';
      } else if (loginError.response?.data?.message) {
        errorMessage = loginError.response.data.message;
      }

      setToastMessage(errorMessage);
      setShowToast(true);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await API.googleLogin({ access_token: tokenResponse.access_token });
        if (response.data && (response.data.access || response.data.access_token)) {
          // Construct the same user data object format expected by handleLoginSuccess
          // dj-rest-auth returns { access: "...", refresh: "...", user: { ... } }
          const userData = {
            access_token: response.data.access || response.data.access_token,
            refresh_token: response.data.refresh || '', // May be in HttpOnly cookie
            user_details: response.data.user
          };
          
          handleLoginSuccess(userData);
        }
      } catch (error) {
        let errorMessage = 'Google login failed. Please try again.';
        if (error.response?.data?.non_field_errors) {
          errorMessage = error.response.data.non_field_errors[0];
        }
        setToastMessage(errorMessage);
        setShowToast(true);
      }
    },
    onError: () => {
      setToastMessage('Google login was cancelled or failed.');
      setShowToast(true);
    },
  });

  // const handleLogin = async (e) => {
  //   e.preventDefault();

  //   if (rememberMe) {
  //     localStorage.setItem('rememberedEmail', email);
  //   } else {
  //     localStorage.removeItem('rememberedEmail');
  //   }

  //   try {
  //     // Step 1: Authenticate user with credentials
  //     const loginResponse = await API.login({ email, password });

  //     if (loginResponse.data.status === 'success') {
  //       // Step 2: Store user information in localStorage after successful login
  //       localStorage.setItem('authToken', loginResponse.data.data.Authorization);
  //       localStorage.setItem('userType', loginResponse.data.data.user_details.user_type);
  //       localStorage.setItem('userEmail', loginResponse.data.data.user_details.email);

  //       const userType = loginResponse.data.data.user_details.user_type;

  //       // Step 3: Navigate based on user type
  //       if (userType === 0) {
  //         navigate('/user-dashboard');
  //       } else if (userType === 1) {
  //         navigate('/admin-dashboard');
  //       } else {
  //         localStorage.removeItem('authToken');
  //         localStorage.removeItem('userType');
  //         localStorage.removeItem('userEmail');
  //       }

  //       /* Commented Geolocation Code
  //       if (!navigator.geolocation) {
  //         return;
  //       }

  //       navigator.geolocation.getCurrentPosition(
  //         async (position) => {
  //           try {
  //             const formData = new FormData();
  //             formData.append('latitude', position.coords.latitude);
  //             formData.append('longitude', position.coords.longitude);

  //             const locationResponse = await API.validateLocation(formData);

  //             if (locationResponse.data.status === 'success' && 
  //                 locationResponse.data.message.within_geofence) {
  //               if (userType === 0) {
  //                 navigate('/user-dashboard');
  //               } else if (userType === 1) {
  //                 navigate('/admin-dashboard');
  //               } else {
  //                 localStorage.removeItem('authToken');
  //                 localStorage.removeItem('userType');
  //                 localStorage.removeItem('userEmail');
  //               }
  //             } else {
  //               localStorage.removeItem('authToken');
  //               localStorage.removeItem('userType');
  //               localStorage.removeItem('userEmail');
  //             }
  //           } catch (error) {
  //             localStorage.removeItem('authToken');
  //             localStorage.removeItem('userType');
  //             localStorage.removeItem('userEmail');
  //           }
  //         },
  //         () => {
  //           localStorage.removeItem('authToken');
  //           localStorage.removeItem('userType');
  //           localStorage.removeItem('userEmail');
  //         },
  //         {
  //           enableHighAccuracy: true,
  //           timeout: 10000,
  //           maximumAge: 0
  //         }
  //       );
  //       */
  //     }
  //   } catch (loginError) {
  //     // Silent error handling for login failures

  //     let errorMessage = 'An error occurred during login. Please try again.';

  //     if (loginError.response?.status === 401) {
  //       errorMessage = 'Invalid email or password.';
  //     } else if (loginError.response?.data?.message) {
  //       errorMessage = loginError.response.data.message;
  //     }

  //     setToastMessage(errorMessage);
  //     setShowToast(true);
  //   }
  // };

  const handleRememberMeChange = (e) => {
    const isChecked = e.target.checked;
    setRememberMe(isChecked);

    if (isChecked) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }
  };
  const inputClasses = `w-full px-3 py-2 border-2 rounded-md
    bg-[#0000001A] !important`;

  // const inputClasses = `w-full px-3 py-2 border-2 rounded-md bg-[#0000001A] 
  //   focus:bg-[#0000001A] focus:ring-1 focus:ring-[#171717] focus:border-transparent  
  //   disabled:bg-gray-50 disabled:cursor-not-allowed
  //   ${emailError ? 'border-red-100 focus:ring-red-500' : ''}`;

  // return (
  //   <div className="h-screen w-screen overflow-hidden relative">
  //     <style>
  //       {`
  //       @keyframes zoomInEffect {
  //         from { transform: scale(1); }
  //         to { transform: scale(1.50); }
  //       }
  //     `}
  //     </style>

  //     <div className="absolute inset-0 "
  //       style={{
  //         backgroundImage: `url(${BGImage})`,
  //         backgroundSize: 'cover',
  //         backgroundPosition: 'center',
  //         backgroundRepeat: 'no-repeat',
  //         animation: 'zoomInEffect 10s ease-out forwards',
  //         filter: 'brightness(1.0)',
  //         zIndex: 0,
  //       }}
  //     />
  //     <div className="relative z-10 h-full flex flex-col">
  //       {/* <div className="w-full items-center px-6">
  //         <LoginHeader />
  //       </div> */}
  //       <div className="flex-grow w-full flex items-center justify-end pr-56">
  //         <div className="w-full max-w-sm px-6 py-6 backdrop-blur-[100px] rounded-lg border-2 border-[#FFFFFF]/[0.1]"
  //         style={{
  //           backgroundImage: `url(${formBG})`,
  //           // backgroundSize: 'cover',
  //           backgroundPosition: 'center',
  //           backgroundRepeat: 'no-repeat'
  //         }}>
  //           <LoginHeader />
  //           {!showForgotPassword ? (
  //             <>
  //               <h2 className="font-satoshi text-2xl font-bold text-start mb-1 text-white">Welcome back</h2>
  //               <h6 className='font-satoshi text-lg/2 font-normal text-start mb-4 text-[#FFFFFF]/[0.6]'>Please enter your details to sign in</h6>
  //               <Form onSubmit={handleLogin}>
  //                 <Form.Group className="mb-4">
  //                   <Form.Control
  //                     type="email"
  //                     placeholder="Email address"
  //                     value={email}
  //                     onChange={handleEmailChange}
  //                     isInvalid={!!emailError}
  //                     isValid={email.length > 0 && !emailError}
  //                     className={inputClasses}
  //                     style={{
  //                       backgroundColor: 'rgba(0, 0, 0, 0.1)',
  //                       color: 'white',  // This ensures the text is white
  //                       borderColor: 'rgba(255, 255, 255, 0.4)'
  //                     }}
  //                     required />
  //                   <Form.Control.Feedback type="invalid" style={{ display: passwordError ? 'block' : 'none', color: 'white' }}>
  //                     {emailError}
  //                   </Form.Control.Feedback>
  //                   <Form.Control.Feedback type="valid" style={{ color: 'white' }}>
  //                     Looks good!
  //                   </Form.Control.Feedback>
  //                 </Form.Group>

  //                 <Form.Group className="mb-4">
  //                   <div className='relative'>
  //                     <Form.Control
  //                       type={showPassword ? "text" : "password"}
  //                       placeholder="Password"
  //                       value={password}
  //                       onChange={handlePasswordChange}
  //                       className={inputClasses}
  //                       style={{
  //                         backgroundColor: 'rgba(0, 0, 0, 0.1)',
  //                         color: 'white',  // This ensures the text is white
  //                         borderColor: 'rgba(255, 255, 255, 0.4)'
  //                       }}
  //                       required />
  //                     <button
  //                       type="button"
  //                       onClick={togglePasswordVisibility}
  //                       className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white"
  //                       style={{ zIndex: 2 }}
  //                     >
  //                       {showPassword ? <IoMdEye size={20} /> : <IoMdEyeOff size={20} />}
  //                     </button>
  //                   </div>
  //                   <Form.Control.Feedback type="invalid" style={{ display: passwordError ? 'block' : 'none', color: 'white' }}>
  //                     {passwordError}
  //                   </Form.Control.Feedback>
  //                   <div className="flex w-full justify-between items-center mt-3">
  //                     <div className="flex-grow">
  //                       <Form.Check
  //                         type="checkbox"
  //                         id="remember-me"
  //                         label="Remember me"
  //                         checked={rememberMe}
  //                         onChange={handleRememberMeChange}
  //                         className="font-satoshi text-base text-white"
  //                       />
  //                     </div>
  //                     <Button
  //                       variant="link"
  //                       onClick={handleForgotPassword}
  //                       className="text-base font-medium font-satoshi text-[#286DB2] p-0 hover:text-[#286DB2] focus:outline-none ml-auto"
  //                     >
  //                       Forgot Password?
  //                     </Button>
  //                   </div>
  //                 </Form.Group>

  //                 <Button
  //                   variant="primary"
  //                   type="submit"
  //                   style={{
  //                     backgroundColor: isFormValid() ? '#286DB2' : '#E6E6E6',
  //                     borderColor: isFormValid() ? '#286DB2' : '#E6E6E6',
  //                     color: isFormValid() ? '#FFFFFF' : '#171717'
  //                   }}
  //                   className="w-full font-satoshi text-base font-semibold"
  //                   disabled={!isFormValid()}
  //                 >
  //                   Login
  //                 </Button>

  //                 {/* <div className="w-full flex justify-center absolute bottom-2"> */}
  //                 <LoginFooter />
  //                 {/* </div> */}
  //               </Form>
  //               <Toast
  //                 show={showToast}
  //                 onClose={() => setShowToast(false)}
  //                 className="position-fixed top-0 end-0 m-4"
  //                 delay={5000}
  //                 autohide
  //                 style={{
  //                   backgroundColor: '#F15A5B',
  //                   color: '#FFFFFF'
  //                 }}
  //               >
  //                 <Toast.Header closeButton>
  //                   <strong className="me-auto">Login Error</strong>
  //                 </Toast.Header>
  //                 <Toast.Body className="text-white">
  //                   {toastMessage}
  //                 </Toast.Body>
  //               </Toast>
  //             </>
  //           ) : (
  //             <EmailRecovery onBack={handleBackToLogin} />
  //           )}
  //         </div>
  //       </div>

  //       {/* <div className="w-full flex justify-center absolute bottom-2">
  //         <LoginFooter />
  //       </div> */}
  //     </div>
  //   </div>
  // );
  return (
    <div
      className="min-h-screen w-screen py-4 px-4 sm:px-6 lg:px-8"
      style={{
        background: 'linear-gradient(116deg, rgba(191, 233, 255, 0.15) 1.06%, rgba(79, 70, 229, 0.15) 33.08%, rgba(255, 54, 145, 0.15) 65.09%, rgba(255, 148, 114, 0.15) 98.08%), #FFF'
      }}
    >
      {/* Logo at the top center of the page */}
      <div className="w-full flex justify-center pt-1 mb-8">
        <LoginHeader />
      </div>

      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-sm">
          <div className="bg-white px-8 py-8 rounded-xl shadow-lg border border-gray-200">
            {/* <LoginHeader /> */}
            {!showForgotPassword ? (
              <>
                <h2 className="font-satoshi text-2xl font-bold text-center mb-1 text-gray-900">Welcome</h2>
                <h6 className='font-satoshi text-base font-normal text-center mb-6 text-gray-600'>Login to get started</h6>
                <Form onSubmit={handleLogin}>
                  <Form.Group className="mb-4">
                    <Form.Control
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={handleEmailChange}
                      isInvalid={!!emailError}
                      isValid={email.length > 0 && !emailError}
                      className={inputClasses}
                      required />
                    <Form.Control.Feedback type="invalid" style={{ display: emailError ? 'block' : 'none', color: '#dc3545' }}>
                      {emailError}
                    </Form.Control.Feedback>
                    <Form.Control.Feedback type="valid" style={{ color: '#28a745' }}>
                      Looks good!
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <div className='relative'>
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={handlePasswordChange}
                        className={inputClasses}
                        required />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        style={{ zIndex: 2 }}
                      >
                        {showPassword ? <IoMdEye size={20} /> : <IoMdEyeOff size={20} />}
                      </button>
                    </div>
                    <Form.Control.Feedback type="invalid" style={{ display: passwordError ? 'block' : 'none', color: '#dc3545' }}>
                      {passwordError}
                    </Form.Control.Feedback>
                    <div className="flex w-full justify-between items-center mt-3">
                      <div className="flex-grow">
                        <Form.Check
                          type="checkbox"
                          id="remember-me"
                          label="Remember me"
                          checked={rememberMe}
                          onChange={handleRememberMeChange}
                          className="font-satoshi text-sm text-gray-700"
                        />
                      </div>
                      <Button
                        variant="link"
                        onClick={handleForgotPassword}
                        className="text-sm font-medium font-satoshi text-blue-600 p-0 hover:text-blue-800 focus:outline-none ml-auto"
                      >
                        Forgot Password?
                      </Button>
                    </div>
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    style={{
                      backgroundColor: isFormValid() ? '#4F46E5' : '#e5e7eb',
                      borderColor: isFormValid() ? '#4F46E5' : '#e5e7eb',
                      color: isFormValid() ? '#FFFFFF' : '#9ca3af'
                    }}
                    className="w-full font-satoshi text-sm font-semibold py-2 mt-4"
                    disabled={!isFormValid()}
                  >
                    Login
                  </Button>
                  
                  <div className="relative flex items-center py-4">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 font-satoshi text-sm">or</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                  </div>

                  <Button
                    variant="light"
                    type="button"
                    onClick={() => handleGoogleLogin()}
                    className="w-full font-satoshi text-sm font-semibold py-2 bg-white text-gray-700 hover:!bg-gray-50 hover:!text-gray-700 flex items-center justify-center gap-2 border border-gray-300"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Sign in with Google
                  </Button>

                  <LoginFooter />
                </Form>
                <Toast
                  show={showToast}
                  onClose={() => setShowToast(false)}
                  className="position-fixed top-0 end-0 m-4"
                  delay={5000}
                  autohide
                  style={{
                    backgroundColor: '#dc2626',
                    color: '#FFFFFF'
                  }}
                >
                  <Toast.Header closeButton>
                    <strong className="me-auto">Login Error</strong>
                  </Toast.Header>
                  <Toast.Body className="text-white">
                    {toastMessage}
                  </Toast.Body>
                </Toast>
              </>
            ) : (
              <EmailRecovery onBack={handleBackToLogin} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;