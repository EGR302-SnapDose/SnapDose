#include <Arduino.h>
#include <M5GFX.h>
#include <M5Unified.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include "config.h"

#define SDIO2_CLK GPIO_NUM_12
#define SDIO2_CMD GPIO_NUM_13
#define SDIO2_D0  GPIO_NUM_11
#define SDIO2_D1  GPIO_NUM_10
#define SDIO2_D2  GPIO_NUM_9
#define SDIO2_D3  GPIO_NUM_8
#define SDIO2_RST GPIO_NUM_15

static const unsigned long POLL_MS      = 5000;
static const unsigned long PAIR_POLL_MS = 2000;
static const unsigned long TTL_MS       = 600000UL;
static const unsigned long HB_MS        = 30000;
static const int           STEPS        = 40;

enum class St { WIFI_SEL, UNPAIRED, DISC, PAIRED, DELIVERING };
static St state = St::WIFI_SEL;
static Preferences prefs;

static String boundUid = "", pairCode = "", pairToken = "";
static unsigned long pairStart = 0, lastSec = ULONG_MAX;
static String aBid = "", aUid = "";
static double aUnits = 0;
static int dStep = 0, lastPct = -1;
static unsigned long lastDMs = 0, lastPollMs = 0, lastPairMs = 0, lastHbMs = 0;
static double resUnits = 300.0, todayU = 0.0, lastBU = 0.0;
static char lastBT[12] = "--:--";
static int bCount = 0;

struct WN { char ssid[33]; int rssi; };
static WN nets[12];
static int nCount = 0, nSel = -1;
static bool scanning = false;
static HTTPClient http;

// Screen dimensions — read at runtime from the display
static int SW = 800;
static int SH = 1280;

// Row height for all text blocks. Everything is laid out as multiples of ROW.
// With FreeMonoBold18pt7b the glyph is ~52px tall. We give 80px per row so
// there is always 28px of breathing room between rows.
#define ROW 80
// Left margin
#define MX  48

static void nLoad()  { prefs.begin("sd",true);  boundUid=prefs.getString("uid","");  prefs.end(); }
static void nSave(const String &u) { prefs.begin("sd",false); prefs.putString("uid",u); prefs.end(); }
static void nClr()   { prefs.begin("sd",false); prefs.clear(); prefs.end(); }
static String nGetSSID() { prefs.begin("sd",true); String s=prefs.getString("ssid",""); prefs.end(); return s; }
static String nGetPass() { prefs.begin("sd",true); String s=prefs.getString("pass",""); prefs.end(); return s; }
static void nSaveW(const char*s,const char*p) { prefs.begin("sd",false); prefs.putString("ssid",s); prefs.putString("pass",p); prefs.end(); }
static void addAuth() { http.addHeader("X-Device-Id",DEVICE_ID); http.addHeader("X-Device-Token",DEVICE_TOKEN); }
static bool ht(int tx,int ty,int x,int y,int w,int h) { return tx>=x&&tx<=x+w&&ty>=y&&ty<=y+h; }

// ── Draw primitives ───────────────────────────────────────────────────────────
// All functions take `top` = the Y pixel where the TOP of the text block starts.
// Internally they add the font ascent so the cursor is at the baseline.

// FreeMonoBold18pt7b: ascent≈42px, full row height fits in ROW=80
static void row18(int top, const char *t, uint32_t col=0xFFFF) {
    M5.Display.setFont(&fonts::FreeMonoBold18pt7b);
    M5.Display.setTextColor(col);
    M5.Display.setCursor(MX, top + 42);
    M5.Display.print(t);
}

// FreeMono9pt7b: ascent≈14px, use for labels above a row18
static void lbl(int top, const char *t) {
    M5.Display.setFont(&fonts::FreeMono9pt7b);
    M5.Display.setTextColor(0x8410);
    M5.Display.setCursor(MX, top + 14);
    M5.Display.print(t);
}

// Same as lbl but caller controls x so we can do two columns
static void lblX(int x, int top, const char *t) {
    M5.Display.setFont(&fonts::FreeMono9pt7b);
    M5.Display.setTextColor(0x8410);
    M5.Display.setCursor(x, top + 14);
    M5.Display.print(t);
}

