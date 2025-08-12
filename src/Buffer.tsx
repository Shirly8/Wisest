import React, { useState, useEffect } from 'react';
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', height: '100vh' }}>
            <img src={logo} alt="Wisest Logo" style={{
                width: '100px',
                height: '100px',
                animation: 'spin 2s linear infinite'
            }} />
            <h2 style={{ marginTop: '20px' }}>Calculating all your options...</h2>
        </div>
    );
}

export default Buffer;
