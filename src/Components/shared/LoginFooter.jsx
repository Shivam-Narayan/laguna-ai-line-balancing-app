import React from 'react';

const LoginFooter = () => {
    const currentYear = new Date().getFullYear();
    return(
    <p className='font-satoshi text-sm font-normal text-white text-center'>
        © Ascendum Line Balancing {currentYear}</p>
    )
}

export default LoginFooter;