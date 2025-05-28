import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAbjavvdB_hAXf69cijLjpTIpEUs9jMMXo",
  authDomain: "scrum-board-f29b3.firebaseapp.com",
  projectId: "scrum-board-f29b3",
  storageBucket: "scrum-board-f29b3.firebasestorage.app",
  messagingSenderId: "1098190670402",
  appId: "1:1098190670402:web:9d8133c30155bca472bbdb",
  measurementId: "G-YDWS0T2PYQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };