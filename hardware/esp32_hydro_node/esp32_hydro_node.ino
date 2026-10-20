/*
 * HydroSmart - Node cảm biến bể dung dịch thủy canh (ESP32)
 * ----------------------------------------------------------
 * Gửi số đo pH, EC, nhiệt độ nước, DO, mực nước lên backend HydroSmart
 * theo ĐÚNG gói tin mà Trạm giả lập đang gửi:
 *
 *   POST http://<server>:5000/api/v1/sensors/telemetry/batch
 *   Header: Content-Type: application/json
 *           x-device-key: <DEVICE_API_KEY trong backend/.env>
 *   Body:
 *   {
 *     "deviceId": "ESP32-RES-01",
 *     "source": "sensor",
 *     "timestamp": "2026-10-20T10:15:00Z",   (giờ NTP, tuỳ chọn)
 *     "readings": [
 *       { "sensorCode": "SEN-PH-01",   "value": 5.92 },
 *       { "sensorCode": "SEN-EC-01",   "value": 1.74 },
 *       { "sensorCode": "SEN-TEMP-01", "value": 21.6 },
 *       { "sensorCode": "SEN-DO-01",   "value": 7.8  },
 *       { "sensorCode": "SEN-LVL-01",  "value": 88.5 }
 *     ]
 *   }
 *
 * Sơ đồ đấu nối (ESP32 DevKit V1):
 *   ADS1115 (I2C, địa chỉ 0x48): SDA=GPIO21, SCL=GPIO22, VCC=3V3
 *     A0 <- pH (DFRobot SEN0161-V2)
 *     A1 <- EC (DFRobot DFR0300, K=1)
 *     A2 <- DO (DFRobot SEN0237)
 *   DS18B20 (nhiệt độ nước): DATA=GPIO4 + điện trở kéo lên 4.7k về 3V3
 *   JSN-SR04T (mực nước): TRIG=GPIO26, ECHO=GPIO27 (qua cầu chia áp 5V->3.3V)
 *
 * Thư viện cần cài (Arduino Library Manager):
 *   - Adafruit ADS1X15
 *   - OneWire, DallasTemperature
 *   - ArduinoJson (v7)
 *
 * LƯU Ý: Hệ số hiệu chuẩn bên dưới là giá trị mẫu. Phải hiệu chuẩn bằng
 * dung dịch chuẩn pH 4.0 / 7.0 và EC 1.413 mS/cm trước khi dùng thật.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_ADS1X15.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ArduinoJson.h>

// ====== CẤU HÌNH (chỉ cần sửa phần này) ======
const char* WIFI_SSID     = "TEN_WIFI";
const char* WIFI_PASSWORD = "MAT_KHAU_WIFI";
const char* SERVER_URL    = "http://192.168.1.10:5000/api/v1/sensors/telemetry/batch";
const char* DEVICE_KEY    = "doi-thanh-DEVICE_API_KEY";
const char* DEVICE_ID     = "ESP32-RES-01";

// Mã cảm biến phải trùng với bảng sensors trong database
const char* CODE_PH   = "SEN-PH-01";
const char* CODE_EC   = "SEN-EC-01";
const char* CODE_TEMP = "SEN-TEMP-01";
const char* CODE_DO   = "SEN-DO-01";
const char* CODE_LVL  = "SEN-LVL-01";

const unsigned long SEND_INTERVAL_MS = 60UL * 1000UL; // gửi mỗi 60 giây

// Hình học bể để quy đổi khoảng cách siêu âm -> % mực nước
const float TANK_EMPTY_CM = 60.0;  // khoảng cách cảm biến -> đáy bể
const float TANK_FULL_CM  = 8.0;   // khoảng cách cảm biến -> mặt nước khi đầy

// Hiệu chuẩn pH 2 điểm (điện áp mV đo được ở pH 7.0 và pH 4.0)
float PH_V7 = 1500.0;
float PH_V4 = 2032.0;
// Hiệu chuẩn EC: hệ số K của đầu dò (giá trị mẫu 1.0). Cách lấy: nhúng đầu dò vào dung dịch
// chuẩn 1.413 mS/cm ở 25°C, K = 1.413 / rawEC (rawEC = giá trị in ra Serial khi K = 1.0).
float EC_K = 1.0;
// Hiệu chuẩn DO 1 điểm (DFRobot SEN0237): điện áp đầu dò khi để trong KHÔNG KHÍ bão hoà ẩm
// đo ở nhiệt độ DO_CAL_TEMP. Điện áp bão hoà của màng galvanic tăng ~35 mV mỗi °C.
float DO_SAT_MV = 1600.0;
float DO_CAL_TEMP = 25.0;

// Giờ thực (NTP) để gửi kèm "timestamp" - backend dùng làm thời điểm đo
const char* NTP_SERVER = "pool.ntp.org";
const long  GMT_OFFSET_SEC = 0; // gửi giờ UTC (ISO 8601 có hậu tố Z)

// ====== PHẦN CỨNG ======
#define ONE_WIRE_PIN 4
#define TRIG_PIN 26
#define ECHO_PIN 27

Adafruit_ADS1115 ads;
OneWire oneWire(ONE_WIRE_PIN);
DallasTemperature ds18b20(&oneWire);
unsigned long lastSend = 0;

// Độ hoà tan oxy bão hoà (mg/L) theo nhiệt độ, dùng cho DO
float doSaturation(float t) {
  return 14.652 - 0.41022 * t + 0.007991 * t * t - 0.000077774 * t * t * t;
}

float readMilliVolts(uint8_t ch) {
  long sum = 0;
  for (int i = 0; i < 10; i++) { sum += ads.readADC_SingleEnded(ch); delay(10); }
  return ads.computeVolts(sum / 10) * 1000.0;
}

float readWaterTemp() {
  ds18b20.requestTemperatures();
  float t = ds18b20.getTempCByIndex(0);
  return (t < -50 || t > 80) ? NAN : t;
}

float readPh() {
  float mv = readMilliVolts(0);
  float slope = (7.0 - 4.0) / (PH_V7 - PH_V4);
  return 7.0 + slope * (mv - PH_V7);
}

float readEc(float tempC) {
  float mv = readMilliVolts(1);
  // Công thức của thư viện DFRobot_EC cho DFR0300 (K=1): rawEC = 1000 * V / RES2 / ECREF
  // với RES2 = 820 Ω, ECREF = 200 → rawEC (mS/cm) = mV / 164
  float rawEc = 1000.0 * mv / 820.0 / 200.0;
  float ec25 = rawEc * EC_K / (1.0 + 0.0185 * (tempC - 25.0)); // bù nhiệt về 25°C
  return ec25;
}

float readDo(float tempC) {
  float mv = readMilliVolts(2);
  // Điện áp bão hoà ở nhiệt độ hiện tại (hiệu chuẩn 1 điểm, hệ số 35 mV/°C theo DFRobot)
  float vSat = DO_SAT_MV + 35.0 * (tempC - DO_CAL_TEMP);
  if (vSat <= 0) return NAN;
  // DO = tỷ lệ bão hoà × độ hoà tan oxy bão hoà ở nhiệt độ hiện tại
  return (mv / vSat) * doSaturation(tempC);
}

float readLevelPercent() {
  digitalWrite(TRIG_PIN, LOW); delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(20);
  digitalWrite(TRIG_PIN, LOW);
  long us = pulseIn(ECHO_PIN, HIGH, 30000);
  if (us == 0) return NAN;
  float cm = us * 0.0343 / 2.0;
  float pct = (TANK_EMPTY_CM - cm) / (TANK_EMPTY_CM - TANK_FULL_CM) * 100.0;
  return constrain(pct, 0.0, 100.0);
}

void addReading(JsonArray& arr, const char* code, float value, int digits) {
  if (isnan(value)) return; // cảm biến lỗi -> không gửi, backend sẽ báo mất tín hiệu
  JsonObject o = arr.add<JsonObject>();
  o["sensorCode"] = code;
  o["value"] = roundf(value * powf(10, digits)) / powf(10, digits);
}

void connectWifi() {
  if (WiFi.status() == WL_CONNECTED) return;
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Dang ket noi Wi-Fi");
  for (int i = 0; i < 40 && WiFi.status() != WL_CONNECTED; i++) { delay(500); Serial.print("."); }
  Serial.println(WiFi.status() == WL_CONNECTED ? " OK" : " THAT BAI");
}

void sendPacket() {
  float temp = readWaterTemp();
  float tComp = isnan(temp) ? 25.0 : temp;

  JsonDocument doc;
  doc["deviceId"] = DEVICE_ID;
  doc["source"] = "sensor";
  // Thời điểm đo (UTC). Nếu chưa đồng bộ được NTP thì bỏ trống, backend dùng giờ server.
  struct tm t;
  if (getLocalTime(&t, 50)) {
    char iso[25];
    strftime(iso, sizeof(iso), "%Y-%m-%dT%H:%M:%SZ", &t);
    doc["timestamp"] = iso;
  }
  JsonArray readings = doc["readings"].to<JsonArray>();
  addReading(readings, CODE_PH, readPh(), 2);
  addReading(readings, CODE_EC, readEc(tComp), 2);
  addReading(readings, CODE_TEMP, temp, 1);
  addReading(readings, CODE_DO, readDo(tComp), 1);
  addReading(readings, CODE_LVL, readLevelPercent(), 1);

  String body;
  serializeJson(doc, body);
  Serial.println(body);

  connectWifi();
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-key", DEVICE_KEY);
  int code = http.POST(body);
  Serial.printf("HTTP %d: %s\n", code, http.getString().c_str());
  http.end();
}

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  Wire.begin(21, 22);
  if (!ads.begin(0x48)) Serial.println("Khong tim thay ADS1115!");
  ads.setGain(GAIN_ONE); // dải ±4.096V
  ds18b20.begin();
  connectWifi();
  configTime(GMT_OFFSET_SEC, 0, NTP_SERVER);
}

void loop() {
  if (millis() - lastSend >= SEND_INTERVAL_MS || lastSend == 0) {
    lastSend = millis();
    sendPacket();
  }
}
