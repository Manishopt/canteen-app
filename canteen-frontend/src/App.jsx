import React, { useState, useEffect } from 'react';
// Firebase functions are accessed via the global 'firebase' object
// because they are loaded via CDN script tags in index.html.
// Therefore, no direct imports from 'firebase/app', 'firebase/auth', 'firebase/firestore' are needed here.

// Firebase configuration variables (will be provided by the Canvas environment)
// For local development, we will use the user's provided Firebase project config directly.
const localFirebaseConfig = {
  apiKey: "AIzaSyDiXg9goNhXl3ZsQGNFUsJMSx-Jjvshkro",
  authDomain: "canteenconnect-77f1b.firebaseapp.com",
  projectId: "canteenconnect-77f1b",
  storageBucket: "canteenconnect-77f1b.firebasestorage.app",
  messagingSenderId: "1092156152169",
  appId: "1:1092156152169:web:87820dd54c1e1a27d845f8",
  // measurementId: "G-2SHBCKC3X1" // measurementId is for Analytics, not needed for core app init
};


// The Canvas environment will inject __firebase_config and __initial_auth_token.
// For local development, we use localFirebaseConfig if __firebase_config is not defined or empty.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' && __firebase_config !== '{}'
    ? JSON.parse(__firebase_config)
    : localFirebaseConfig; // Use local config if Canvas config is not provided or empty

const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initialize Firebase App
// Access firebase from the global window object
// Note: databaseURL and measurementId are not typically passed directly to initializeApp for auth/firestore
const app = window.firebase.initializeApp(firebaseConfig);
const db = window.firebase.firestore(app);
const auth = window.firebase.auth(app);

