/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-10-27 16:25:25
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-02-10 21:59:25
 */
import { request } from '@/api'
import { IconCloud } from '@/assets/icons'
import { AspectRatioContainer } from '@/components'
import DeviceCard from '@/components/DeviceCard'
import TopNavbar from '@/components/TopNavbar/TopNavbar'
import type { PageMeta } from '@/types/page-meta'
import { useEffect, useState } from 'react'
import { useInterval } from 'usehooks-ts'

/**
 * Parse version information from various input formats
 * Handles both object and JSON string formats (including double-encoded JSON)
 *
 * @param input - Version data that can be an object, JSON string, or double-encoded JSON string
 * @returns Parsed version object or null if parsing fails
 *
 * @example
 * parseVersions('{"webVersion":"1.0.0"}')
 * // Returns: { webVersion: "1.0.0" }
 *
 * @example
 * parseVersions('{"appVersion":"1.0.102050800","systemVersion":"1.0.102050800","webVersion":"1.0.102050800"}')
 * // Returns: { appVersion: "1.0.102050800", systemVersion: "1.0.102050800", webVersion: "1.0.102050800" }
 */
function parseVersions(input: unknown): Record<string, string> | null {
  if (!input) return null

  // Already an object - return as is
  if (typeof input === 'object' && input !== null) {
    return input as Record<string, string>
  }

  // String: parse up to 2 times to handle double-encoded JSON
  if (typeof input === 'string') {
    let parsed: unknown = input

    // Attempt to parse up to 2 times for double-encoded JSON strings
    for (let i = 0; i < 2; i++) {
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed)
        } catch {
          // Stop parsing on error
          break
        }
      }
    }

    // Return parsed object if valid, otherwise null
    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, string>)
      : null
  }

  return null
}

export const meta: PageMeta = {
  auth: true,
  title: 'devices-list',
  target: 'cloud',
}

export default function DeviceList() {
  const [deviceList, setDeviceList] = useState([])
  const [topbarShowLoggedIn, setTopbarShowLoggedIn] = useState(true)
  let [delay, setDelay] = useState(0)

  useInterval(() => {
    setDelay(delay + 1)
  }, 60000)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await request.get('/devices')
        if (res.success) {
          const data = Array.isArray(res.data) ? res.data : []

          setDeviceList(data)
        } else {
          console.error('API returned success: false', res)
        }
      } catch (error) {
        console.error('Failed to fetch devices:', error)
      }
    }
    fetchData()
  }, [delay])

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopNavbar
        links={[
          { title: 'Cloud Devices', href: '/devices/list', Icon: IconCloud },
        ]}
        showLoggedIn={topbarShowLoggedIn}
      ></TopNavbar>
      <AspectRatioContainer
        disableAspectRatio
        className="flex flex-col flex-1 min-h-0 w-full"
      >
        <div className="max-w-[1440px] w-full h-[142px] text-center pt-[60px] mx-auto pb-[26px] border-b border-[var(--border-color)]">
          <div className="text-[24px] font-[700] leading-[1]">Cloud KVMs</div>
          <div className="text-[16px] font-[400] leading-[1] mt-[15px]">
            Manage your cloud KVMs and connect to them securely.
          </div>
        </div>

        {deviceList && deviceList.length > 0 ? (
          <div className="w-full flex-1 min-h-0 overflow-y-auto pb-[30px]">
            <div className="max-w-[1440px] mx-auto flex flex-row mt-[24px] gap-[20px] flex-wrap pb-[50px]">
              {deviceList.map(({ name, id, online, cloudVersion }, i) => {
                // Parse version data and extract webVersion
                const versionData = parseVersions(cloudVersion)
                const webVersion = versionData?.webVersion || 'v-default'

                return (
                  <DeviceCard
                    key={'device-card-' + i}
                    deviceId={id}
                    deviceName={name}
                    online={online}
                    cloudVersion={webVersion}
                  />
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 max-w-[1440px] mx-auto ">no data</div>
        )}
      </AspectRatioContainer>
    </div>
  )
}
