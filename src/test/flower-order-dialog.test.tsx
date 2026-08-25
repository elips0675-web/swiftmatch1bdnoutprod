import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FlowerOrderDialog } from '@/components/chat/flower-order-dialog'

const mockOffer = {
  id: 8,
  partner_name: 'Flowwow',
  category: 'flowers',
  title: 'Букет роз',
  description: 'Красные розы 25 штук',
  price: 2500,
}

const mockT = (key: string) => key
vi.mock('@/context/language-context', () => ({
  useLanguage: () => ({ t: mockT }),
}))

vi.mock('@/lib/token', () => ({
  getToken: () => 'mock-token',
}))

describe('FlowerOrderDialog', () => {
  const onOpenChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders details step with offer info', () => {
    render(<FlowerOrderDialog offer={mockOffer} open={true} onOpenChange={onOpenChange} />)
    expect(screen.getByText('partner.order.title')).toBeInTheDocument()
    expect(screen.getByText('Букет роз')).toBeInTheDocument()
    expect(screen.getByText(/2[\s\u00a0]?500.*₽/)).toBeInTheDocument()
  })

  it('shows validation error when name/address empty', () => {
    render(<FlowerOrderDialog offer={mockOffer} open={true} onOpenChange={onOpenChange} />)
    fireEvent.click(screen.getByTestId('proceed-to-confirm'))
    expect(screen.getByText('partner.order.fill_required')).toBeInTheDocument()
  })

  it('moves to confirm step when fields filled', () => {
    render(<FlowerOrderDialog offer={mockOffer} open={true} onOpenChange={onOpenChange} />)
    fireEvent.change(screen.getByTestId('recipient-name'), { target: { value: 'Аня' } })
    fireEvent.change(screen.getByTestId('recipient-address'), { target: { value: 'Москва, ул. Ленина 1' } })
    fireEvent.click(screen.getByTestId('proceed-to-confirm'))
    expect(screen.getByText('partner.order.confirm')).toBeInTheDocument()
    expect(screen.getByText(/Аня/)).toBeInTheDocument()
  })

  it('goes back from confirm step', () => {
    render(<FlowerOrderDialog offer={mockOffer} open={true} onOpenChange={onOpenChange} />)
    fireEvent.change(screen.getByTestId('recipient-name'), { target: { value: 'Аня' } })
    fireEvent.change(screen.getByTestId('recipient-address'), { target: { value: 'Москва' } })
    fireEvent.click(screen.getByTestId('proceed-to-confirm'))
    fireEvent.click(screen.getByText('partner.order.back'))
    expect(screen.getByTestId('recipient-name')).toBeInTheDocument()
  })
})
