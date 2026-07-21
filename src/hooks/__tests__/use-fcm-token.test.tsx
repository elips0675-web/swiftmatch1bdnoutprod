import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'

const mockAddListener = vi.fn()
const mockRequestPermissions = vi.fn()
const mockRegister = vi.fn()

vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: {
    requestPermissions: mockRequestPermissions,
    register: mockRegister,
    addListener: mockAddListener,
    removeAllListeners: vi.fn(),
  },
}))

import { useFcmToken } from '@/hooks/use-fcm-token'

function TestComponent() {
  useFcmToken()
  return <div>test</div>
}

beforeEach(() => {
  vi.clearAllMocks()
  delete window.Capacitor
})

describe('useFcmToken', () => {
  it('skips registration when not native platform', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    render(<TestComponent />)
    expect(mockRequestPermissions).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('requests permissions and registers on native platform', async () => {
    window.Capacitor = { isNativePlatform: () => true, registerPlugin: vi.fn() }
    mockRequestPermissions.mockResolvedValueOnce({ receive: 'granted' })
    mockRegister.mockResolvedValueOnce(undefined)

    render(<TestComponent />)

    await vi.waitFor(() => {
      expect(mockRequestPermissions).toHaveBeenCalled()
      expect(mockRegister).toHaveBeenCalled()
    })
  })

  it('does not register when permission denied', async () => {
    window.Capacitor = { isNativePlatform: () => true, registerPlugin: vi.fn() }
    mockRequestPermissions.mockResolvedValueOnce({ receive: 'denied' })

    render(<TestComponent />)

    await vi.waitFor(() => {
      expect(mockRequestPermissions).toHaveBeenCalled()
      expect(mockRegister).not.toHaveBeenCalled()
    })
  })
})
