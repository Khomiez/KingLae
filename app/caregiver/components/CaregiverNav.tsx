"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/caregiver/home",
    icon: "grid_view",
    label: "หน้าหลัก",
  },
  {
    href: "/caregiver/patient-info",
    icon: "person",
    label: "ผู้ป่วย",
  },
  {
    href: "/caregiver/write-report",
    icon: "edit_note",
    label: "บันทึก",
  },
  {
    href: "/caregiver/history",
    icon: "history",
    label: "ประวัติ",
  },
];

export default function CaregiverNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-t border-slate-200 fixed bottom-0 w-full z-30 safe-area-bottom">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive
                  ? "text-[var(--primary-blue)]"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[24px] ${
                  isActive ? "filled" : ""
                }`}
              >
                {item.icon}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
