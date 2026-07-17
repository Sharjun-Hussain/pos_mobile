package com.inzeedo.pos;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.OutputStream;
import java.net.Socket;
import java.net.InetSocketAddress;
import android.util.Base64;
import android.util.Log;

@CapacitorPlugin(name = "LanPrinter")
public class LanPrinterPlugin extends Plugin {

    private static final String TAG = "LanPrinterPlugin";

    @PluginMethod
    public void connect(PluginCall call) {
        String ip = call.getString("ip");
        Integer port = call.getInt("port");
        
        if (ip == null || ip.isEmpty()) {
            call.reject("IP address is required");
            return;
        }
        
        int finalPort = (port != null) ? port : 9100;

        new Thread(() -> {
            try {
                Socket socket = new Socket();
                socket.connect(new InetSocketAddress(ip, finalPort), 3000); // 3 seconds timeout
                socket.close();
                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            } catch (Exception e) {
                Log.e(TAG, "Connection failed: " + e.getMessage());
                call.reject("Connection failed: " + e.getMessage());
            }
        }).start();
    }

    @PluginMethod
    public void print(PluginCall call) {
        String ip = call.getString("ip");
        Integer port = call.getInt("port");
        String dataStr = call.getString("data");

        if (ip == null || ip.isEmpty()) {
            call.reject("IP address is required");
            return;
        }
        
        if (dataStr == null || dataStr.isEmpty()) {
            call.reject("Data is required");
            return;
        }

        int finalPort = (port != null) ? port : 9100;

        new Thread(() -> {
            try {
                byte[] data = Base64.decode(dataStr, Base64.DEFAULT);
                Socket socket = new Socket();
                socket.connect(new InetSocketAddress(ip, finalPort), 3000);
                OutputStream os = socket.getOutputStream();
                os.write(data);
                os.flush();
                os.close();
                socket.close();
                
                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            } catch (Exception e) {
                Log.e(TAG, "Print failed: " + e.getMessage());
                call.reject("Print failed: " + e.getMessage());
            }
        }).start();
    }
}
