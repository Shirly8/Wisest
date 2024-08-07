import React, { useState, useEffect } from 'react';
import logo from './images/logo.png';

// Create a function to buffer the screen
function Buffer() {
    const [buffering, setBuffering] = useState(true);

    // SETS A TIMER 
    useEffect(() => {
        const timer = setTimeout(() => {
            setBuffering(false);
        }, 5000); // Buffering for 5 seconds

        return () => clearTimeout(timer); 
    }, []);

    if (!buffering) {
        return null; // Render nothing if not buffering
    }

    // RENDERING
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', height: '100vh' }}>
            <img src={logo}style={{
                width: '100px',
                height: '100px',
                animation: 'spin 2s linear infinite'
            }} />
            <h2 style={{ marginTop: '20px' }}>Calculating all your options...</h2>
        </div>
    );
}

export default Buffer;
