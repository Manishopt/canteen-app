import React, { useState } from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider, sendSignInLinkToEmail } from 'firebase/auth';
import { app } from "../firebase/firebase";

const Login = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const auth = getAuth(app);

    const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        setMessage('Logged in with Google!');
    } catch (error) {
        if (error.code === 'auth/popup-closed-by-user') {
            setMessage('Do it Fast');
        } else {
            setMessage(error.message);
        }
    }
};

    const handleSendEmailLink = async (e) => {
        e.preventDefault();
        const actionCodeSettings = {
            url: window.location.origin,
            handleCodeInApp: true,
        };
        try {
            await sendSignInLinkToEmail(auth, email, actionCodeSettings);
            window.localStorage.setItem('emailForSignIn', email);
            setMessage('Email link sent! Check your inbox.');
        } catch (error) {
            setMessage(error.message);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Login</h2>
            {message && <div className="mb-4 text-red-600">{message}</div>}
            <button
                onClick={handleGoogleLogin}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md mb-4"
            >
                Continue with Google
            </button>
            <form onSubmit={handleSendEmailLink} className="w-full">
                <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 mb-4 border border-gray-300 rounded-lg"
                    required
                />
                <button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md"
                >
                    Send Email Link
                </button>
            </form>
        </div>
    );
};

export default Login;