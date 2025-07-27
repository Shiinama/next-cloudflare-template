'use client'

import React from 'react'

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface AvatarWithProgressProps {
  src?: string
  alt?: string
  fallback?: string
  progress?: number // 0-100 的进度值
  className?: string
  width?: number // 固定宽度
  height?: number // 固定高度
  avatarScale?: number // 头像缩放比例，默认 0.75
}

export function AvatarWithProgress({
  src,
  alt,
  fallback,
  progress = 0,
  className,
  width = 40,
  height = 40,
  avatarScale = 0.75
}: AvatarWithProgressProps) {
  // 使用标准化的 viewBox，便于控制
  const viewBoxSize = 100
  const center = 50
  const svgRadius = 40 // 固定的 SVG 半径
  const svgStrokeWidth = 4

  return (
    <div className={cn('relative', className)} style={{ width: `${width}px`, height: `${height}px` }}>
      {/* 进度环容器 */}
      <div className="h-full w-full" role="progressbar">
        <svg
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          className="h-full w-full"
          style={{ width: `${width}px`, height: `${height}px` }}
        >
          {/* 背景轨道 */}
          <circle
            cx={center}
            cy={center}
            r={svgRadius}
            strokeWidth={svgStrokeWidth}
            fill="none"
            stroke="currentColor"
            className="text-muted-foreground/20"
          />
          {/* 进度条 */}
          <circle
            cx={center}
            cy={center}
            r={svgRadius}
            strokeWidth={svgStrokeWidth}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeDasharray={`${(progress / 100) * (2 * Math.PI * svgRadius)} ${2 * Math.PI * svgRadius}`}
            className="text-primary transition-all duration-500 ease-out"
            style={{
              transform: 'rotate(90deg) scaleX(-1)',
              transformOrigin: '50% 50%'
            }}
          />
        </svg>
      </div>

      {/* 头像 - 绝对定位在中心，缩小显示 */}
      <div
        className="absolute top-1/2 left-1/2 rounded-full"
        style={{
          width: `${width * avatarScale}px`,
          height: `${height * avatarScale}px`,
          transform: `translate(-50%, -50%)`,
          opacity: 1
        }}
      >
        <Avatar className="h-full w-full">
          <AvatarImage src={src} alt={alt} className="rounded-full object-cover" />
          <AvatarFallback className="rounded-full text-xs" style={{ fontSize: `${width * 0.3}px` }}>
            {fallback}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  )
}
