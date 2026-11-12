package com.learncard.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.learncard.digitalcredentials.NativeDigitalCredentialsPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(ShakeObserverPlugin.class);
        registerPlugin(NativeDigitalCredentialsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