static void row18X(int x, int top, const char *t, uint32_t col=0xFFFF) {
    M5.Display.setFont(&fonts::FreeMonoBold18pt7b);
    M5.Display.setTextColor(col);
    M5.Display.setCursor(x, top + 42);
    M5.Display.print(t);
}

// Thin divider line
static void div(int y) {
    M5.Display.drawFastHLine(0, y, SW, 0x4208);
}

// Solid primary button: white fill, black text
static void btnFill(int top, int h, const char *t) {
    M5.Display.fillRect(MX, top, SW - MX*2, h, 0xFFFF);
    M5.Display.setFont(&fonts::FreeMonoBold18pt7b);
    M5.Display.setTextColor(0x0000);
    int tw = strlen(t) * 22;
    M5.Display.setCursor(MX + (SW - MX*2 - tw)/2, top + h/2 + 12);
    M5.Display.print(t);
}

// Outline secondary button: gray border, gray text
static void btnOut(int top, int h, const char *t) {
    M5.Display.drawRect(MX, top, SW - MX*2, h, 0x8410);
    M5.Display.setFont(&fonts::FreeMonoBold18pt7b);
    M5.Display.setTextColor(0x8410);
    int tw = strlen(t) * 22;
    M5.Display.setCursor(MX + (SW - MX*2 - tw)/2, top + h/2 + 12);
    M5.Display.print(t);
}

// Progress bar
static void progBar(int top, int h, int pct, uint32_t col) {
    M5.Display.fillRect(MX, top, SW - MX*2, h, 0x2104);
    if (pct > 0) {
        int fw = (SW - MX*2) * pct / 100;
        if (fw > 0) M5.Display.fillRect(MX, top, fw, h, col);
    }
}

// ── Screen: WiFi Select ───────────────────────────────────────────────────────
// Layout (each item = ROW px tall):
//   [0]        Title "WiFi"           top=0
//   divider                           y=ROW
//   [1..7]     Network rows           top=ROW + i*ROW
//   (max 7 rows = 7*80=560, so rows end at 80+560=640)
//   divider                           y=700
//   Primary btn "Connect"             top=720, h=100
//   Secondary btn "Scan Again"        top=840, h=80
static void showWifi() {
    M5.Display.fillScreen(0x0000);
    row18(0, "WiFi");
    div(ROW);

    if (scanning) { row18(ROW + 20, "Scanning...", 0x8410); return; }

    for (int i = 0; i < nCount && i < 7; i++) {
        int top = ROW + i * ROW;
        if (i == nSel) M5.Display.fillRect(0, top, SW, ROW - 2, 0x2104);
        row18(top + 4, nets[i].ssid, i == nSel ? 0xFFFF : 0xC618);
        div(top + ROW);
    }

    int listEnd = ROW + min(nCount, 7) * ROW;
    int gap = 20;
    btnFill(listEnd + gap, 100, "Connect");
    btnOut(listEnd + gap + 116, 80, "Scan Again");
}

// ── Screen: Unpaired ─────────────────────────────────────────────────────────
// Fixed layout — every block is 2*ROW (label 20px + value 80px + 20px gap)
// Title           top=0     (ROW=80)
// div             y=80
// SERIAL          top=100   label; value top=120
// div             y=200
// FIRMWARE        top=220   label; value top=240
// div             y=320
// RESERVOIR       top=340   label; value top=360
// div             y=440
// gap
// Begin Pairing   top=480   h=120
// Change WiFi     top=620   h=80
static void showUnpaired() {
    M5.Display.fillScreen(0x0000);
    row18(0, "SnapDose");
    div(ROW);

    lbl(100, "SERIAL");
    row18(122, DEVICE_ID);
    div(210);

    lbl(230, "FIRMWARE");
    row18(252, FIRMWARE_VERSION);
    div(340);

    char rs[20]; snprintf(rs, sizeof(rs), "%.0f / 300 U", resUnits);
    lbl(360, "RESERVOIR");
    row18(382, rs);
    div(470);

    btnFill(500, 120, "Begin Pairing");
    btnOut(640, 80, "Change WiFi");
}

