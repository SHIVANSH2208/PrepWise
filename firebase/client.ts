
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB7sTdCmgR9t0Yfh9r7HBGCYktG0vqRC8Y",
  authDomain: "prepwise-9c022.firebaseapp.com",
  projectId: "prepwise-9c022",
  storageBucket: "prepwise-9c022.firebasestorage.app",
  messagingSenderId: "170126574350",
  appId: "1:170126574350:web:b8374bd4e096cefb2e4d5f",
  measurementId: "G-8BVGR0MGN8"
};

const app = !getApps.length ? initializeApp(firebaseConfig) :getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);