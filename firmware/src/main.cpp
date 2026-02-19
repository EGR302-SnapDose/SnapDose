#include <Arduino.h>
#include <M5GFX.h>
#include <M5Unified.h>

void setup() {
  auto cfg = M5.config();
  M5.begin(cfg);

  Serial.begin(115200);
  M5.Display.setRotation(0);
  M5.Display.setBrightness(200);
  M5.Display.fillScreen(TFT_BLACK);

  M5.Display.setFont(&fonts::FreeMonoBold18pt7b);
  M5.Display.setTextColor(TFT_WHITE);
  M5.Display.setCursor(20, 100);
  M5.Display.print("SnapDose");

  M5.Display.setFont(&fonts::FreeMonoBold12pt7b);
  M5.Display.setCursor(20, 160);
  M5.Display.print("Tab5le Connected");

  Serial.println("SnapDose Tab5 ready");
}

void loop() {
  M5.update();
}