// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey:import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "food-delivery-app-ba7a8.firebaseapp.com",
  projectId: "food-delivery-app-ba7a8",
  storageBucket: "food-delivery-app-ba7a8.firebasestorage.app",
  messagingSenderId: "1036673190757",
  appId: "1:1036673190757:web:c2273a9ddbf99602dfef8c",
  measurementId: "G-3VT72GSVDW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth=getAuth(app)
export {app,auth}
