"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import CaregiverNav from "../components/CaregiverNav";
import { useRouter } from "next/navigation";
import {
  User,
  DoorOpen,
  Droplets,
  UtensilsCrossed,
  Pill,
  HeartPulse,
  BedDouble,
  Thermometer,
  Phone,
  Tv,
  Glasses,
  MoreHorizontal,
  AlertTriangle,
  Check,
  CheckCircle,
  ListChecks,
  FileEdit,
  FileText,
  ChevronLeft,
  Signal,
  Wifi,
  BatteryFull,
  UserCircle,
} from "lucide-react";

// Icon components for each task
const TaskIcons = {
  reposition: User,
  toileting: DoorOpen,
  water: Droplets,
  food: UtensilsCrossed,
  medication: Pill,
  pain: HeartPulse,
  blanket: BedDouble,
  temperature: Thermometer,
  phone: Phone,
  tv_remote: Tv,
  glasses: Glasses,
  other: MoreHorizontal,
};

// Common non-emergency tasks patients typically request
const assistanceTasks = [
  { id: "reposition", label: "ช่วยพยุง", description: "ต้องการให้ช่วยเปลี่ยนท่านอน" },
  { id: "toileting", label: "เข้าห้องน้ำ", description: "ต้องการไปห้องน้ำ" },
  { id: "water", label: "น้ำดื่ม", description: "ต้องการน้ำดื่ม" },
  { id: "food", label: "อาหาร/ขนม", description: "ต้องการอาหารหรือขนม" },
  { id: "medication", label: "ยา", description: "ถึงเวลาทานยา" },
  { id: "pain", label: "ปวด/ไม่สบาย", description: "มีอาการปวดหรือไม่สบาย" },
  { id: "blanket", label: "ผ้าห่ม/เครื่องนอน", description: "ต้องการผ้าห่มหรือปรับที่นอน" },
  { id: "temperature", label: "อุณหภูมิห้อง", description: "ร้อนหรือหนาวเกินไป" },
  { id: "phone", label: "โทรศัพท์", description: "ต้องการให้โทรหาญาติ" },
  { id: "tv_remote", label: "รีโมททีวี", description: "ไม่พบรีโมททีวี" },
  { id: "glasses", label: "แว่นตา", description: "ไม่พบแว่นตา" },
  { id: "other", label: "อื่นๆ", description: "ต้องการความช่วยเหลืออื่นๆ" },
];

type EventData = {
  id: string;
  event_type: string;
  created_at: string;
  status: string;
  devices: {
    mac_address: string;
    patient_id: string;
    state: string;
  };
  patients: {
    id: string;
    name: string;
  };
};

type SelectedTasks = Set<string>;

