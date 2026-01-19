import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Login from '../pages/Login'

// Mock do authStore
const mockLogin = vi.fn()
const mockAuthStore = {
  login: mockLogin,
  isAuthenticated: false,
  loading: false
}

vi.mock('../store/authStore', () => ({
  useAuthStore: () => mockAuthStore
}))

// Helper para renderizar com Router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Login Component', () => {
  it('deve renderizar o formulário de login', () => {
    renderWithRouter(<Login />)
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  it('deve permitir digitar email e senha', () => {
    renderWithRouter(<Login />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/senha/i)
    
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
    fireEvent.change(passwordInput, { target: { value: '123456' } })
    
    expect(emailInput.value).toBe('test@test.com')
    expect(passwordInput.value).toBe('123456')
  })

  it('deve chamar login ao submeter o formulário', () => {
    renderWithRouter(<Login />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/senha/i)
    const submitButton = screen.getByRole('button', { name: /entrar/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
    fireEvent.change(passwordInput, { target: { value: '123456' } })
    fireEvent.click(submitButton)
    
    expect(mockLogin).toHaveBeenCalledWith('test@test.com', '123456')
  })
})