#include <Arduino.h>
#include <M5GFX.h>
#include <M5Unified.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "config.h"

#define SDIO2_CLK GPIO_NUM_12
#define SDIO2_CMD GPIO_NUM_13
#define SDIO2_D0  GPIO_NUM_11
#define SDIO2_D1  GPIO_NUM_10
#define SDIO2_D2  GPIO_NUM_9
#define SDIO2_D3  GPIO_NUM_8
#define SDIO2_RST GPIO_NUM_15

static const unsigned long POLL_INTERVAL_MS = 5000;

/**
 * Helper function to add device authentication headers to HTTP requests
 */
void addDeviceAuthHeaders(HTTPClient &http) {
    http.addHeader("X-Device-Id", DEVICE_ID);
    http.addHeader("X-Device-Token", DEVICE_TOKEN);
}

bool wifiConnected = false;
unsigned long lastPollTime = 0;

String activeBolusId = "";
String activeUserId = "";
double activeUnits = 0;


void drawHeader() {
    M5.Display.fillScreen(TFT_BLACK);
    M5.Display.setFont(&fonts::FreeMonoBold18pt7b);
    M5.Display.setTextColor(TFT_WHITE);
    M5.Display.setCursor(20, 40);
    M5.Display.print("SnapDose");
}

void drawStatus(const char* line1, const char* line2, uint16_t color) {
    drawHeader();
    M5.Display.setFont(&fonts::FreeMonoBold12pt7b);
    M5.Display.setTextColor(color);
    M5.Display.setCursor(20, 100);
    M5.Display.print(line1);
    M5.Display.setFont(&fonts::FreeMono9pt7b);
    M5.Display.setTextColor(TFT_WHITE);
    M5.Display.setCursor(20, 140);
    M5.Display.print(line2);
}

void drawIdle() {
    drawHeader();
    M5.Display.setFont(&fonts::FreeMonoBold12pt7b);
    M5.Display.setTextColor(TFT_GREEN);
    M5.Display.setCursor(20, 100);
    M5.Display.print("Ready");

    M5.Display.setFont(&fonts::FreeMono9pt7b);
    M5.Display.setTextColor(TFT_WHITE);
    M5.Display.setCursor(20, 140);
    M5.Display.printf("IP: %s", WiFi.localIP().toString().c_str());
    M5.Display.setCursor(20, 165);
    M5.Display.printf("Device: %s", DEVICE_ID);
    M5.Display.setCursor(20, 190);
    M5.Display.printf("RSSI: %d dBm", WiFi.RSSI());
    M5.Display.setCursor(20, 225);
    M5.Display.print("Waiting for bolus...");
}

void drawDelivering(double units, int progressPct) {
    drawHeader();
    M5.Display.setFont(&fonts::FreeMonoBold12pt7b);
    M5.Display.setTextColor(TFT_YELLOW);
    M5.Display.setCursor(20, 100);
    M5.Display.print("Delivering Insulin");

    M5.Display.setFont(&fonts::FreeMonoBold18pt7b);
    M5.Display.setTextColor(TFT_WHITE);
    M5.Display.setCursor(20, 160);
    M5.Display.printf("%.2f U", units);

    int barX = 20;
    int barY = 200;
    int barW = M5.Display.width() - 40;
    int barH = 30;
    M5.Display.drawRect(barX, barY, barW, barH, TFT_WHITE);
    int fillW = (barW - 4) * progressPct / 100;
    M5.Display.fillRect(barX + 2, barY + 2, fillW, barH - 4, TFT_GREEN);

    M5.Display.setFont(&fonts::FreeMono9pt7b);
    M5.Display.setTextColor(TFT_WHITE);
    M5.Display.setCursor(20, 260);
    M5.Display.printf("Progress: %d%%", progressPct);
}

void drawComplete(double units) {
    drawHeader();
    M5.Display.setFont(&fonts::FreeMonoBold12pt7b);
    M5.Display.setTextColor(TFT_GREEN);
    M5.Display.setCursor(20, 100);
    M5.Display.print("Delivery Complete");

    M5.Display.setFont(&fonts::FreeMonoBold18pt7b);
    M5.Display.setTextColor(TFT_WHITE);
    M5.Display.setCursor(20, 160);
    M5.Display.printf("%.2f U delivered", units);
}

int acknowledgeBolus(const String &userId, const String &bolusId) {
    String url = String(API_BASE_URL) + "/api/bolus/" + userId + "/" + bolusId + "/acknowledge";
    
    HTTPClient http;
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    addDeviceAuthHeaders(http);
    int httpCode = http.POST("{}");  // Send empty JSON object
    http.end();

    if (httpCode >= 200 && httpCode < 300) {
        Serial.printf("Bolus acknowledged: %s\n", bolusId.c_str());
    } else {
        Serial.printf("Acknowledge failed, HTTP %d\n", httpCode);
    }
    
    return httpCode;
}

