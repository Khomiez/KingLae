import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "../../../../lib/supabase";

const TODAY_HISTORY_TEXT = "ดูประวัติเหตุการณ์วันนี้";
const TODAY_HISTORY_POSTBACK_KEYWORDS = ["today_history", "view_today_history"];

type LineMessageEvent = {
  type: "message";
  replyToken?: string;
  message?: {
    type?: string;
    text?: string;
  };
};

type LinePostbackEvent = {
  type: "postback";
  replyToken?: string;
  postback?: {
    data?: string;
  };
};

type LineEvent = LineMessageEvent | LinePostbackEvent;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-line-signature")!;

  const hash = crypto
    .createHmac("sha256", process.env.LINE_CHANNEL_SECRET!)
    .update(body)
    .digest("base64");

  if (hash !== signature) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  const data = JSON.parse(body);
  console.log(data.events);

  for (const event of data.events) {
    if (!event.replyToken) {
      continue;
    }

    const shouldShowTodayHistory = isTodayHistoryRequest(event);
    if (shouldShowTodayHistory) {
      const summaryText = await buildTodayHistorySummary();
      await reply(event.replyToken, summaryText);
      continue;
    }

    if (event.type === "message" && event.message.type === "text") {
      await reply(
        event.replyToken,
        `เมนูที่รองรับ:\n- ${TODAY_HISTORY_TEXT}\n\nหรือพิมพ์ "${TODAY_HISTORY_TEXT}" เพื่อดูข้อมูลล่าสุด`
      );
    }
  }

  return NextResponse.json({ status: "ok" });
}

async function reply(replyToken: string, text: string) {
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }],
    }),
  });
}

function isTodayHistoryRequest(event: LineEvent) {
  if (event.type === "message" && event.message?.type === "text") {
    const text = (event.message.text ?? "").trim();
    return text === TODAY_HISTORY_TEXT;
  }

  if (event.type === "postback") {
    const data = String(event.postback?.data ?? "").toLowerCase();
    return TODAY_HISTORY_POSTBACK_KEYWORDS.some((keyword) => data.includes(keyword));
  }

  return false;
}

async function buildTodayHistorySummary() {
  const { startIso, endIso } = getTodayBangkokRange();

  const PATIENT_ID = "22222222-2222-2222-2222-222222222222";

  const { data: rows, error } = await supabase
    .from("events")
    .select(`
      created_at,
      event_type,
      devices!inner (
        patient_id,
        patients!inner (
          name
        )
      )
    `)
    .eq("devices.patient_id", PATIENT_ID)
    .gte("created_at", startIso)
    .lte("created_at", endIso)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error building today history", error);
    return "ขออภัย ไม่สามารถดึงข้อมูลประวัติวันนี้ได้ในขณะนี้";
  }

  if (!rows || rows.length === 0) {
    return "วันนี้ยังไม่มีเหตุการณ์ใด ๆ ของผู้ป่วยรายนี้";
  }

  const patientName =
    rows[0]?.devices?.patients?.name ?? "ไม่ระบุชื่อผู้ป่วย";

  const sosCount = rows.filter((e) => e.event_type === "SOS").length;
  const assistCount = rows.filter((e) => e.event_type === "ASSIST").length;

  const lines = [
    `สรุปเหตุการณ์วันนี้ ${formatThaiLongDate(new Date())}`,
    `ผู้ป่วย: ${patientName}`,
    "",
    `จำนวนการกดปุ่ม: ${sosCount + assistCount} ครั้ง`,
    `SOS: ${sosCount} ครั้ง`,
    `ขอความช่วยเหลือ: ${assistCount} ครั้ง`,
    "",
    "⏱️ เหตุการณ์วันนี้",
  ];

  const timeline = buildTodayTimeline(rows);
  if (timeline.length === 0) {
    lines.push("วันนี้ไม่มีการกดปุ่ม SOS หรือ ขอความช่วยเหลือ");
  } else {
    lines.push(...timeline.slice(0, 12));
  }

  return lines.join("\n").slice(0, 4900);
}

function getTodayBangkokRange() {
  const now = new Date();

  const start = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
  );
  start.setHours(0, 0, 0, 0);

  const end = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
  );
  end.setHours(23, 59, 59, 999);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

function formatThaiLongDate(value: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(value);
}

function formatTimeInThai(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

function buildTodayTimeline(
  events: {
    created_at: string;
    event_type: string;
  }[]
) {
  return events.map((event) => {
    const time = formatTimeInThai(event.created_at);

    switch (event.event_type) {
      case "MORNING_WAKEUP":
        return `${time} 🌅 ผู้ป่วยตื่นนอน (กดปุ่มสีเขียว)`;
      case "SOS":
        return `${time} 🆘 ผู้ป่วยกดปุ่ม SOS (สีแดง)`;
      case "ASSIST":
        return `${time} 🚨 ผู้ป่วยขอความช่วยเหลือ (สีเหลือง)`;
      case "MISSED_CHECKIN":
        return `${time} ⚠️ ผู้ป่วยไม่กดปุ่มตามเวลาที่กำหนด`;
      default:
        return `${time} ❓ เหตุการณ์ไม่ทราบประเภท`;
    }
  });
}