// ── Screen: Discoverable ─────────────────────────────────────────────────────
// Title           top=0
// div             y=80
// instruction     top=100
// Code box        y=170 .. y=370  (200px tall)
// Expires label   top=390
// Progress bar    y=420 h=16
// div             y=450
// SERIAL label    top=470
// SERIAL value    top=492
// div             y=580
// Cancel btn      top=600  h=80
static void showDisc(const String &code, unsigned long rem) {
    M5.Display.fillScreen(0x0000);
    row18(0, "SnapDose");
    div(ROW);

    lbl(100, "Enter this code in the app:");

    // Code box
    M5.Display.drawRect(MX, 170, SW - MX*2, 200, 0xFFFF);
    M5.Display.setFont(&fonts::FreeMonoBold24pt7b);
    M5.Display.setTextColor(0xFFFF);
    int digitPx = 54;
    int boxW = SW - MX*2;
    int startX = MX + (boxW - (int)code.length() * digitPx) / 2;
    M5.Display.setCursor(startX, 170 + 140); // baseline inside box
    M5.Display.print(code);

    unsigned long secs = rem / 1000;
    char ts[24]; snprintf(ts, sizeof(ts), "Expires: %lu:%02lu", secs/60, secs%60);
    lbl(388, ts);

    progBar(420, 16, (int)(rem * 100 / TTL_MS), 0xFFFF);
    div(450);

    lbl(470, "SERIAL");
    row18(492, DEVICE_ID);
    div(580);

    btnOut(600, 80, "Cancel");
}

// ── Screen: Paired ────────────────────────────────────────────────────────────
// Title           top=0
// div             y=80
// RESERVOIR lbl   top=100
// RESERVOIR val   top=122
// progress bar    y=210 h=16
// div             y=240
// TODAY/BOLUSES   labels top=260
// values          top=282
// div             y=370
// LAST BOLUS lbl  top=390
// value           top=412
// div             y=500
// STATUS lbl      top=520
// value           top=542
// div             y=630
// Change WiFi btn top=650  h=80
static void showPaired() {
    M5.Display.fillScreen(0x0000);
    row18(0, "SnapDose");
    div(ROW);

    char rs[16]; snprintf(rs, sizeof(rs), "%.0f U", resUnits);
    uint32_t rc = resUnits > 90 ? 0xFFFF : resUnits > 30 ? 0xFFE0 : 0xF800;
    lbl(100, "RESERVOIR");
    row18(122, rs, rc);
    progBar(210, 16, (int)(resUnits/300.0*100), rc);
    div(240);

    // Two columns: TODAY left, BOLUSES right
    int col2 = SW / 2;
    char tu[12]; snprintf(tu, sizeof(tu), "%.1f U", todayU);
    char bc[8];  snprintf(bc, sizeof(bc), "%d",    bCount);
    lblX(MX,    260, "TODAY");
    lblX(col2,  260, "BOLUSES");
    row18X(MX,   282, tu);
    row18X(col2, 282, bc);
    div(370);

    lbl(390, "LAST BOLUS");
    if (lastBU > 0) {
        char lb[28]; snprintf(lb, sizeof(lb), "%.2f U  at  %s", lastBU, lastBT);
        row18(412, lb);
    } else {
        row18(412, "None yet", 0x8410);
    }
    div(500);

    lbl(520, "STATUS");
    row18(542, "Waiting for dose...", 0x8410);
    div(630);

    btnOut(650, 80, "Change WiFi");
}

// ── Screen: Delivering (static) ───────────────────────────────────────────────
// Title           top=0
// div             y=80
// DELIVERING lbl  top=100
// dose value      top=122
// div             y=210
// PROGRESS lbl    top=230
// [dynamic zone starts at y=260]
static void showDelivStatic(double u) {
    M5.Display.fillScreen(0x0000);
    row18(0, "SnapDose");
    div(ROW);

    lbl(100, "DELIVERING");
    char us[16]; snprintf(us, sizeof(us), "%.2f U", u);
    row18(122, us);
    div(210);

    lbl(230, "PROGRESS");
}

// Dynamic zone only — no fillScreen
static void showDelivProg(double u, int pct) {
    M5.Display.fillRect(0, 260, SW, 700, 0x0000);

    progBar(260, 32, pct, 0xFFFF);

    char ps[8]; snprintf(ps, sizeof(ps), "%d%%", pct);
    row18(310, ps);

    double del = u * pct / 100.0;
    char ds[28]; snprintf(ds, sizeof(ds), "%.3f U delivered", del);
    row18(400, ds, 0xC618);

    char rs2[32]; snprintf(rs2, sizeof(rs2), "Reservoir: %.0f U", resUnits - del);
    lbl(480, rs2);
}

