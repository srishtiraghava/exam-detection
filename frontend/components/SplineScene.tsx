'use client'

import { useEffect, useRef } from 'react'

interface SplineSceneProps {
  scene: string
  className?: string
}

export function SplineScene({ scene, className = 'w-full h-full' }: SplineSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Create iframe for Spline scene
    const iframe = document.createElement('iframe')
    iframe.src = scene
    iframe.style.width = '100%'
    iframe.style.height = '100%'
    iframe.style.border = 'none'
    iframe.style.borderRadius = '0'
    iframe.allow = 'autoplay'
    
    containerRef.current.appendChild(iframe)

    return () => {
      if (containerRef.current && iframe.parentNode === containerRef.current) {
        containerRef.current.removeChild(iframe)
      }
    }
  }, [scene])

  return (
    <div 
      ref={containerRef} 
      className={className}
      style={{ overflow: 'hidden' }}
    />
  )
}