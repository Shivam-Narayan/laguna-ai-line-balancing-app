import React from 'react';
import Logo from '../assets/Ascendum Logo Black.svg'
const LoginHeader = () => {
    return (
        <div className="w-full flex justify-center mb-4">
        <img
          src={Logo}
          className='w-36 h-10 object-contain' />
      </div>
    )
}
export default LoginHeader;