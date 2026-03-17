// Firebase configuration - GANTI DENGAN KONFIGURASI LU SENDIRI
const firebaseConfig = {
    apiKey: "AIzaSyBPhS0fmr2MRIEDJYyIwC-TLaqpKCt12Ys",
    authDomain: "https://moon-soul-45.firebaseapp.com",
    projectId: "moon-soul-45",
    storageBucket: "https://moon-soul-45.firebasestorage.app",
    messagingSenderId: "95623014404",
    appId: "1:95623014404:web:8b238a33f4114e43f9ed51"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();
const auth = firebase.auth();

// Enable offline persistence
db.enablePersistence()
    .catch((err) => {
        console.log("Persistence failed:", err);
    });
