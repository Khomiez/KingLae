import Link from "next/link";
import CaregiverNav from "../components/CaregiverNav";

export default function PatientInfoPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link
              href="/caregiver/home"
              className="text-slate-500 hover:text-slate-800"
            >
              <span className="material-symbols-outlined text-[28px]">
                arrow_back
              </span>
            </Link>
            <div>
              <h1 className="text-lg font-bold leading-tight text-slate-800">
                ข้อมูลผู้ป่วย
              </h1>
              <p className="text-xs text-slate-500 font-medium">Patient Profile</p>
            </div>
          </div>
          <button
            className="p-2 rounded-full bg-slate-50 text-[var(--primary-blue)] hover:bg-slate-100 transition-colors"
            title="Refresh Data"
          >
            <span className="material-symbols-outlined text-[24px]">refresh</span>
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 space-y-6 pb-24">
        {/* Patient Info Section */}
        <section className="bg-white rounded-2xl p-5 card-shadow border border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center shrink-0 text-blue-600">
              <span className="material-symbols-outlined text-[36px]">person</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-800">
                นายสมชาย ใจดี
              </h2>
              <p className="text-sm text-slate-500 mb-1">Somchai Jaidee</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
                <span className="material-symbols-outlined text-[18px] text-slate-400">
                  cake
                </span>
                <span>12 เม.ย. 2498 (68 ปี)</span>
              </div>
            </div>
          </div>
          <hr className="my-4 border-slate-100" />
          <div className="space-y-3">
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                อาการ / Symptoms
              </h3>
              <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                ความดันโลหิตสูง, โรคเบาหวาน, เคลื่อนไหวลำบากต้องใช้อุปกรณ์ช่วยเดิน
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                ที่อยู่ / Address
              </h3>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] text-slate-400 mt-0.5">
                  location_on
                </span>
                <p className="text-sm text-slate-700">
                  123/45 หมู่บ้านสุขใจ ถ.พหลโยธิน แขวงจันทรเกษม เขตจตุจักร
                  กทม. 10900
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Device Status Section */}
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-base font-bold text-slate-800">
              สถานะอุปกรณ์ (Device Status)
            </h3>
            <span className="text-xs font-medium text-slate-400">
              Last seen: 2m ago
            </span>
          </div>
          <div className="bg-white rounded-2xl p-5 card-shadow border-l-4 border-green-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <span className="material-symbols-outlined text-[100px]">
                router
              </span>
            </div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">
                    qr_code_2
                  </span>
                  <span className="text-sm font-mono text-slate-500">
                    ESP32-001
                  </span>
                </div>
                <h4 className="text-lg font-bold text-slate-800">
                  KingLae Bedside Unit
                </h4>
              </div>
              <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                ออนไลน์ (ONLINE)
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col items-center justify-center">
                <div className="flex items-center gap-1 text-slate-800 font-bold text-xl mb-1">
                  <span className="material-symbols-outlined text-green-600">
                    battery_5_bar
                  </span>
                  85%
                </div>
                <span className="text-xs text-slate-500">แบตเตอรี่</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col items-center justify-center">
                <div className="text-slate-800 font-bold text-xl mb-1">
                  IDLE
                </div>
                <span className="text-xs text-slate-500">สถานะปัจจุบัน</span>
              </div>
            </div>
          </div>
        </section>

        {/* Recent History Section */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-base font-bold text-slate-800">
              ประวัติล่าสุด (Recent History)
            </h3>
            <a
              className="text-xs text-[var(--primary-blue)] font-medium hover:underline"
              href="#"
            >
              ดูทั้งหมด &gt;
            </a>
          </div>
          <div className="bg-white rounded-2xl card-shadow overflow-hidden">
            {/* History Item 1 */}
            <div className="p-4 border-b border-slate-100 flex items-start gap-3">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-lg shrink-0">
                <span className="material-symbols-outlined text-[20px]">
                  sunny
                </span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-bold text-slate-800">
                    ตื่นนอน (MORNING_WAKEUP)
                  </h4>
                  <span className="text-xs text-slate-400">07:00 น.</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  ตรวจพบการกดปุ่มสีเขียว
                </p>
                <span className="inline-block mt-2 px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-medium rounded-full border border-green-100">
                  RESOLVED
                </span>
              </div>
            </div>

            {/* History Item 2 */}
            <div className="p-4 border-b border-slate-100 flex items-start gap-3">
              <div className="bg-yellow-100 text-yellow-600 p-2 rounded-lg shrink-0">
                <span className="material-symbols-outlined text-[20px]">
                  accessibility_new
                </span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-bold text-slate-800">
                    ขอความช่วยเหลือ (ASSIST)
                  </h4>
                  <span className="text-xs text-slate-400">
                    เมื่อวาน 14:30 น.
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">ต้องการน้ำดื่ม</p>
                <span className="inline-block mt-2 px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-medium rounded-full">
                  ACKNOWLEDGED by Staff Joy
                </span>
              </div>
            </div>

            {/* History Item 3 */}
            <div className="p-4 flex items-start gap-3">
              <div className="bg-red-100 text-red-600 p-2 rounded-lg shrink-0">
                <span className="material-symbols-outlined text-[20px]">
                  emergency_share
                </span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-bold text-slate-800">
                    ฉุกเฉิน (SOS)
                  </h4>
                  <span className="text-xs text-slate-400">2 วันที่แล้ว</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  กดปุ่มฉุกเฉินข้างเตียง
                </p>
                <span className="inline-block mt-2 px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-medium rounded-full border border-green-100">
                  RESOLVED
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <CaregiverNav />
    </div>
  );
}
