import React, { useState } from 'react';
import Login from './components/Login';

const App = () => {
    const [loggedIn, setLoggedIn] = useState(false);
    const [loginMessage, setLoginMessage] = useState('');

    // Callback to handle login success from Login.jsx
    const handleLoginSuccess = (message) => {
        setLoggedIn(true);
        setLoginMessage(message);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            {!loggedIn ? (
                <Login onLoginSuccess={handleLoginSuccess} />
            ) : (
                <div className="bg-white p-8 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold mb-4">Welcome!</h2>
                    <p>{loginMessage || "You are now logged in."}</p>
                </div>
            )}
        </div>
    );
};

export default App;