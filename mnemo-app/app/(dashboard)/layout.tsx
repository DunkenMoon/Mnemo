"use client"

import { Sidebar } from "@/components/layout/Sidebar"
import { lazy } from "react"

const AtlasOrb = lazy(() => import("@/components/atlas/AtlasOrb").then(m => ({ default: m.AtlasOrb })))

export const dynamic = "force-dynamic"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#050510]">
      <Sidebar />
      <main className="flex-1 md:ml-64 ml-0 p-8 min-h-screen overflow-y-auto mt-16 md:mt-0">
        {children}
      </main>
      <AtlasOrb />
    </div>
  );
}
