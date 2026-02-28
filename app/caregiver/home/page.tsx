import Link from "next/link";
import CaregiverNav from "../components/CaregiverNav";

export default function CaregiverHomePage() {
  return (
    <div className="bg-[var(--medical-bg)] text-slate-800 min-h-screen relative pb-24">
      {/* Offline Banner */}
      <div className="hidden bg-slate-800 text-white text-xs py-2 px-4 text-center font-medium safe-area-top">
        <span className="material-symbols-outlined text-sm align-bottom mr-1">
          wifi_off
        </span>
        ออฟไลน์ - จะซิงก์ข้อมูลเมื่อเชื่อมต่อ
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20 safe-area-top">
        <div className="px-5 py-4 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[var(--medical-blue)] text-3xl">
                monitor_heart
              </span>
              <h1 className="text-xl font-bold text-[var(--medical-blue)] tracking-tight">
                CareLink
              </h1>
            </div>
            <p className="text-slate-500 text-sm">14 ตุลาคม 2566</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 font-light">ยินดีต้อนรับ</p>
            <p className="text-sm font-semibold text-slate-700">คุณพยาบาล วิไล</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-8">
        {/* Urgent Tasks Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--alert-red)]">
                warning
              </span>
              งานด่วน (2)
            </h2>
            <span className="text-xs font-medium px-2 py-1 bg-red-50 text-red-600 rounded-full animate-pulse">
              ต้องการความช่วยเหลือทันที
            </span>
          </div>

          <div className="space-y-4">
            {/* Emergency SOS Card */}
            <div className="bg-white rounded-2xl shadow-sm border-l-4 border-[var(--alert-red)] overflow-hidden relative">
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="inline-flex items-center gap-1 bg-red-100 text-[var(--alert-red)] text-xs font-bold px-2.5 py-1 rounded-md">
                    <span className="material-symbols-outlined text-sm filled">
                      emergency
                    </span>
                    ฉุกเฉิน SOS
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    2 นาทีที่แล้ว
                  </span>
                </div>

                <div className="flex items-start gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-slate-400 text-2xl">
                      person
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      คุณตา สมชาย
                    </h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">
                        bed
                      </span>
                      เตียง 04 • หอผู้ป่วยชาย
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-red-50 rounded-lg p-3 mb-4">
                  <div className="text-[var(--alert-red)] text-sm font-semibold">
                    รอการตอบรับ
                  </div>
                  <div className="text-[var(--alert-red)] font-bold font-mono">
                    00:02:15
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href="/caregiver/patient-info"
                    className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-colors flex justify-center items-center gap-2"
                  >
                    <span className="material-symbols-outlined">person</span>
                    ดูข้อมูลผู้ป่วย
                  </Link>
                  <button className="flex-1 bg-[var(--alert-red)] hover:bg-red-600 active:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-red-200 transition-colors flex justify-center items-center gap-2">
                    <span className="material-symbols-outlined">check_circle</span>
                    รับงาน
                  </button>
                </div>
              </div>
            </div>

            {/* General Assistance Card */}
            <div className="bg-white rounded-2xl shadow-sm border-l-4 border-[var(--alert-yellow)] overflow-hidden">
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-md">
                    <span className="material-symbols-outlined text-sm">
                      pan_tool
                    </span>
                    ช่วยเหลือทั่วไป
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    5 นาทีที่แล้ว
                  </span>
                </div>

                <div className="flex items-start gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-slate-400 text-2xl">
                      person_3
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      คุณยาย มะลิ
                    </h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">
                        bed
                      </span>
                      เตียง 12 • ห้องพิเศษ 2
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href="/caregiver/patient-info"
                    className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-colors flex justify-center items-center gap-2"
                  >
                    <span className="material-symbols-outlined">person</span>
                    ดูข้อมูลผู้ป่วย
                  </Link>
                  <button className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-colors flex justify-center items-center gap-2">
                    รับงาน
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Morning Check Section */}
        <section>
          <div className="flex items-center justify-between mb-4 mt-8">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--medical-blue)]">
                wb_sunny
              </span>
              ตรวจเช้า (3)
            </h2>
            <span className="text-xs text-slate-500">ยังไม่กดปุ่มเขียว</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100">
            {/* Patient 1 */}
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-blue-50 text-[var(--medical-blue)] flex items-center justify-center font-bold text-sm">
                    08
                  </div>
                  <span className="absolute bottom-0 right-0 h-3 w-3 bg-slate-300 border-2 border-white rounded-full"></span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    นาย สมศักดิ์ ใจดี
                  </p>
                  <p className="text-xs text-slate-500">ห้อง 301</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-300">
                chevron_right
              </span>
            </div>

            {/* Patient 2 */}
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-blue-50 text-[var(--medical-blue)] flex items-center justify-center font-bold text-sm">
                    09
                  </div>
                  <span className="absolute bottom-0 right-0 h-3 w-3 bg-slate-300 border-2 border-white rounded-full"></span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    นาง ปราณี มีสุข
                  </p>
                  <p className="text-xs text-slate-500">ห้อง 302</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-300">
                chevron_right
              </span>
            </div>

            {/* Patient 3 - Overdue */}
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-blue-50 text-[var(--medical-blue)] flex items-center justify-center font-bold text-sm">
                    15
                  </div>
                  <span className="absolute bottom-0 right-0 h-3 w-3 bg-orange-400 border-2 border-white rounded-full"></span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    นาย วีระ กล้าหาญ
                  </p>
                  <p className="text-xs text-orange-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[10px]">
                      schedule
                    </span>
                    เลยกำหนด 10 นาที
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-300">
                chevron_right
              </span>
            </div>
          </div>

          <div className="mt-3 text-center">
            <button className="text-[var(--medical-blue)] text-sm font-medium flex items-center justify-center gap-1 mx-auto hover:underline">
              ดูทั้งหมด
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <CaregiverNav />
    </div>
  );
}
