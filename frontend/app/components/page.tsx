'use client'

import React from 'react'
import { SplineSceneBasic } from '@/components/ui/demo'

export default function ComponentsPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-8">
      {/* Navigation */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-white mb-2">Components</h1>
        <p className="text-slate-400">Beautiful, interactive 3D components for your dashboard</p>
      </div>

      {/* Spline Scene Component */}
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Spline 3D Scene</h2>
          <SplineSceneBasic />
        </div>
      </div>
    </div>
  )
}