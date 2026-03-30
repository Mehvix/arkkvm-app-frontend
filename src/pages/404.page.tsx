/**
 * @Purpose: 404 Not Found Page
 * @Author: zhanglei
 * @Date: 2026-01-24
 */

import { IconCloud } from '@/assets/icons'
import { AspectRatioContainer, TopNavbar } from '@/components'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export const meta = {
  auth: false,
  title: '404 - Page Not Found',
}

export default function NotFound() {
  const navigate = useNavigate()
  const [topbarShowLoggedIn, setTopbarShowLoggedIn] = useState(true)
  return (
    <div className="flex flex-col overflow-hidden">
      <TopNavbar
        links={[
          { title: 'Cloud Devices', href: '/devices/list', Icon: IconCloud },
        ]}
        showLoggedIn={topbarShowLoggedIn}
      ></TopNavbar>
      <AspectRatioContainer className="flex-1 w-full">
        <div className="flex flex-col items-center justify-center w-full h-screen">
          <div className="text-center">
            <div className="text-[120px] font-[900] text-[var(--text-primary)] leading-none mb-[20px]">
              404
            </div>
            <h1 className="text-[32px] font-[700] text-[var(--text-primary)] mb-[12px]">
              Page Not Found
            </h1>
            <p className="text-[16px] text-[var(--text-secondary)] mb-[40px] max-w-[400px]">
              Sorry, the page you're looking for doesn't exist or has been
              moved.
            </p>

            <div className="flex gap-[16px] justify-center">
              <button
                onClick={() => navigate('/')}
                className="px-[24px] py-[12px] bg-[var(--bg-button-color)] border border-[var(--border-color)] rounded-[4px] text-[14px] font-[600] cursor-pointer hover:bg-[var(--bg-button-hover-color)] transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>

          {/* Optional decorative element */}
          <div className="absolute bottom-0 left-0 right-0 h-[200px] bg-gradient-to-t from-[var(--bg-button-color)] opacity-10 pointer-events-none"></div>
        </div>
      </AspectRatioContainer>
    </div>
  )
}
