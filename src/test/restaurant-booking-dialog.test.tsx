import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RestaurantBookingDialog } from '@/components/chat/restaurant-booking-dialog'

const mockOffer = {
  id: 3,
  partner_name: 'Restoclub',
  category: 'restaurant',
  title: 'Ужин на двоих',
  description: 'Итальянская кухня',
  price: 3000,
}

const mockT = (key: string) => key
vi.mock('@/context/language-context', () => ({
  useLanguage: () => ({ t: mockT }),
}))

vi.mock('@/lib/token', () => ({
  getToken: () => 'mock-token',
}))

describe('RestaurantBookingDialog', () => {
  const onOpenChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders booking form with offer info', () => {
    render(<RestaurantBookingDialog offer={mockOffer} open={true} onOpenChange={onOpenChange} />)
    expect(screen.getByText('partner.booking.title')).toBeInTheDocument()
    expect(screen.getByText('Ужин на двоих')).toBeInTheDocument()
  })

  it('shows validation error when date/time empty', () => {
    render(<RestaurantBookingDialog offer={mockOffer} open={true} onOpenChange={onOpenChange} />)
    fireEvent.click(screen.getByTestId('confirm-booking'))
    expect(screen.getByText('partner.booking.fill_required')).toBeInTheDocument()
  })

  it('renders date, time, guests inputs', () => {
    render(<RestaurantBookingDialog offer={mockOffer} open={true} onOpenChange={onOpenChange} />)
    expect(screen.getByTestId('booking-date')).toBeInTheDocument()
    expect(screen.getByTestId('booking-time')).toBeInTheDocument()
    expect(screen.getByTestId('booking-guests')).toBeInTheDocument()
  })
})
