import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../Context/UserContext';
import { Toast } from 'react-bootstrap';

const TermsAndConditions = () => {
  const navigate = useNavigate();
  const { userDetails } = useUser();
  
  const [isAgreed, setIsAgreed] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const showSnackbar = (message) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleAccept = async () => {
    if (!isAgreed) {
      showSnackbar("Please accept the terms and conditions to continue");
      return;
    }

    if (!userDetails) {
      showSnackbar("User data not found. Please login again.");
      navigate('/login');
      return;
    }

    try {
      setIsLoading(true);

      console.log('Proceeding to dashboard...');
      console.log('userDetails:', userDetails);

      setTimeout(() => {
        // Navigate based on user type
        if (userDetails.user_type === 0) {
          navigate('/user-dashboard', { replace: true });
        } else if (userDetails.user_type === 1) {
          navigate('/admin-dashboard', { replace: true });
        }
      }, 1000);

    } catch (error) {
      console.error('Error during terms acceptance:', error);
      showSnackbar("Something went wrong. Please try again.");
    } finally {
      setTimeout(() => setIsLoading(false), 1200);
    }
  };

  const handleDecline = () => {
    showSnackbar("You must accept the terms to use the application");
    setTimeout(() => {
      navigate('/login', { replace: true });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="font-satoshi text-2xl font-bold text-gray-900">
            End User License Agreement
          </h1>
          <p className="font-satoshi text-sm text-gray-600">
            Please read and accept to continue
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[calc(100vh-120px)] flex flex-col">
          
          {/* Scrollable Terms Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 max-h-[500px]">
            <h2 className="font-satoshi text-lg font-semibold text-gray-900 mb-4">
              Production Resource and Line Balancing Optimizer
            </h2>

            <p className="font-satoshi text-sm text-gray-700 leading-6 mb-6">
              This End User License Agreement ("EULA") governs your use of the Production Resource and Line Balancing Optimizer application, software, integrated Hardware (if any), their associated upgrades, patches, and updates and related services (the "Product") currently provided or which will be provided by Ascendum Solutions India Private Limited ("Company").
            </p>

            <p className="font-satoshi text-sm text-gray-700 leading-6 mb-6">
              By installing or using the Product, you agree to accept and to be bound by this EULA and the Privacy Policy at all times. If You do not agree with these terms, please do not install or use the Product.
            </p>

            <div className="mb-6">
              <h3 className="font-satoshi text-base font-semibold text-gray-900 mb-3">
                1. SOFTWARE LICENCE
              </h3>
              <p className="font-satoshi text-sm text-gray-700 leading-6 mb-3">
                <span className="font-semibold">1.1 LICENCE GRANT.</span> Subject to the terms of this Agreement, Company grants to End User a non-exclusive, non-transferable, non-sub-licensable right and license to use the Company's product for End User's internal business purposes only, and for the quantity of units specified in the Order Form.
              </p>
              <p className="font-satoshi text-sm text-gray-700 leading-6 mb-3">
                The Trial Period begins on the date of first installation and may extend until the User Subscribes or until the 7th day of installation, whichever occurs first. The Product is licensed for use by no more than two (2) individual users and may be installed on only one (1) device during the trial period.
              </p>
              <p className="font-satoshi text-sm text-gray-700 leading-6">
                <span className="font-semibold">1.2 RESTRICTIONS ON USE.</span> End User shall not: (a) sublicense, sell, resell, transfer, assign, distribute, share, lease, rent, or otherwise generate income from the Software; (b) decompile, reverse engineer or disassemble any portion of the Software; (c) modify, adapt, translate or create derivative works based on the Software; (d) use the Software in violation of any applicable laws and regulations; (e) use the Software to store, download or transmit infringing, libelous, or otherwise unlawful material, or malicious code.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-satoshi text-base font-semibold text-gray-900 mb-3">
                2. TRIAL PERIOD AND PAYMENTS
              </h3>
              <p className="font-satoshi text-sm text-gray-700 leading-6">
                The Product is provided on a temporary, no-cost basis for evaluation purposes only during the 7-day Trial Period. No fees are due during this period. Continued use after the Trial Period expires requires the purchase of a valid, paid license. If you do not purchase a license at the end of the Trial Period, your access may be automatically disabled without notice.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-satoshi text-base font-semibold text-gray-900 mb-3">
                3. CONFIDENTIALITY
              </h3>
              <p className="font-satoshi text-sm text-gray-700 leading-6">
                All information disclosed by either party that is identified as confidential or should reasonably be known to be confidential shall be protected. The Receiving Party will not use such information for any purpose outside of this Agreement and will not disclose it to any third party without proper authorization.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-satoshi text-base font-semibold text-gray-900 mb-3">
                4. PROPRIETARY RIGHTS
              </h3>
              <p className="font-satoshi text-sm text-gray-700 leading-6">
                Company and its suppliers own and retain all intellectual property rights in and to the Software. All title, ownership rights and intellectual property rights in the Product remain with Company or its licensors. This License confers no title or ownership in the Product.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-satoshi text-base font-semibold text-gray-900 mb-3">
                5. DATA PROTECTION
              </h3>
              <p className="font-satoshi text-sm text-gray-700 leading-6">
                The terms of standard Data Protection laws as applicable under GDPR/CCPA shall apply. This product is a one-time deployable product wherein Company does not have access to PII and hence there shall be no liability on the Company related to any data protection laws. End User should ensure secure deployment and restrict any data accessible by the product.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-satoshi text-base font-semibold text-gray-900 mb-3">
                6. TERM AND TERMINATION
              </h3>
              <p className="font-satoshi text-sm text-gray-700 leading-6">
                The pilot period shall automatically terminate on the 7th day of Software installation, unless a paid license is purchased. Company can terminate this Agreement immediately if End User breaches any terms. Upon termination, all rights granted shall terminate and End User shall destroy any copies of the Software. All trial-related data will be permanently deleted within seven (7) days.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-satoshi text-base font-semibold text-gray-900 mb-3">
                7. WARRANTIES AND LIMITATION OF LIABILITY
              </h3>
              <p className="font-satoshi text-sm text-gray-700 leading-6 mb-3">
                <span className="font-semibold">WARRANTY DISCLAIMER:</span> The product is supplied on an "as is" and "as available" basis. Company disclaims all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement.
              </p>
              <p className="font-satoshi text-sm text-gray-700 leading-6">
                <span className="font-semibold">LIMITATION OF LIABILITY:</span> Company shall not be liable for any damages arising out of or related to the use or inability to use the Product during the Trial Period, including loss of data, downtime, or indirect, incidental, special, punitive, or consequential damages. Company's total maximum aggregate liability is limited to $100.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-satoshi text-base font-semibold text-gray-900 mb-3">
                8. INDEMNITY
              </h3>
              <p className="font-satoshi text-sm text-gray-700 leading-6">
                You agree to defend, indemnify and hold harmless Company and its affiliates against any claims, liabilities, losses, damages and costs directly or indirectly attributable to your violation of this EULA or your use or misuse of the Product.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-satoshi text-base font-semibold text-gray-900 mb-3">
                9. EXPORT CONTROL AND COMPLIANCE
              </h3>
              <p className="font-satoshi text-sm text-gray-700 leading-6">
                The Product will not be used, exported, re-exported, or transferred in connection with high-risk activities, nuclear operations, aviation systems, life support, or in any sanctioned countries. End User agrees to comply with all applicable export control laws and regulations.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-satoshi text-base font-semibold text-gray-900 mb-3">
                10. INDUSTRIAL ENVIRONMENT WAIVER
              </h3>
              <p className="font-satoshi text-sm text-gray-700 leading-6">
                The Product is not fault-tolerant and is not intended for use in operational production environments that control or manage manufacturing equipment. Integration with PLCs, SCADA systems, or other industrial control systems during the Trial Period is unsupported.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-satoshi text-base font-semibold text-gray-900 mb-3">
                11. GOVERNING LAW
              </h3>
              <p className="font-satoshi text-sm text-gray-700 leading-6">
                This Agreement shall be governed by and construed in accordance with the laws of India exclusively. The courts of Ahmedabad, Gujarat, India shall have sole and exclusive jurisdiction to settle any disputes.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-satoshi text-base font-semibold text-gray-900 mb-3">
                12. DATA COLLECTION AND AI MODEL TRAINING
              </h3>
              <p className="font-satoshi text-sm text-gray-700 leading-6">
                Company may collect usage data, performance metrics, error reports, and feature usage statistics during the Trial Period for improving the Product and monitoring system performance. The Product may collect usage data to improve AI-based predictive models. You may disable the "Share Data for Model Improvement" setting, though this may result in reduced model accuracy.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-blue-800 leading-6">
                <span className="font-satoshi font-semibold">Important:</span> This agreement is deemed accepted and executed upon installation of the Product. By accepting these terms, you acknowledge that you have read, understood, and agree to be bound by all the terms and conditions outlined above. Company reserves the right to modify these terms at any time.
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-red-800 leading-6">
                <span className="font-satoshi font-semibold">Trial License Notice:</span> This is a 7-day trial license for evaluation purposes only. The Product may not be used for commercial or production purposes during the trial period. All trial data will be permanently deleted after 7 days unless a paid license is purchased.
              </p>
            </div>
          </div>

          {/* Bottom Action Section */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="agree-checkbox"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                className="h-4 w-4 text-black border-gray-300 rounded focus:ring-black focus:ring-2"
              />
              <label htmlFor="agree-checkbox" className="font-satoshi text-sm text-gray-800 ml-3 flex-1">
                I have read and agree to the End User License Agreement
              </label>
            </div>

            <div className="flex items-start gap-4">
              <button
                onClick={handleDecline}
                disabled={isLoading}
                className="px-6 py-2 rounded-lg border border-red-300 text-red-600 font-satoshi text-sm font-semibold hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Decline
              </button>

              <button
                onClick={handleAccept}
                disabled={!isAgreed || isLoading}
                className={`px-6 py-2 rounded-lg font-satoshi text-sm font-semibold text-white flex items-center ${
                  !isAgreed || isLoading 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-black hover:bg-gray-800'
                }`}
              >
                {isLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {isLoading ? 'Processing...' : 'Accept & Continue'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        show={showToast}
        onClose={() => setShowToast(false)}
        className="position-fixed top-0 end-0 m-4"
        delay={5000}
        autohide
        style={{
          backgroundColor: '#F15A5B',
          color: '#FFFFFF'
        }}
      >
        <Toast.Header closeButton>
          <strong className="me-auto">Notice</strong>
        </Toast.Header>
        <Toast.Body className="text-white">
          {toastMessage}
        </Toast.Body>
      </Toast>
    </div>
  );
};

export default TermsAndConditions;