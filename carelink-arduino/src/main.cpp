#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "secrets.h"

// --- Hardware Pins ---
const int buttonPin = 34; // ขาที่ต่อกับช่อง OUT ของปุ่ม

// --- Global Objects ---
WiFiClient espClient;
PubSubClient client(espClient);

// --- State Variables ---
int lastState = -1;
unsigned long lastHeartbeat = 0;
const long heartbeatInterval = 30000; // 30 วินาที
unsigned long lastReconnectAttempt = 0;

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
      return true;
    }
    else
    {
      Serial.printf("failed, rc=%d. Try again in 5 seconds.\n", client.state());
    }
  }
  return false;
}

void sendEvent(const char *eventType)
{
  if (!client.connected())
  {
    reconnect();
  }

  // สร้าง JSON Payload ตาม schema ในฐานข้อมูล
  JsonDocument doc;
  doc["device_mac"] = device_id; // ใช้ device_id เป็น MAC address
  doc["event_type"] = eventType;
  doc["status"] = "PENDING";      // ค่าเริ่มต้นสำหรับ event ใหม่คือ PENDING
  doc["battery_level"] = 85;      // จำลองแบตเตอรี่ (ควรเป็น % 0-100 ตาม schema)

  char buffer[256];
  serializeJson(doc, buffer);

  // ส่งไปที่ Topic: iot/device/[mac]/event
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

  pinMode(buttonPin, INPUT);

  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);

  Serial.println("\n--- 🎛️ เริ่มระบบ CareLink IoT ---");

  // ส่ง Event เริ่มต้น (ใช้ SOS หรือเว้นไว้ถ้าระบบ bridge รองรับ heartbeat แยก)
  // ในที่นี้เราจะไม่ส่ง event ไปที่ตาราง events โดยตรงถ้าเป็นแค่ heartbeat
}

void loop()
{
  if (!client.connected())
  {
    reconnect();
  }
  client.loop();

  // --- การจัดการปุ่ม ---
  int currentState = digitalRead(buttonPin);

  if (currentState != lastState)
  {
    if (currentState == HIGH)
    {
      Serial.println("สถานะปุ่ม: 🟢 HIGH (Button Pressed)");
      // ส่ง SOS ไปยัง database (ผ่าน MQTT Bridge)
      sendEvent("SOS");
    }
    else
    {
      Serial.println("สถานะปุ่ม: 🔴 LOW (Button Released)");
    }

    delay(50); // Debounce
    lastState = currentState;
  }

  // --- ส่งสถานะออนไลน์ (Heartbeat) ไปที่ topic แยกถ้ามี หรือใช้วิธีอื่น ---
  unsigned long now = millis();
  if (now - lastHeartbeat > heartbeatInterval)
  {
    lastHeartbeat = now;
    // เผยแพร่ status ไปที่ topic สำหรับ LWT/Status
    char lwtTopic[64];
    snprintf(lwtTopic, sizeof(lwtTopic), "iot/device/%s/status", device_id);
    client.publish(lwtTopic, "ONLINE", true);
    Serial.println("💓 Heartbeat sent (ONLINE status)");
  }
}
