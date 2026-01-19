import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import RealtimeNotifications from '../components/RealtimeNotifications'

// Mock do hook WebSocket
const mockWebSocket = {
  isConnected: true,
  lastMessage: null,
  sendMessage: vi.fn()
}

vi.mock('../hooks/useWebSocket', () => ({
  default: () => mockWebSocket
}))

describe('RealtimeNotifications Component', () => {
  it('deve mostrar status conectado quando WebSocket está ativo', () => {
    render(<RealtimeNotifications />)
    
    expect(screen.getByText('Conectado')).toBeInTheDocument()
  })

  it('deve mostrar status desconectado quando WebSocket não está ativo', () => {
    mockWebSocket.isConnected = false
    
    render(<RealtimeNotifications />)
    
    expect(screen.getByText('Desconectado')).toBeInTheDocument()
  })

  it('deve mostrar indicador visual correto para conexão', () => {
    mockWebSocket.isConnected = true
    
    render(<RealtimeNotifications />)
    
    const statusElement = screen.getByText('Conectado').parentElement
    expect(statusElement).toHaveClass('bg-green-100')
  })
})