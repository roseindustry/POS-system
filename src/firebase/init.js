// src/firebase/init.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"; // Import the Realtime Database service
import { getStorage } from "firebase/storage";
import { firebaseConfig } from "./config";
import { getAuth } from "firebase/auth";

const app = initializeApp(firebaseConfig);

// Initialize the Realtime Database and export it
const db = getDatabase(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { db, storage, auth };
