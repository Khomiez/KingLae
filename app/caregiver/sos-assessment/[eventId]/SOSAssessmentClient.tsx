"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CaregiverNav from "../../components/CaregiverNav";
import { createBrowserClient } from "@supabase/ssr";
import ConnectionStatus, { ConnectionIndicator } from "../../components/ConnectionStatus";

interface SOSAssessmentClientProps {
  eventId: string;
  event: any;
  patient: any;
  device: any;
  age: number | null;
  eventTime: string;
}

// Default caregiver ID from seed database
const DEFAULT_CAREGIVER_ID = 'c0000000-0000-0000-0000-000000000001';

export default function SOSAssessmentClient({
  eventId,
  patient,
  device,
  age,
  eventTime,
}: SOSAssessmentClientProps) {
  const router = useRouter();
  const [selectedDecision, setSelectedDecision] = useState<'TRUE_SOS' | 'DOWNGRADED_TO_ASSIST' | null>(null);
  const [caregiverNote, setCaregiverNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (decision: 'TRUE_SOS' | 'DOWNGRADED_TO_ASSIST') => {
    // For TRUE_SOS, note is required
    if (decision === 'TRUE_SOS' && !caregiverNote.trim()) {
      setError('กรุณากรอกบันทึกเพื่อยืนยันเหตุฉุกเฉิน');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          caregiver_note: caregiverNote.trim() || null,
          caregiver_id: DEFAULT_CAREGIVER_ID,
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        // Redirect based on API response
        if (data.redirect) {
          router.push(data.redirect);
        } else {
          // Fallback redirect
          if (decision === 'TRUE_SOS') {
            router.push('/caregiver/home?completed=true&eventId=' + eventId);
          } else {
            router.push(`/caregiver/to-confirm?eventId=${eventId}`);
          }
        }
      } else {
        setError(data?.error || 'บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่');
      }
    } catch (err) {
      console.error('Failed to submit triage:', err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[var(--medical-bg)] text-slate-800 min-h-screen relative pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[var(--alert-red)] text-3xl">
              emergency
            </span>
            <h1 className="text-xl font-bold text-[var(--alert-red)] tracking-tight">
              ประเมินเหตุฉุกเฉิน SOS
            </h1>
            <ConnectionIndicator />
          </div>
          <p className="text-slate-500 text-sm">
            กรุณาประเมินความรุนแรงของสถานการณ์
          </p>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Patient Information Card */}
        <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-red-50 to-red-100 px-5 py-3 border-b border-red-200">
            <h2 className="text-lg font-bold text-red-900 flex items-center gap-2">
              <span className="material-symbols-outlined">person</span>
              ข้อมูลผู้ป่วย
            </h2>
          </div>
          <div className="p-5 space-y-4">
            {/* Patient Name */}
            <div className="flex justify-between items-start">
              <span className="text-sm text-slate-500 font-medium">ชื่อผู้ป่วย</span>
              <span className="text-base font-bold text-slate-900">
                {patient?.name || 'ไม่ระบุชื่อ'}
              </span>
            </div>

            {/* Age / DOB */}
            <div className="flex justify-between items-start">
              <span className="text-sm text-slate-500 font-medium">อายุ / วันเกิด</span>
              <div className="text-right">
                {age ? (
                  <span className="text-base font-semibold text-slate-900">
                    {age} ปี
                  </span>
                ) : null}
                {patient?.date_of_birth && (
                  <div className="text-xs text-slate-500 mt-0.5">
                    {new Date(patient.date_of_birth).toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            {patient?.address && (
              <div className="flex justify-between items-start">
                <span className="text-sm text-slate-500 font-medium">ที่อยู่ / ห้อง</span>
                <span className="text-base font-medium text-slate-900 text-right max-w-[60%]">
                  {patient.address}
                </span>
              </div>
            )}

            {/* Medical Notes / Symptoms */}
            {patient?.symptoms && (
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-600 text-xl shrink-0">
                    medical_information
                  </span>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-amber-900">
                      อาการ / โรคประจำตัว
                    </span>
                    <p className="text-sm text-amber-800 mt-1">
                      {patient.symptoms}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Device Info */}
            {device && (
              <div className="flex justify-between items-start text-sm">
                <span className="text-slate-500 font-medium">อุปกรณ์</span>
                <div className="text-right">
                  <span className="font-mono text-slate-700">{device.mac_address}</span>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className={`inline-block w-2 h-2 rounded-full ${
                      device.health === 'ONLINE' ? 'bg-green-500' : 'bg-slate-300'
                    }`}></span>
                    <span className="text-xs text-slate-500">{device.health}</span>
                    {device.battery_level !== null && (
                      <>
                        <span className="text-slate-300 mx-1">•</span>
                        <span className="text-xs text-slate-500">🔋 {device.battery_level}%</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Event Timestamp */}
            <div className="flex justify-between items-start bg-slate-50 rounded-lg px-3 py-2">
              <span className="text-sm text-slate-500 font-medium">เวลากด SOS</span>
              <span className="text-sm font-semibold text-slate-900">
                {eventTime}
              </span>
            </div>
          </div>
        </section>

        {/* Caregiver Note */}
        <section>
          <label className="block text-sm font-bold text-slate-800 mb-2">
            บันทึกเจ้าหน้าที่
            <span className="text-[var(--alert-red)] ml-1">*</span>
          </label>
          <textarea
            value={caregiverNote}
            onChange={(e) => setCaregiverNote(e.target.value)}
            placeholder="กรอกรายละเอียดสถานการณ์ อาการ หรือข้อสังเกต..."
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-[var(--medical-blue)] focus:outline-none transition-colors resize-none text-base"
            rows={4}
            disabled={isSubmitting}
          />
          {selectedDecision === 'TRUE_SOS' && !caregiverNote.trim() && (
            <p className="text-[var(--alert-red)] text-sm mt-2 font-medium">
              ⚠️ จำเป็นต้องกรอกบันทึกเพื่อยืนยันเหตุฉุกเฉิน
            </p>
          )}
        </section>

        {/* Action Buttons */}
        <section className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 text-center">
            กรุณาเลือกการดำเนินการ
          </h3>

          {/* Confirm Emergency Button - PRIMARY ACTION */}
          <button
            onClick={() => handleSubmit('TRUE_SOS')}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 active:from-red-800 active:to-red-900 text-white font-bold py-5 px-6 rounded-2xl shadow-lg shadow-red-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-4 border-red-800"
          >
            <div className="flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-5xl">emergency</span>
              <div className="text-center">
                <div className="text-xl font-black tracking-tight">
                  ✅ ยืนยันเหตุฉุกเฉินจริง (SOS)
                </div>
                <div className="text-sm font-medium text-red-100 mt-1">
                  ต้องการบันทึกเจ้าหน้าที่
                </div>
              </div>
            </div>
          </button>

          {/* Not Severe Button - SECONDARY ACTION */}
          <button
            onClick={() => handleSubmit('DOWNGRADED_TO_ASSIST')}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:from-amber-700 active:to-amber-800 text-white font-bold py-5 px-6 rounded-2xl shadow-lg shadow-amber-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-4 border-amber-700"
          >
            <div className="flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-5xl">pan_tool</span>
              <div className="text-center">
                <div className="text-xl font-black tracking-tight">
                  ไม่รุนแรง — ช่วยเหลือทั่วไป
                </div>
                <div className="text-sm font-medium text-amber-100 mt-1">
                  เปลี่ยนเป็นคำขอช่วยเหลือปกติ (บันทึกไม่บังคับ)
                </div>
              </div>
            </div>
          </button>
        </section>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-300 text-red-800 rounded-xl px-4 py-3 text-sm font-medium">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600">error</span>
              {error}
            </div>
          </div>
        )}

        {/* Warning Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-900">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-blue-600 text-xl shrink-0">
              info
            </span>
            <p className="font-medium">
              การตัดสินใจนี้จะถูกบันทึกในระบบ และจะส่งการแจ้งเตือนไปยังญาติผู้ป่วย
            </p>
          </div>
        </div>
      </main>

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl px-6 py-8 flex flex-col items-center gap-4 max-w-xs mx-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-[var(--medical-blue)]"></div>
            <p className="text-lg font-semibold text-slate-900">กำลังบันทึก...</p>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <CaregiverNav />
    </div>
  );
}
