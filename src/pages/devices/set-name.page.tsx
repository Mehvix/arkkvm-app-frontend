/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-10-27 16:25:25
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-02-05 19:38:01
 */
import { request } from '@/api'
import { Button, Input, WelcomeBackground } from '@/components'
import { navigateWithVersion } from '@/utils'
import { useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
export const meta = {
  path: '/devices/:id/set-name',
  cloudPath: '/devices/:id/set-name',
  target: 'cloud',
}
export default function setName() {
  const { id } = useParams()
  const [name, setName] = useState('')
  const [errors, setErrors] = useState({})
  const validate = () => {
    const newErrors: any = {}
    if (!name) {
      newErrors.name = 'Name is required'
    }
    return newErrors
  }
  const handleChange = (event: any) => {
    setName(event.target.value)
  }
  const submitHandle = useCallback(() => {
    const newErrors = validate()
    setErrors({})
    if (Object.keys(newErrors).length) {
      setErrors(newErrors)
    } else {
      request.put(`/devices/${id}`, { name: name }).then(res => {
        if (res.success) {
          navigateWithVersion(`/device/${id}?deviceName=${name}`)
        } else {
          newErrors.res =
            res.message || 'An error occurred while setup device name'
        }
      })
    }
  }, [name])
  return (
    <WelcomeBackground
      title="Name Your Device"
      subtitle={[
        'Give your KVM device a friendly name so you can easily find and manage it in the cloud.',
      ]}
    >
      <div className="w-[350px]">
        <Input
          label="Device Name"
          labelPosition="top"
          labelSize={14}
          placeholder="Device Name (Hostname or Asset Tag)"
          value={name}
          size="lg"
          onChange={handleChange}
          className="my-[14px]"
        ></Input>
        <div className="text-[12px]">
          {errors.name && <span style={{ color: 'red' }}>{errors.name}</span>}
          {errors.res && <span style={{ color: 'red' }}>{errors.res}</span>}
        </div>
        <Button
          variant="primary"
          onClick={submitHandle}
          className="w-full"
          size="lg"
        >
          Save & Continue
        </Button>
      </div>
    </WelcomeBackground>
  )
}
