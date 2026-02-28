"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AcknowledgeButtonProps {
  eventId: string;
  redirectTo?: string;
  className?: string;
}

export default function AcknowledgeButton({
  eventId,
  redirectTo,
  className = "",
}: AcknowledgeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAcknowledge = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.refresh();
        }
      } else {
        // Show specific error from API
        const errorMessage = data?.error || 'รับงานไม่สำเร็จ กรุณาลองใหม่';
        setError(errorMessage);
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Failed to acknowledge event:', error);
      const errorMsg = 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่';
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAcknowledge}
      disabled={loading}
      className={className}
      title={error || undefined}
    >
      {loading ? 'กำลังรับงาน...' : 'รับงาน'}
    </button>
  );
}
