"use client";

import { useState } from "react";
import Link from "next/link";
import CaregiverNav from "../components/CaregiverNav";

const quickTags = [
  { id: "support", label: "#ช่วยพยุง" },
  { id: "bathroom", label: "#เข้าห้องน้ำ" },
  { id: "accident", label: "#อุบัติเหตุ" },
  { id: "error", label: "#แจ้งเตือนผิดพลาด" },
];

export default function WriteReportPage() {
  const [caregiverNote, setCaregiverNote] = useState<string>("");

  const handleTagClick = (tag: string) => {
    const tagText = tag.replace("#", "");
    setCaregiverNote((prev) => {
      if (prev.length > 0) {
        return prev + ", " + tagText;
      }
      return tagText;
    });
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* iOS Status Bar */}
      <div className="h-12 w-full bg-white flex items-end justify-between px-6 pb-2 text-xs font-medium text-gray-900 border-b border-gray-100 sticky top-0 z-20">
        <span>09:41</span>
        <div className="flex gap-1.5 items-center">
          <span className="material-symbols-outlined text-[16px] filled">
            signal_cellular_alt
          </span>
          <span className="material-symbols-outlined text-[16px] filled">
            wifi
          </span>
          <span className="material-symbols-outlined text-[16px] filled">
            battery_full
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white px-5 py-4 flex items-center gap-3 border-b border-gray-200 shadow-sm z-10">
        <Link
          href="/caregiver/home"
          className="text-gray-500 hover:text-blue-600 transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">
            arrow_back_ios_new
          </span>
        </Link>
        <h1 className="text-xl font-bold text-slate-800 flex-grow">
          บันทึกการดูแล
        </h1>
        <Link
          href="/caregiver/home"
          className="text-blue-500 font-semibold text-sm"
        >
          ปิด
        </Link>
      </header>

      <main className="flex-grow overflow-y-auto px-4 py-6 pb-32">
        {/* Patient Info Card */}
        <div className="bg-white rounded-2xl p-5 ios-shadow mb-6 border border-gray-100">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border-2 border-white shadow-sm">
                <span className="material-symbols-outlined text-2xl">
                  elderly
                </span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  คุณตา สมชาย
                </h2>
                <p className="text-sm text-gray-500">ห้อง 104 • เตียง 2</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 px-2.5 py-1 rounded-full text-xs font-bold border border-red-100 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              ฉุกเฉิน (SOS)
            </span>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 font-medium">
                สถานะปัจจุบัน
              </span>
              <span className="text-blue-600 font-semibold flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-sm">
                  medical_services
                </span>
                กำลังดูแล (Arrived)
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 font-medium">
                เวลาที่เกิดเหตุ
              </span>
              <span className="block text-gray-700 font-medium mt-0.5">
                09:30 น.
              </span>
            </div>
          </div>
        </div>

        {/* Caregiver Note Section */}
        <div className="bg-white rounded-2xl p-5 ios-shadow border border-gray-100">
          <label
            className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"
            htmlFor="caregiver_note"
          >
            <span className="material-symbols-outlined text-blue-500 text-lg">
              edit_note
            </span>
            รายละเอียดการช่วยเหลือ
          </label>
          <div className="relative">
            <textarea
              className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm resize-none p-4 bg-gray-50 placeholder-gray-400"
              id="caregiver_note"
              placeholder="พิมพ์รายละเอียดการช่วยเหลือที่นี่... (เช่น ช่วยพยุงลุกจากเตียง, ให้ยาตามเวลา, หรือปฐมพยาบาลเบื้องต้น)"
              rows="6"
              value={caregiverNote}
              onChange={(e) => setCaregiverNote(e.target.value)}
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
              <span className="material-symbols-outlined text-base cursor-pointer hover:text-blue-500">
                mic
              </span>
            </div>
          </div>

          {/* Quick Tags */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {quickTags.map((tag) => (
              <button
                key={tag.id}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                type="button"
                onClick={() => handleTagClick(tag.label)}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8">
          <Link
            href="/caregiver/home"
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg"
          >
            <span className="material-symbols-outlined">check_circle</span>
            บันทึกและปิดงาน
          </Link>
          <p className="text-center text-xs text-gray-400 mt-3">
            การกดปุ่มนี้จะเปลี่ยนสถานะเป็น{" "}
            <span className="font-bold text-gray-500">RESOLVED</span>
          </p>
        </div>
      </main>

      {/* Bottom Navigation */}
      <CaregiverNav />
    </div>
  );
}
