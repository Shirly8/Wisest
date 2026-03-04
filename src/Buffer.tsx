import React, { useState, useEffect } from 'react';
import './styles/utilities.css';
import logo from './images/logo.png';

function Buffer() {
    const [buffering, setBuffering] = useState(true);

    // 1) TIMER SETUP
    useEffect(() => {
        const timer = setTimeout(() => {
            setBuffering(false);
        }, 5000);

        return () => clearTimeout(timer); 
    }, []);

    if (!buffering) {
        return null;
    }

    return (
        <div className="fullscreen-center">
            <img src={logo} alt="Wisest Logo" className="spin-icon" />
            <h2 className="mt-20px">Calculating all your options...</h2>
        </div>
    );
}

export default Buffer;