// Main App Component
const App = () => {
    // State to manage the current view (e.g., 'login', 'student-dashboard', 'vendor-dashboard')
    const [currentView, setCurrentView] = useState('loading'); // Initial state is loading
    const [user, setUser] = useState(null); // Stores Firebase user object
    const [userId, setUserId] = useState(null); // Stores the user ID (Firebase UID or anonymous ID)
    const [userRole, setUserRole] = useState(null); // 'student' or 'vendor'
    const [isAuthReady, setIsAuthReady] = useState(false); // To ensure Firebase auth is ready
    const [authError, setAuthError] = useState(''); // State for authentication errors
    const [authMessage, setAuthMessage] = useState(''); // State for authentication success messages

    // Effect for Firebase Authentication and Firestore initialization
    useEffect(() => {
        const setupFirebase = async () => {
            try {
                // Sign in with custom token if available, otherwise anonymously
                if (initialAuthToken) {
                    await auth.signInWithCustomToken(initialAuthToken);
                } else {
                    await auth.signInAnonymously();
                }

                // Listen for auth state changes
                const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
                    if (currentUser) {
                        setUser(currentUser);
                        const currentUserId = currentUser.uid;
                        setUserId(currentUserId);

                        // Fetch user role from Firestore
                        // Private data path: /artifacts/{appId}/users/{userId}/profile/data
                        const userProfileDocRef = db.doc(`artifacts/${appId}/users/${currentUserId}/profile/data`);
                        const userDocSnap = await userProfileDocRef.get(); // Use .get() on doc ref

                        if (userDocSnap.exists) { // Check .exists property
                            const userData = userDocSnap.data();
                            setUserRole(userData.role);
                            // Set initial view based on role
                            if (userData.role === 'student') {
                                setCurrentView('student-dashboard');
                            } else if (userData.role === 'vendor') {
                                setCurrentView('vendor-dashboard');
                            } else {
                                setCurrentView('login'); // Fallback if role is not recognized
                            }
                        } else {
                            // New user, prompt for role or redirect to registration
                            setCurrentView('register-form'); // Go to registration to pick a role
                        }
                    } else {
                        setUser(null);
                        setUserId(null);
                        setUserRole(null);
                        setCurrentView('login'); // No user, show login
                    }
                    setIsAuthReady(true); // Auth state is now ready
                });

                return () => unsubscribe(); // Clean up auth listener on unmount
            } catch (error) {
                console.error("Error setting up Firebase:", error);
                setAuthError("Failed to initialize. Please check your network connection.");
                setCurrentView('error'); // Show an error view
            }
        };

        setupFirebase();
    }, []); // Run only once on component mount

    // --- Authentication Handlers ---

    const handleRegister = async (email, password, role) => {
        setAuthError('');
        setAuthMessage('');
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const newUser = userCredential.user;

            // Store user role in Firestore
            const userProfileDocRef = db.doc(`artifacts/${appId}/users/${newUser.uid}/profile/data`);
            await userProfileDocRef.set({ // Use .set() on doc ref
                email: newUser.email,
                role: role,
                createdAt: new Date(),
            });

            setAuthMessage(`Successfully registered as ${role}! Please log in.`);
            setCurrentView('login-form'); // Redirect to login after successful registration
        } catch (error) {
            console.error("Error during registration:", error);
            let errorMessage = "Registration failed. Please try again.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "This email is already registered. Please log in or use a different email.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "Password should be at least 6 characters.";
            }
            setAuthError(errorMessage);
        }
    };

    const handleLogin = async (email, password) => {
        setAuthError('');
        setAuthMessage('');
        try {
            await auth.signInWithEmailAndPassword(email, password);
            // onAuthStateChanged listener will handle redirect to dashboard
            setAuthMessage("Logged in successfully!");
        } catch (error) {
            console.error("Error during login:", error);
            let errorMessage = "Login failed. Please check your credentials.";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = "Invalid email or password.";
            }
            setAuthError(errorMessage);
        }
    };

    const handleLogout = async () => {
        setAuthError('');
        setAuthMessage('');
        try {
            await auth.signOut();
            // onAuthStateChanged listener will handle redirect to login
            setAuthMessage("Logged out successfully.");
        } catch (error) {
            console.error("Error during logout:", error);
            setAuthError("Failed to log out. Please try again.");
        }
    };

    // --- Reusable Message Box Component ---
    const MessageBox = ({ message, type }) => {
        if (!message) return null;
        const bgColor = type === 'error' ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-700';
        return (
            <div className={`border px-4 py-3 rounded relative mb-4 ${bgColor}`} role="alert">
                <span className="block sm:inline">{message}</span>
            </div>
        );
    };

    // --- Placeholder Components for different views ---

    const LoadingScreen = () => (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            <p className="mt-4 text-lg text-gray-700">Loading application...</p>
        </div>
    );

    const ErrorScreen = ({ message }) => (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-100 p-4 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-red-700 mb-4">Error!</h2>
            <p className="text-red-600 text-center">{message || "An unexpected error occurred. Please try again later."}</p>
        </div>
    );

    const LoginScreen = () => (
        <div className="flex flex-col items-center justify-center bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Welcome to Canteen Connect!</h2>
            <p className="text-gray-600 text-center mb-8">Please log in or register to continue.</p>
            <button
                onClick={() => setCurrentView('login-form')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 mb-4"
            >
                Login
            </button>
            <button
                onClick={() => setCurrentView('register-form')}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
            >
                Register
            </button>
        </div>
    );

    const RegisterForm = () => {
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
        const [confirmPassword, setConfirmPassword] = useState('');
        const [role, setRole] = useState('student'); // Default role

        const handleSubmit = (e) => {
            e.preventDefault();
            setAuthError(''); // Clear previous errors
            if (password !== confirmPassword) {
                setAuthError("Passwords do not match.");
                return;
            }
            if (password.length < 6) {
                setAuthError("Password must be at least 6 characters long.");
                return;
            }
            handleRegister(email, password, role);
        };

        return (
            <div className="flex flex-col items-center justify-center bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Register</h2>
                <MessageBox message={authError} type="error" />
                <MessageBox message={authMessage} type="success" />
                <form onSubmit={handleSubmit} className="w-full">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password (min 6 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-3 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <div className="mb-6">
                        <label htmlFor="role" className="block text-gray-700 text-sm font-bold mb-2">
                            Register as:
                        </label>
                        <select
                            id="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="student">Student</option>
                            <option value="vendor">Canteen Owner</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        Register
                    </button>
                </form>
                <button
                    onClick={() => { setCurrentView('login-form'); setAuthError(''); setAuthMessage(''); }}
                    className="mt-6 text-blue-600 hover:underline"
                >
                    Already have an account? Login
                </button>
            </div>
        );
    };

    const LoginForm = () => {
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');

        const handleSubmit = (e) => {
            e.preventDefault();
            setAuthError(''); // Clear previous errors
            handleLogin(email, password);
        };

        return (
            <div className="flex flex-col items-center justify-center bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Login</h2>
                <MessageBox message={authError} type="error" />
                <MessageBox message={authMessage} type="success" />
                <form onSubmit={handleSubmit} className="w-full">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        Login
                    </button>
                </form>
                <button
                    onClick={() => { setCurrentView('register-form'); setAuthError(''); setAuthMessage(''); }}
                    className="mt-6 text-blue-600 hover:underline"
                >
                    Don't have an account? Register
                </button>
            </div>
        );
    };

    const StudentDashboard = () => (
        <div className="flex flex-col items-center justify-center bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Student Dashboard</h2>
            <MessageBox message={authMessage} type="success" />
            <p className="text-gray-600 text-center mb-8">
                Welcome, Student! Your User ID: <span className="font-mono text-sm bg-gray-100 p-1 rounded">{userId}</span>
            </p>
            <p className="text-lg text-gray-700 mb-4">Browse canteens and place your order!</p>
            <button
                onClick={() => { /* Logic to browse canteens */ alert("Canteen browsing coming soon!"); }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 mb-4"
            >
                Browse Canteens
            </button>
            <button
                onClick={() => { /* Logic to view orders */ alert("Order history coming soon!"); }}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
            >
                View My Orders
            </button>
            <button
                onClick={handleLogout}
                className="mt-8 text-red-600 hover:underline"
            >
                Logout
            </button>
        </div>
    );

    const VendorDashboard = () => (
        <div className="flex flex-col items-center justify-center bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Vendor Dashboard</h2>
            <MessageBox message={authMessage} type="success" />
            <p className="text-gray-600 text-center mb-8">
                Welcome, Canteen Owner! Your User ID: <span className="font-mono text-sm bg-gray-100 p-1 rounded">{userId}</span>
            </p>
            <p className="text-lg text-gray-700 mb-4">Manage your menu and orders.</p>
            <button
                onClick={() => { /* Logic to manage menu */ alert("Menu management coming soon!"); }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 mb-4"
            >
                Manage Menu
            </button>
            <button
                onClick={() => { /* Logic to view orders */ alert("View incoming orders coming soon!"); }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
            >
                View Incoming Orders
            </button>
            <button
                onClick={handleLogout}
                className="mt-8 text-red-600 hover:underline"
            >
                Logout
            </button>
        </div>
    );

    // Render logic based on currentView state
    if (!isAuthReady) {
        return <LoadingScreen />;
    }

    switch (currentView) {
        case 'loading':
            return <LoadingScreen />;
        case 'error':
            return <ErrorScreen message={authError || "An unexpected error occurred."} />;
        case 'login':
            return <LoginScreen />;
        case 'login-form':
            return <LoginForm />;
        case 'register-form':
            return <RegisterForm />;
        case 'student-dashboard':
            return <StudentDashboard />;
        case 'vendor-dashboard':
            return <VendorDashboard />;
        default:
            return <ErrorScreen message="Unknown application state." />;
    }
};

export default App;
