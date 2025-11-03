import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBE2iLWSsvFGi79u7QyZJWde1l81rk2o8o",
  authDomain: "day-diary-c20f0.firebaseapp.com",
  projectId: "day-diary-c20f0",
  storageBucket: "day-diary-c20f0.appspot.com",
  messagingSenderId: "286299669271",
  appId: "1:286299669271:web:1e44e0b44db8bef2806d52",
  measurementId: "G-X3KHK4811W"
};

const app = initializeApp(firebaseConfig);
console.log("✅ Firebase initialized successfully");

const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