export default function WriteReportPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const router = useRouter();
  const [selectedTasks, setSelectedTasks] = useState<SelectedTasks>(new Set());
  const [isAccidentalPress, setIsAccidentalPress] = useState(false);
  const [caregiverNote, setCaregiverNote] = useState<string>("");
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchEventData() {
      const params = await searchParams;
      const eventId = params.eventId;

      if (eventId) {
        try {
          const response = await fetch(`/api/events/${eventId}`);
          if (response.ok) {
            const data = await response.json();
            setEventData(data);
          }
        } catch (error) {
          console.error("Failed to fetch event:", error);
        }
      }
      setLoading(false);
    }

    fetchEventData();
  }, [searchParams]);

  const toggleTask = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handleSubmit = async () => {
    if (!eventData) return;

    setSubmitting(true);
    try {
      // Build structured summary
      const selectedTaskLabels = Array.from(selectedTasks).map(
        (id) => assistanceTasks.find((t) => t.id === id)?.label || id
      );

      let summary = "";
      const parts: string[] = [];

      // Add selected tasks
      if (selectedTaskLabels.length > 0) {
        parts.push(`ความต้องการ: ${selectedTaskLabels.join(", ")}`);
      }

      // Add accidental press indicator
      if (isAccidentalPress) {
        parts.push("⚠️ ผู้ป่วยกดผิด/กดโดยไม่ตั้งใจ");
      }

      // Combine with caregiver note
      if (parts.length > 0) {
        summary = parts.join("\n");
      }

      if (caregiverNote.trim()) {
        summary += (summary ? "\n\n" : "") + `บันทึกเพิ่มเติม: ${caregiverNote.trim()}`;
      }

      // Submit to complete endpoint
      const response = await fetch(`/api/events/${eventData.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: summary || "ไม่ระบุรายละเอียด" }),
      });

      if (response.ok) {
        router.push("/caregiver/home");
      } else {
        alert("บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่");
      }
    } catch (error) {
      console.error("Failed to submit report:", error);
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <FileText size={64} className="text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          ไม่พบข้อมูลเหตุการณ์
        </h3>
        <p className="text-gray-500 mb-6">
          หน้านี้สำหรับบันทึกการดูแลผู้ป่วย
          <br />
          กรุณาเข้าผ่านหน้าหลักเพื่อรับงาน
        </p>
        <Link
          href="/caregiver/home"
          className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    );
  }

  const hasSelections = selectedTasks.size > 0 || isAccidentalPress;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* iOS Status Bar */}
      <div className="h-12 w-full bg-white flex items-end justify-between px-6 pb-2 text-xs font-medium text-gray-900 border-b border-gray-100 sticky top-0 z-20">
        <span>09:41</span>
        <div className="flex gap-1.5 items-center">
          <Signal size={16} fill="currentColor" />
          <Wifi size={16} fill="currentColor" />
          <BatteryFull size={16} fill="currentColor" />
        </div>
      </div>

      {/* Header */}
      <header className="bg-white px-5 py-4 flex items-center gap-3 border-b border-gray-200 shadow-sm z-10">
        <Link
          href="/caregiver/home"
          className="text-gray-500 hover:text-blue-600 transition-colors"
        >
          <ChevronLeft size={28} />
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

      <main className="flex-grow overflow-y-auto px-4 py-6 pb-40">
        {/* Patient Info Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6 border border-gray-100">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border-2 border-white shadow-sm">
                <UserCircle size={28} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {eventData.patients?.name}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {formatTime(eventData.created_at)}
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold border ${
                eventData.event_type === "SOS"
                  ? "bg-red-50 text-red-600 border-red-200"
                  : "bg-orange-50 text-orange-600 border-orange-200"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-current"></span>
              {eventData.event_type === "SOS" ? "ฉุกเฉิน" : "ขอความช่วยเหลือ"}
            </span>
          </div>
        </div>

        {/* Section Title */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <ListChecks className="text-blue-500" size={24} />
            เลือกความต้องการของผู้ป่วย
          </h3>
          <p className="text-sm text-gray-500 mt-1 ml-8">
            เลือกได้หลายรายการ
          </p>
        </div>

        {/* Task Checkboxes Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {assistanceTasks.map((task) => {
            const isSelected = selectedTasks.has(task.id);
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => toggleTask(task.id)}
                className={`
                  relative p-4 rounded-2xl border-2 transition-all text-left
                  ${isSelected
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50"
                  }
                  active:scale-[0.97]
                `}
                aria-pressed={isSelected}
              >
                {/* Checkbox Indicator */}
                <div className={`
                  absolute top-3 right-3 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-colors
                  ${isSelected
                    ? "bg-blue-500 border-blue-500"
                    : "bg-white border-gray-300"
                  }
                `}>
                  {isSelected && <Check size={18} className="text-white" />}
                </div>

                {/* Content */}
                <div className="pr-8">
                  <div className="mb-2 text-blue-600">
                    {(() => {
                      const IconComponent = TaskIcons[task.id as keyof typeof TaskIcons];
                      return IconComponent ? <IconComponent size={32} strokeWidth={2} /> : null;
                    })()}
                  </div>
                  <span className="block font-bold text-gray-800 text-base leading-tight">
                    {task.label}
                  </span>
                  <span className="block text-xs text-gray-500 mt-1 leading-tight">
                    {task.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Accidental Press Checkbox */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setIsAccidentalPress(!isAccidentalPress)}
            className={`
              w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4
              ${isAccidentalPress
                ? "border-amber-500 bg-amber-50"
                : "border-gray-200 bg-white hover:border-amber-300"
              }
              active:scale-[0.98]
            `}
            aria-pressed={isAccidentalPress}
          >
            <div className={`
              w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-colors flex-shrink-0
              ${isAccidentalPress
                ? "bg-amber-500 border-amber-500"
                : "bg-white border-gray-300"
              }
            `}>
              {isAccidentalPress && <Check size={18} className="text-white" />}
            </div>
            <div className="flex-grow text-left flex items-center gap-3">
              <AlertTriangle size={28} className={`flex-shrink-0 ${isAccidentalPress ? "text-amber-500" : "text-gray-400"}`} />
              <div>
                <span className="block font-bold text-gray-800">
                  ผู้ป่วยกดผิด / กดโดยไม่ตั้งใจ
                </span>
                <span className="block text-sm text-gray-500 mt-0.5">
                  ไม่มีความต้องการจริง
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Optional Caregiver Note */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <label
            className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"
            htmlFor="caregiver_note"
          >
            <FileEdit className="text-blue-500" size={20} />
            บันทึกเพิ่มเติม <span className="text-gray-400 font-normal">(ถ้ามี)</span>
          </label>
          <textarea
            className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base resize-none p-4 bg-gray-50 placeholder-gray-400"
            id="caregiver_note"
            placeholder="เพิ่มรายละเอียดอื่นๆ ที่นี่..."
            rows={4}
            value={caregiverNote}
            onChange={(e) => setCaregiverNote(e.target.value)}
          />
        </div>
      </main>

      {/* Submit Button - Fixed at bottom */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent z-30">
        <button
          onClick={handleSubmit}
          disabled={submitting || !hasSelections}
          className={`
            w-full font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg
            ${hasSelections && !submitting
              ? "bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }
          `}
        >
          <CheckCircle size={28} />
          {submitting ? "กำลังบันทึก..." : "บันทึกและปิดงาน"}
        </button>
        <p className="text-center text-xs text-gray-400 mt-2">
          {selectedTasks.size > 0 && (
            <span className="font-medium text-blue-600">
              เลือก {selectedTasks.size} รายการ
            </span>
          )}
          {selectedTasks.size > 0 && isAccidentalPress && " • "}
          {isAccidentalPress && (
            <span className="font-medium text-amber-600">
              กดผิด
            </span>
          )}
          {!hasSelections && (
            <span>กรุณาเลือกอย่างน้อย 1 รายการ</span>
          )}
        </p>
      </div>

      {/* Bottom Navigation */}
      <CaregiverNav />
      <div className="h-6 w-full bg-white fixed bottom-0 z-40 pointer-events-none"></div>
    </div>
  );
}
