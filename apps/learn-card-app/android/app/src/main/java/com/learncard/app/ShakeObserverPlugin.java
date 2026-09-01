package com.learncard.app;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.SystemClock;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Local shake observer whose accelerometer registration is controlled from JS. */
@CapacitorPlugin(name = "ShakeObserver")
public class ShakeObserverPlugin extends Plugin implements SensorEventListener {

    private SensorManager sensorManager;
    private Sensor accelerometer;
    private volatile boolean sensing = false;
    private volatile double threshold = 2.7;
    private volatile long cooldownMs = 2_000L;
    private long lastShakeAtMs = Long.MIN_VALUE;

    @Override
    public void load() {
        // Loading only resolves sensor references. Registration happens in start().
        sensorManager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        accelerometer = sensorManager == null ? null : sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
    }

    @PluginMethod
    public void start(PluginCall call) {
        Double requestedThreshold = call.getDouble("threshold", threshold);
        Double requestedCooldownMs = call.getDouble("cooldownMs", (double) cooldownMs);

        if (requestedThreshold == null || !Double.isFinite(requestedThreshold) || requestedThreshold <= 1) {
            call.reject("threshold must be a finite value greater than 1");
            return;
        }
        if (requestedCooldownMs == null || !Double.isFinite(requestedCooldownMs) || requestedCooldownMs < 0) {
            call.reject("cooldownMs must be a non-negative finite value");
            return;
        }
        if (sensorManager == null || accelerometer == null) {
            call.unavailable("Accelerometer is unavailable");
            return;
        }

        threshold = requestedThreshold;
        cooldownMs = Math.round(requestedCooldownMs);

        getActivity().runOnUiThread(() -> {
            // Idempotent: a repeated start only refreshes tuning values.
            if (sensing) {
                call.resolve();
                return;
            }

            lastShakeAtMs = Long.MIN_VALUE;
            sensing = sensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_GAME);

            if (sensing) {
                call.resolve();
            } else {
                call.reject("Unable to start accelerometer sensing");
            }
        });
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            stopSensing();
            call.resolve();
        });
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (!sensing || event.sensor.getType() != Sensor.TYPE_ACCELEROMETER) return;

        double x = event.values[0] / SensorManager.GRAVITY_EARTH;
        double y = event.values[1] / SensorManager.GRAVITY_EARTH;
        double z = event.values[2] / SensorManager.GRAVITY_EARTH;
        double magnitude = Math.sqrt(x * x + y * y + z * z);
        long nowMs = SystemClock.elapsedRealtime();

        if (magnitude < threshold) return;
        if (lastShakeAtMs != Long.MIN_VALUE && nowMs - lastShakeAtMs < cooldownMs) return;

        lastShakeAtMs = nowMs;
        notifyListeners("shake", new JSObject());
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}

    @Override
    protected void handleOnDestroy() {
        stopSensing();
        super.handleOnDestroy();
    }

    private void stopSensing() {
        if (sensorManager != null && sensing) sensorManager.unregisterListener(this);
        sensing = false;
        lastShakeAtMs = Long.MIN_VALUE;
    }
}