static void showDone(double u) {
    M5.Display.fillScreen(0x0000);
    row18(0, "SnapDose");
    div(ROW);

    lbl(160, "COMPLETE");
    char us[16]; snprintf(us, sizeof(us), "%.2f U", u);
    row18(182, us, 0x07E0);

    row18(300, "Delivered.", 0xC618);

    char rs2[32]; snprintf(rs2, sizeof(rs2), "Reservoir: %.0f U left", resUnits);
    lbl(400, rs2);
}

// ── API ───────────────────────────────────────────────────────────────────────
static bool apiReg() {
    http.begin(String(API_BASE_URL)+"/api/devices/register");
    http.addHeader("Content-Type","application/json"); addAuth();
    String b; JsonDocument d;
    d["serialNumber"]=DEVICE_ID; d["model"]="OmniPod 5 Simulator"; d["firmwareVersion"]=FIRMWARE_VERSION;
    serializeJson(d,b); int c=http.POST(b); http.end(); return c>=200&&c<300;
}
static void apiStale() {
    http.begin(String(API_BASE_URL)+"/api/pump/"+String(DEVICE_ID)+"/fail-stale");
    http.addHeader("Content-Type","application/json"); addAuth(); http.POST("{}"); http.end();
}
static bool apiPairStart() {
    http.begin(String(API_BASE_URL)+"/api/devices/"+String(DEVICE_ID)+"/start-pairing");
    http.addHeader("Content-Type","application/json"); addAuth(); int c=http.POST("{}");
    if (c==200) {
        String p=http.getString(); http.end(); JsonDocument d;
        if (deserializeJson(d,p)==DeserializationError::Ok) {
            pairToken=d["pairingToken"]|""; pairCode=d["pairingCode"]|"";
            return !pairToken.isEmpty();
        }
    }
    http.end(); return false;
}
static bool apiPairPoll() {
    http.begin(String(API_BASE_URL)+"/api/devices/"+String(DEVICE_ID)+"/pair-status");
    addAuth(); int c=http.GET();
    if (c==200) {
        String p=http.getString(); http.end(); JsonDocument d;
        if (deserializeJson(d,p)==DeserializationError::Ok) {
            String s=d["status"]|"";
            if (s=="PAIRED") { boundUid=d["boundToUid"]|""; return true; }
        }
    }
    http.end(); return false;
}
static bool apiStillPaired() {
    http.begin(String(API_BASE_URL)+"/api/devices/"+String(DEVICE_ID)+"/pair-status");
    addAuth(); int c=http.GET();
    if (c==200) {
        String p=http.getString(); http.end(); JsonDocument d;
        if (deserializeJson(d,p)==DeserializationError::Ok) {
            String s=d["status"]|""; return s=="PAIRED";
        }
    }
    http.end(); return false;
}
static bool apiAck(const String &u, const String &b) {
    http.begin(String(API_BASE_URL)+"/api/bolus/"+u+"/"+b+"/acknowledge");
    http.addHeader("Content-Type","application/json"); addAuth();
    int c=http.POST("{}"); http.end(); return c>=200&&c<300;
}
static bool apiConf(const String &u, const String &b, double v) {
    http.begin(String(API_BASE_URL)+"/api/bolus/"+u+"/"+b+"/confirm");
    http.addHeader("Content-Type","application/json"); addAuth();
    String body; JsonDocument d; d["unitsDelivered"]=v; serializeJson(d,body);
    int c=http.POST(body); http.end(); return c>=200&&c<300;
}
static void apiHB() {
    http.begin(String(API_BASE_URL)+"/api/devices/"+String(DEVICE_ID)+"/heartbeat");
    http.addHeader("Content-Type","application/json"); addAuth(); http.POST("{}"); http.end();
}

