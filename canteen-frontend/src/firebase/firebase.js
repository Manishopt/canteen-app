// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDiXg9goNhXl3ZsQGNFUsJMSx-Jjvshkro",
  authDomain: "canteenconnect-77f1b.firebaseapp.com",
  databaseURL: "https://canteenconnect-77f1b-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "canteenconnect-77f1b",
  storageBucket: "canteenconnect-77f1b.firebasestorage.app",
  messagingSenderId: "1092156152169",
  appId: "1:1092156152169:web:87820dd54c1e1a27d845f8",
  measurementId: "G-2SHBCKC3X1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export {app};