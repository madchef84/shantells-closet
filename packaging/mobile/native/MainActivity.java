package com.madchefgo.shantellscloset;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import com.getcapacitor.BridgeActivity;
import org.json.JSONObject;

// v1.10: receive "Share" from the Poshmark / Vinted apps (text + link) and hand it to the web app's add form.
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleShare(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleShare(intent);
    }

    private void handleShare(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) return;
        String text = intent.getStringExtra(Intent.EXTRA_TEXT);
        if (text == null) return;
        String subject = intent.getStringExtra(Intent.EXTRA_SUBJECT);
        final String js = "window.__closetShare&&window.__closetShare(" + JSONObject.quote(subject == null ? "" : subject) + "," + JSONObject.quote(text) + ")";
        Handler h = new Handler(Looper.getMainLooper());
        for (int k = 1; k <= 5; k++) {
            h.postDelayed(new Runnable() {
                public void run() {
                    if (getBridge() != null && getBridge().getWebView() != null) getBridge().getWebView().evaluateJavascript(js, null);
                }
            }, k * 1500L);
        }
    }
}
