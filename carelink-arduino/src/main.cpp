#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "secrets.h"

// --- Hardware Pins ---
const int buttonPinRed = 34;    // 🔴 ปุ่มฉุกเฉิน (SOS)
const int buttonPinYellow = 26; // 🟡 ปุ่มเรียก Caregiver (ASSIST) - 💡 เพิ่มใหม่ (ใช้ GPIO27 หรือเปลี่ยนตามสะดวก)
const int buttonPinGreen = 27;  // 🟢 ปุ่ม 4-pin อเนกประสงค์ (GREEN_BTN)
const int ledPin = 33;          // 🔵 ขา LED แสดงสถานะการเชื่อมต่อ
const int batteryLedPin = 32;   // 🔋 ขา LED แสดงสถานะแบตเตอรี่
const int buttonPinBlue = 14;  // 🔵 ขาที่ต่อกับปุ่มสีน้ำเงิน (จำลอง Caregiver รับงาน)

// --- Global Objects ---
WiFiClient espClient;
PubSubClient client(espClient);

// --- State Variables ---
int lastStateRed = -1;
int lastStateYellow = HIGH; // ใช้ HIGH เพราะจะใช้ INPUT_PULLUP
int lastStateGreen = HIGH;  // ใช้ HIGH เพราะจะใช้ INPUT_PULLUP
int lastStateBlue = HIGH;      // ใช้ HIGH เพราะจะใช้ INPUT_PULLUP

unsigned long lastHeartbeat = 0;
const long heartbeatInterval = 30000; // 30 วินาที
unsigned long lastReconnectAttempt = 0;

int batteryLevel = 85; // 🔋 สมมติว่าชาร์จแบตมาเต็มแล้วสำหรับการนำเสนอ
unsigned long lastBatteryBlink = 0;
bool batteryLedState = false;

// --- Functions ---
void setup_wifi() {
  delay(20);
  Serial.println();
  Serial.printf("Connecting to %s\n", ssid);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\nWiFi connected. IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\nWiFi failed! Continuing...");
  }
}

bool reconnect() {
  if (client.connected()) return true;

  unsigned long now = millis();
  if (now - lastReconnectAttempt > 5000) {
    lastReconnectAttempt = now;
    Serial.print("Attempting MQTT connection...");

    char lwtTopic[64];
    snprintf(lwtTopic, sizeof(lwtTopic), "iot/device/%s/status", device_id);

    if (client.connect(device_id, lwtTopic, 1, true, "OFFLINE")) {
      Serial.println("connected");
      client.publish(lwtTopic, "ONLINE", true);
      digitalWrite(ledPin, HIGH); 
      return true;
    } else {
      Serial.printf("failed, rc=%d. Try again in 5s.\n", client.state());
      digitalWrite(ledPin, LOW); 
    }
  }
  return false;
}

void sendEvent(const char *eventType, const char *statusStr = "PENDING") {
  if (!client.connected()) {
    reconnect();
  }

  JsonDocument doc;
  doc["device_mac"] = device_id; 
  doc["event_type"] = eventType;
  doc["status"] = statusStr;      
  doc["battery_level"] = batteryLevel; 

  char buffer[256];
  serializeJson(doc, buffer);

  char topic[64];
  snprintf(topic, sizeof(topic), "iot/device/%s/event", device_id);

  Serial.print("Publishing message: ");
  Serial.println(buffer);

  if (client.publish(topic, buffer)) {
    Serial.println("✅ Published successfully");
  } else {
    Serial.println("❌ Failed to publish");
  }
}

void setup() {
  Serial.begin(115200);

  // 🎛️ ตั้งค่าปุ่มทั้ง 3 สี
  pinMode(buttonPinRed, INPUT);
  pinMode(buttonPinYellow, INPUT_PULLUP); // ต่อขาเข้า GPIO27 และ GND
  pinMode(buttonPinGreen, INPUT_PULLUP);  // ต่อขาเข้า GPIO26 และ GND
  pinMode(buttonPinBlue, INPUT_PULLUP); // ต่อขาเข้า GPIO14 และ GND
  
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);

  pinMode(batteryLedPin, OUTPUT);
  digitalWrite(batteryLedPin, HIGH); 

  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);

  Serial.println("\n--- 🎛️ เริ่มระบบ CareLink IoT ---");
}

void loop() {
  if (!client.connected()) {
    digitalWrite(ledPin, LOW);
    reconnect();
  }
  client.loop();

  unsigned long now = millis();

  // --- LED แสดงสถานะแบตเตอรี่ ---
  if (batteryLevel > 20) {
    digitalWrite(batteryLedPin, HIGH);
  } else {
    if (now - lastBatteryBlink > 500) {
      lastBatteryBlink = now;
      batteryLedState = !batteryLedState;
      digitalWrite(batteryLedPin, batteryLedState);
    }
  }

  // --- 🔴 ตรวจจับปุ่มสีแดง (SOS) ---
  int currentRed = digitalRead(buttonPinRed);
  if (currentRed != lastStateRed) {
    if (currentRed == HIGH) {
      Serial.println("สถานะ: 🔴 กดปุ่ม SOS");
      sendEvent("SOS", "PENDING"); // ➡️ ลง DB event_type = SOS
    }
    delay(50); // Debounce
    lastStateRed = currentRed;
  }

  // --- 🟡 ตรวจจับปุ่มสีเหลือง (ASSIST) ---
  int currentYellow = digitalRead(buttonPinYellow);
  if (currentYellow != lastStateYellow) {
    if (currentYellow == LOW) { // ใช้ LOW เพราะเป็น INPUT_PULLUP
      Serial.println("สถานะ: 🟡 กดปุ่ม เรียกทั่วไป");
      sendEvent("ASSIST", "PENDING"); // ➡️ ลง DB event_type = ASSIST
    }
    delay(50); // Debounce
    lastStateYellow = currentYellow;
  }

  // --- 🟢 ตรวจจับปุ่มสีเขียว (GREEN_BTN) ---
  int currentGreen = digitalRead(buttonPinGreen);
  if (currentGreen != lastStateGreen) {
    if (currentGreen == LOW) { // ใช้ LOW เพราะเป็น INPUT_PULLUP
      Serial.println("สถานะ: 🟢 กดปุ่ม สีเขียว (Context-Aware)");
      sendEvent("GREEN_BTN", "TRIGGERED"); // ➡️ ส่งให้ Backend เอาไปแปลความหมายต่อ
    }
    delay(50); // Debounce
    lastStateGreen = currentGreen;
  }
  
  // --- 🔵 จำลอง CAREGIVER ACCEPT (ปุ่มสีน้ำเงิน GPIO14) ---
  int currentBlue = digitalRead(buttonPinBlue);
  if (currentBlue != lastStateBlue) {
    if (currentBlue == LOW) { // ใช้ LOW เพราะเป็น INPUT_PULLUP
      Serial.println("สถานะ: 🔵 กดปุ่ม สีน้ำเงิน (จำลอง Caregiver กดรับงานผ่านแอป)");
      
      // ส่ง event_type เป็น BLUE_BTN เพื่อให้ Backend ไปจับคู่เงื่อนไข
      sendEvent("BLUE_BTN", "TRIGGERED"); 
    }
    delay(50); // Debounce
    lastStateBlue = currentBlue;
  }

  // --- Heartbeat ---
  if (now - lastHeartbeat > heartbeatInterval) {
    lastHeartbeat = now;
    char lwtTopic[64];
    snprintf(lwtTopic, sizeof(lwtTopic), "iot/device/%s/status", device_id);
    client.publish(lwtTopic, "ONLINE", true);
  }
}