// ── Transitions ───────────────────────────────────────────────────────────────
static void goUnpaired() {
    state=St::UNPAIRED; boundUid=pairToken=pairCode="";
    nClr(); showUnpaired();
}
static void goDisc() {
    if (WiFi.status()!=WL_CONNECTED) return;
    if (!apiPairStart()) return;
    state=St::DISC; pairStart=millis(); lastPairMs=0; lastSec=ULONG_MAX;
    showDisc(pairCode, TTL_MS);
}
static void goPaired(const String &u) {
    boundUid=u; nSave(u); state=St::PAIRED; showPaired();
}
static void goDeliv(const String &u, const String &b, double v) {
    if (!apiAck(u,b)) return;
    aBid=b; aUid=u; aUnits=v; dStep=0; lastPct=-1; lastDMs=millis();
    state=St::DELIVERING; showDelivStatic(v); showDelivProg(v,0);
}

// ── WiFi ──────────────────────────────────────────────────────────────────────
static void doScan() {
    scanning=true; nCount=0; nSel=-1; showWifi();
    int n=WiFi.scanNetworks();
    if (n>0) {
        nCount=min(n,12);
        for (int i=0;i<nCount;i++) {
            strncpy(nets[i].ssid, WiFi.SSID(i).c_str(), 32);
            nets[i].ssid[32]='\0'; nets[i].rssi=WiFi.RSSI(i);
        }
    }
    WiFi.scanDelete(); scanning=false; showWifi();
}
static void doConnect(int idx) {
    if (idx<0||idx>=nCount) return;
    const char *ssid=nets[idx].ssid, *pass="";
    if (strcmp(ssid,WIFI_SSID)==0)   pass=WIFI_PASS;
    if (strcmp(ssid,WIFI_SSID_2)==0) pass=WIFI_PASS_2;
    M5.Display.fillScreen(0x0000);
    row18(0, "Connecting...");
    row18(ROW + 20, ssid, 0xC618);
    WiFi.disconnect(false); delay(300); WiFi.mode(WIFI_STA); WiFi.begin(ssid,pass);
    for (int i=0;i<30&&WiFi.status()!=WL_CONNECTED;i++) delay(500);
    if (WiFi.status()==WL_CONNECTED) {
        nSaveW(ssid,pass); nLoad();
        if (!boundUid.isEmpty()&&apiStillPaired()) goPaired(boundUid);
        else goUnpaired();
    } else {
        state=St::WIFI_SEL; doScan();
    }
}

// ── Touch ─────────────────────────────────────────────────────────────────────
static void handleTouch() {
    if (!M5.Touch.getCount()) return;
    auto t=M5.Touch.getDetail(0);
    if (!t.wasPressed()) return;
    int tx=t.x, ty=t.y;

    switch (state) {
        case St::WIFI_SEL: {
            int listEnd = ROW + min(nCount,7)*ROW;
            int gap = 20;
            if (ht(tx,ty,MX,listEnd+gap+116,SW-MX*2,80)) { doScan(); return; }
            if (nSel>=0 && ht(tx,ty,MX,listEnd+gap,SW-MX*2,100)) { doConnect(nSel); return; }
            for (int i=0;i<nCount&&i<7;i++) {
                int top=ROW+i*ROW;
                if (ht(tx,ty,0,top,SW,ROW)) { nSel=(nSel==i)?-1:i; showWifi(); return; }
            }
            break;
        }
        case St::UNPAIRED:
            if (ht(tx,ty,MX,500,SW-MX*2,120)) { goDisc(); return; }
            if (ht(tx,ty,MX,640,SW-MX*2,80))  { state=St::WIFI_SEL; doScan(); return; }
            break;
        case St::DISC:
            if (ht(tx,ty,MX,600,SW-MX*2,80)) { lastSec=ULONG_MAX; goUnpaired(); return; }
            break;
        case St::PAIRED:
            if (ht(tx,ty,MX,650,SW-MX*2,80)) { state=St::WIFI_SEL; doScan(); return; }
            break;
        default: break;
    }
}

