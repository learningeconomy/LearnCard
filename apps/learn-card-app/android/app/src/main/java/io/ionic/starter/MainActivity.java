package com.learncard.app;

import android.os.Bundle;
import android.content.Intent;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        NativeCrashReportingPlugin.inspect(this, getIntent().getData());
        NativeCrashReportingPlugin.start(this);
        registerPlugin(ShakeObserverPlugin.class);
        registerPlugin(NativeCrashReportingPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        NativeCrashReportingPlugin.inspect(this, intent.getData());
        super.onNewIntent(intent);
    }
}
