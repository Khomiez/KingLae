#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "secrets.h"

// --- Hardware Pins ---
const int buttonPinSOS = 34; // ขาเดิมสำหรับปุ่มฉุกเฉิน
const int buttonPinAck = 26; // ขาที่ต่อกับปุ่ม 4-pin (กดเพื่อ Acknowledged)
const int ledPin = 33;       // ขาที่ต่อกับ LED แสดงสถานะการเชื่อมต่อ
const int batteryLedPin = 32; // 💡 ขาที่ต่อกับ LED แสดงสถานะแบตเตอรี่

// --- Global Objects ---
WiFiClient espClient;
PubSubClient client(espClient);

// --- State Variables ---
int lastStateSOS = -1;
int lastStateAck = HIGH; 

unsigned long lastHeartbeat = 0;
const long heartbeatInterval = 30000; // 30 วินาที
unsigned long lastReconnectAttempt = 0;

// 💡 ตัวแปรจัดการแบตเตอรี่
int batteryLevel = 15; // จำลองค่าเริ่มต้นที่ 85%
unsigned long lastBatteryBlink = 0;
bool batteryLedState = false;

// --- Functions ---
void setup_wifi()
{
  delay(20);
  Serial.println();
  Serial.printf("Connecting to %s\n", ssid);

  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20)
  {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED)
  {
    Serial.printf("\nWiFi connected. IP address: %s\n", WiFi.localIP().toString().c_str());
  }
  else
  {
    Serial.println("\nWiFi connection failed! Continuing anyway...");
  }
}

bool reconnect()
{
  if (client.connected())
    return true;

  unsigned long now = millis();
  if (now - lastReconnectAttempt > 5000)
  {
    lastReconnectAttempt = now;
    Serial.print("Attempting MQTT connection...");

    // LWT topic
    char lwtTopic[64];
    snprintf(lwtTopic, sizeof(lwtTopic), "iot/device/%s/status", device_id);

    // Connect with LWT
    if (client.connect(device_id, lwtTopic, 1, true, "OFFLINE"))
    {
      Serial.println("connected");
      client.publish(lwtTopic, "ONLINE", true);
      
      // เปิดไฟ LED เมื่อเชื่อมต่อ MQTT สำเร็จ
      digitalWrite(ledPin, HIGH); 
      
      return true;
    }
    else
    {
      Serial.printf("failed, rc=%d. Try again in 5 seconds.\n", client.state());
      
      // ปิดไฟ LED หากเชื่อมต่อ MQTT ไม่สำเร็จ
      digitalWrite(ledPin, LOW); 
    }
  }
  return false;
}

void sendEvent(const char *eventType, const char *statusStr = "PENDING")
{
  if (!client.connected())
  {
    reconnect();
  }

  // สร้าง JSON Payload 
  JsonDocument doc;
  doc["device_mac"] = device_id; 
  doc["event_type"] = eventType;
  doc["status"] = statusStr;      
  doc["battery_level"] = batteryLevel; // 💡 ใช้ตัวแปร Global แทนค่าคงที่ที่ฮาร์ดโค้ดไว้

  char buffer[256];
  serializeJson(doc, buffer);

  char topic[64];
  snprintf(topic, sizeof(topic), "iot/device/%s/event", device_id);

  Serial.print("Publishing message: ");
  Serial.println(buffer);

  if (client.publish(topic, buffer))
  {
    Serial.println("✅ Published successfully");
  }
  else
  {
    Serial.println("❌ Failed to publish");
  }
}

void setup()
{
  Serial.begin(115200);

  pinMode(buttonPinSOS, INPUT);
  pinMode(buttonPinAck, INPUT_PULLUP); 
  
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);

  // 💡 ตั้งค่าพิน LED แบตเตอรี่
  pinMode(batteryLedPin, OUTPUT);
  digitalWrite(batteryLedPin, HIGH); // สมมติว่าเปิดเครื่องมาแบตยังดีอยู่ ให้ไฟติดค้างไว้ก่อน

  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);

  Serial.println("\n--- 🎛️ เริ่มระบบ CareLink IoT ---");
}

void loop()
{
  if (!client.connected())
  {
    digitalWrite(ledPin, LOW);
    reconnect();
  }
  client.loop();

  unsigned long now = millis(); // ดึงค่าเวลาปัจจุบันมาใช้ใน Loop

  // --- 💡 การจัดการ LED แสดงสถานะแบตเตอรี่ ---
  if (batteryLevel > 20) 
  {
    // แบตเตอรี่ปกติ (> 20%) ให้ไฟติดค้าง
    digitalWrite(batteryLedPin, HIGH);
  } 
  else 
  {
    // แบตเตอรี่อ่อน (<= 20%) ให้ไฟกะพริบเตือนทุกๆ 500 มิลลิวินาที
    if (now - lastBatteryBlink > 500) 
    {
      lastBatteryBlink = now;
      batteryLedState = !batteryLedState; // สลับสถานะ ปิด-เปิด
      digitalWrite(batteryLedPin, batteryLedState);
    }
  }

  // --- การจัดการปุ่ม SOS (พิน 34) ---
  int currentSOS = digitalRead(buttonPinSOS);
  if (currentSOS != lastStateSOS)
  {
    if (currentSOS == HIGH)
    {
      Serial.println("สถานะปุ่ม SOS: 🔴 HIGH (Button Pressed)");
      sendEvent("SOS", "PENDING"); 
    }
    delay(50); // Debounce
    lastStateSOS = currentSOS;
  }

  // --- การจัดการปุ่ม ACK (พิน 26) ---
  int currentAck = digitalRead(buttonPinAck);
  if (currentAck != lastStateAck)
  {
    if (currentAck == LOW)
    {
      Serial.println("สถานะปุ่ม ACK: 🟢 LOW (Button Pressed)");
      sendEvent("ASSIST", "ACKNOWLEDGED"); 
    }
    delay(50); // Debounce
    lastStateAck = currentAck;
  }

  // --- ส่งสถานะออนไลน์ (Heartbeat) ---
  if (now - lastHeartbeat > heartbeatInterval)
  {
    lastHeartbeat = now;
    char lwtTopic[64];
    snprintf(lwtTopic, sizeof(lwtTopic), "iot/device/%s/status", device_id);
    client.publish(lwtTopic, "ONLINE", true);
    Serial.println("💓 Heartbeat sent (ONLINE status)");
  }
}