int confirmDelivery(const String &userId, const String &bolusId, double units) {
    String url = String(API_BASE_URL) + "/api/bolus/" + userId + "/" + bolusId + "/confirm";
    String body = "{\"status\":\"COMPLETED\",\"unitsDelivered\":" + String(units, 2) + "}";

    HTTPClient http;
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    addDeviceAuthHeaders(http);
    int httpCode = http.POST(body);
    http.end();

    if (httpCode >= 200 && httpCode < 300) {
        Serial.printf("Delivery confirmed for bolus %s\n", bolusId.c_str());
    } else if (httpCode == 409) {
        Serial.printf("Confirm returned 409 (already processed)\n");
    } else {
        Serial.printf("Confirm failed, HTTP %d\n", httpCode);
    }
    
    return httpCode;
}

void simulateDelivery() {
    Serial.printf("Starting delivery: %.2f U (bolus %s)\n", activeUnits, activeBolusId.c_str());

    // Step 1: Acknowledge the bolus (PENDING → ACKNOWLEDGED)
    int ackStatus = acknowledgeBolus(activeUserId, activeBolusId);
    if (ackStatus < 200 || ackStatus >= 300) {
        Serial.printf("Failed to acknowledge bolus, aborting delivery\n");
        activeBolusId = "";
        activeUserId = "";
        activeUnits = 0;
        drawIdle();
        return;
    }

    // Step 2: Simulate delivery
    int steps = 20;
    int delayPerStep = max(100, (int)(activeUnits * 1000) / steps);

    for (int i = 1; i <= steps; i++) {
        int pct = (i * 100) / steps;
        drawDelivering(activeUnits, pct);
        delay(delayPerStep);
    }

    // Step 3: Confirm delivery (ACKNOWLEDGED → DELIVERING → COMPLETED)
    drawComplete(activeUnits);
    int confirmStatus = confirmDelivery(activeUserId, activeBolusId, activeUnits);
    Serial.printf("Delivery complete: %.2f U\n", activeUnits);

    delay(3000);
    activeBolusId = "";
    activeUserId = "";
    activeUnits = 0;
    drawIdle();
}


void pollForBolus() {
    if (millis() - lastPollTime < POLL_INTERVAL_MS) return;
    lastPollTime = millis();

    String url = String(API_BASE_URL) + "/api/pump/" + DEVICE_ID + "/pending";
    HTTPClient http;
    http.begin(url);
    addDeviceAuthHeaders(http);
    int httpCode = http.GET();

    if (httpCode == 204) {
        http.end();
        return;
    }

    if (httpCode == 200) {
        String payload = http.getString();
        http.end();

        JsonDocument doc;
        DeserializationError err = deserializeJson(doc, payload);
        if (err) {
            Serial.printf("JSON parse error: %s\n", err.c_str());
            return;
        }

        activeBolusId = doc["bolusId"].as<String>();
        activeUserId = doc["userId"].as<String>();
        activeUnits = doc["unitsRequested"].as<double>();

        Serial.printf("Received bolus command: %s (%.2f U)\n", activeBolusId.c_str(), activeUnits);
        simulateDelivery();
    } else {
        http.end();
        Serial.printf("Poll failed, HTTP %d\n", httpCode);
    }
}

void setup() {
    Serial.begin(115200);
    delay(500);
    Serial.println("Starting setup...");
    
    auto cfg = M5.config();
    M5.begin(cfg);
    
    Serial.println("M5 initialized");
    M5.Display.setRotation(0);
    M5.Display.setBrightness(200);
    M5.Display.fillScreen(TFT_BLACK);

    drawStatus("Booting...", "SnapDose Pump Simulator", TFT_WHITE);

    WiFi.setPins(SDIO2_CLK, SDIO2_CMD, SDIO2_D0, SDIO2_D1, SDIO2_D2, SDIO2_D3, SDIO2_RST);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASS);

    drawStatus("Connecting WiFi...", WIFI_SSID, TFT_YELLOW);
    Serial.printf("Connecting to WiFi: %s\n", WIFI_SSID);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        wifiConnected = true;
        Serial.printf("\nConnected! IP: %s\n", WiFi.localIP().toString().c_str());
        drawIdle();
    } else {
        wifiConnected = false;
        Serial.println("\nWiFi connection failed");
        drawStatus("WiFi Failed", "Check credentials", TFT_RED);
    }
}

void loop() {
    M5.update();

    if (wifiConnected && WiFi.status() == WL_CONNECTED) {
        pollForBolus();
    } else if (wifiConnected && WiFi.status() != WL_CONNECTED) {
        wifiConnected = false;
        drawStatus("WiFi Lost", "Reconnecting...", TFT_RED);
        WiFi.reconnect();
        int attempts = 0;
        while (WiFi.status() != WL_CONNECTED && attempts < 20) {
            delay(500);
            attempts++;
        }
        if (WiFi.status() == WL_CONNECTED) {
            wifiConnected = true;
            drawIdle();
        }
    }

    delay(100);
}