package com.moonsoul.v4;

import android.content.Context;
import android.hardware.camera2.CameraAccessException;
import android.hardware.camera2.CameraManager;
import android.os.Build;

public class FlashlightControl {
    
    private static boolean isFlashOn = false;
    
    public static void turnOn(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            CameraManager cameraManager = (CameraManager) context.getSystemService(Context.CAMERA_SERVICE);
            try {
                String cameraId = cameraManager.getCameraIdList()[0];
                cameraManager.setTorchMode(cameraId, true);
                isFlashOn = true;
            } catch (CameraAccessException e) {
                e.printStackTrace();
            }
        }
    }
    
    public static void turnOff(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            CameraManager cameraManager = (CameraManager) context.getSystemService(Context.CAMERA_SERVICE);
            try {
                String cameraId = cameraManager.getCameraIdList()[0];
                cameraManager.setTorchMode(cameraId, false);
                isFlashOn = false;
            } catch (CameraAccessException e) {
                e.printStackTrace();
            }
        }
    }
    
    public static boolean isFlashOn() {
        return isFlashOn;
    }
}
