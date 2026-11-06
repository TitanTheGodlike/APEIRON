package io.github.titanthegodlike.apeiron;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.ValueCallback;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** Runs the single-file game from the app's assets in a full-screen WebView, fully offline. */
public class MainActivity extends Activity {
    private WebView web;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);           // the save lives in localStorage
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(true);
        s.setTextZoom(100);                    // keep the layout stable with large system fonts
        web.setWebViewClient(new WebViewClient() {
            // web links (like Report a bug) open in the phone's browser, the game stays where it is
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                String scheme = u.getScheme();
                if ("http".equals(scheme) || "https".equals(scheme)) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception e) { /* no browser installed */ }
                    return true;
                }
                return false;
            }
        });
        web.setWebChromeClient(new WebChromeClient());
        setContentView(web);
        if (state != null) web.restoreState(state);
        else web.loadUrl("file:///android_asset/index.html");
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onPause() {
        // save the game whenever the app goes to the background
        web.evaluateJavascript("typeof save === 'function' && save()", null);
        web.onPause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
    }

    @Override
    public void onBackPressed() {
        // the game decides first: Back closes an open window or story chapter, then returns to Generators;
        // only when there is nothing left to close does the app go to the background
        web.evaluateJavascript("(window.apeironBack && window.apeironBack()) ? 'yes' : 'no'", new ValueCallback<String>() {
            @Override
            public void onReceiveValue(String handled) {
                if (!"\"yes\"".equals(handled)) moveTaskToBack(true);
            }
        });
    }
}