// ── Tick ──────────────────────────────────────────────────────────────────────
static void tickDisc() {
    unsigned long now=millis(), el=now-pairStart;
    if (el>=TTL_MS) { lastSec=ULONG_MAX; goUnpaired(); return; }
    unsigned long rem=TTL_MS-el, secs=rem/1000;
    if (secs!=lastSec) { lastSec=secs; showDisc(pairCode,rem); }
    if (now-lastPairMs>=PAIR_POLL_MS) {
        lastPairMs=now;
        if (apiPairPoll()) { lastSec=ULONG_MAX; goPaired(boundUid); }
    }
}
static void tickPaired() {
    unsigned long now=millis();
    if (now-lastHbMs>=HB_MS) {
        lastHbMs=now; apiHB();
        if (!apiStillPaired()) { goUnpaired(); return; }
    }
    if (now-lastPollMs>=POLL_MS) {
        lastPollMs=now;
        http.begin(String(API_BASE_URL)+"/api/pump/"+String(DEVICE_ID)+"/pending");
        addAuth(); int c=http.GET();
        if (c==204) { http.end(); return; }
        if (c==200) {
            String p=http.getString(); http.end(); JsonDocument d;
            if (deserializeJson(d,p)!=DeserializationError::Ok) return;
            String b=d["bolusId"]|"", u=d["userId"]|""; double v=d["unitsRequested"]|0.0;
            if (!b.isEmpty()&&!u.isEmpty()) goDeliv(u,b,v);
        } else { String b=http.getString(); http.end(); Serial.printf("[poll] %d\n",c); }
    }
}
static void tickDeliv() {
    unsigned long now=millis();
    unsigned long si=max(100UL,(unsigned long)(aUnits*1000)/STEPS);
    if (now-lastDMs<si) return;
    lastDMs=now; dStep++;
    int pct=(dStep*100)/STEPS;
    if (pct!=lastPct) { lastPct=pct; showDelivProg(aUnits,pct); }
    if (dStep<STEPS) return;

    resUnits=max(0.0,resUnits-aUnits);
    todayU+=aUnits; lastBU=aUnits; bCount++;
    unsigned long sec=millis()/1000;
    snprintf(lastBT,sizeof(lastBT),"%02lu:%02lu",(sec/3600)%24,(sec/60)%60);

    showDone(aUnits);
    apiConf(aUid,aBid,aUnits);
    delay(2500);
    aBid=aUid=""; aUnits=0; dStep=0; lastPct=-1;
    state=St::PAIRED; showPaired();
}

// ── Setup / Loop ──────────────────────────────────────────────────────────────
void setup() {
    heap_caps_malloc_extmem_enable(128*1024);
    Serial.begin(115200); delay(500);
    auto cfg=M5.config(); M5.begin(cfg);
    M5.Display.setRotation(0);
    M5.Display.setBrightness(220);

    SW = M5.Display.width();
    SH = M5.Display.height();
    Serial.printf("[display] %dx%d\n", SW, SH);

    M5.Display.fillScreen(0x0000);
    row18(0, "SnapDose");
    div(ROW);
    row18(ROW + 20, "Starting up...", 0x8410);

    WiFi.setPins(SDIO2_CLK,SDIO2_CMD,SDIO2_D0,SDIO2_D1,SDIO2_D2,SDIO2_D3,SDIO2_RST);
    WiFi.mode(WIFI_STA);

    bool conn=false;
    String ss=nGetSSID(), sp=nGetPass();
    const char *tryS[3]={ss.c_str(), WIFI_SSID, WIFI_SSID_2};
    const char *tryP[3]={sp.c_str(), WIFI_PASS,  WIFI_PASS_2};
    int si = ss.isEmpty() ? 1 : 0;

    for (int c=si; c<3&&!conn; c++) {
        if (!strlen(tryS[c])) continue;
        M5.Display.fillRect(0, ROW*2+20, SW, ROW, 0x0000);
        row18(ROW*2+20, tryS[c], 0x8410);
        WiFi.begin(tryS[c], tryP[c]);
        for (int i=0;i<24&&WiFi.status()!=WL_CONNECTED;i++) delay(500);
        conn=(WiFi.status()==WL_CONNECTED);
        if (!conn) { WiFi.disconnect(false); delay(500); }
    }

    if (!conn) { state=St::WIFI_SEL; doScan(); return; }
    apiReg(); apiStale();
    nLoad();
    if (!boundUid.isEmpty()&&apiStillPaired()) goPaired(boundUid);
    else { nClr(); boundUid=""; goUnpaired(); }
}

void loop() {
    M5.update();
    if (state!=St::WIFI_SEL)
        if (WiFi.status()!=WL_CONNECTED) { WiFi.reconnect(); delay(1000); return; }
    handleTouch();
    switch (state) {
        case St::DISC:       tickDisc();   break;
        case St::PAIRED:     tickPaired(); break;
        case St::DELIVERING: tickDeliv();  break;
        default: break;
    }
    delay(50);
}