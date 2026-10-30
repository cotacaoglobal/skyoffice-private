import React, { useState } from 'react'
import styled from 'styled-components'
import Alert from '@mui/material/Alert'
import LockIcon from '@mui/icons-material/Lock'
import PersonIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { supabase } from '../supabaseClient'

const CardWrapper = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 36px 36px 28px 36px;
  width: 440px;
  max-width: calc(100vw - 24px);
  box-shadow: 
    0 20px 45px rgba(30, 58, 138, 0.15),
    0 4px 16px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #0f172a;
  z-index: 1000;
  box-sizing: border-box;

  @media (max-width: 600px) {
    padding: 30px 20px 22px 20px;
    width: calc(100vw - 20px) !important;
    max-width: calc(100vw - 20px) !important;
    gap: 14px;
  }
`

const TopLogoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;

  img {
    height: 112px;
    max-width: 330px;
    object-fit: contain;

    @media (max-width: 600px) {
      height: 90px;
    }
  }
  }
`

const Header = styled.div`
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;

  h2 {
    margin: 0;
    font-size: 19px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.3px;
  }

  p {
    margin: 0;
    font-size: 13px;
    color: #64748b;
  }
`

const ToggleTabs = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 12px;
  box-sizing: border-box;
`

const TabButton = styled.button<{ $active: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 12px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  outline: none;

  background: ${({ $active }) => ($active ? '#ffffff' : 'transparent')};
  border: none;
  color: ${({ $active }) => ($active ? '#1e40af' : '#64748b')};
  box-shadow: ${({ $active }) =>
    $active ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none'};

  &:hover {
    color: ${({ $active }) => ($active ? '#1e40af' : '#0f172a')};
  }
`

const Form = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
`

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
`

const InputLabel = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: #334155;
`

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: 10px;
  padding: 0 12px;
  transition: all 0.15s ease;

  &:focus-within {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  }

  .left-icon {
    color: #64748b;
    font-size: 19px;
    margin-right: 8px;
    display: flex;
    align-items: center;
  }

  input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    padding: 10px 0;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    color: #0f172a;

    &::placeholder {
      color: #94a3b8;
    }
  }

  .right-btn {
    background: transparent;
    border: none;
    outline: none;
    color: #64748b;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 4px;
    transition: color 0.15s;

    &:hover {
      color: #0f172a;
    }
  }
`

const PixelSubmitButton = styled.button`
  width: 100%;
  padding: 12px 18px;
  background: #2563eb;
  border: none;
  border-radius: 12px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
  margin-top: 4px;
  transition: all 0.15s ease;
  outline: none;

  &:hover {
    background: #1d4ed8;
    box-shadow: 0 6px 18px rgba(37, 99, 235, 0.45);
  }

  &:active {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .arrow-icon {
    font-size: 18px;
  }
`

const GuestFooterLink = styled.button`
  background: transparent;
  border: none;
  outline: none;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 4px;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.15s ease;
  align-self: center;

  &:hover {
    color: #2563eb;
    background: #f1f5f9;
  }
`

interface AuthDialogProps {
  onAuthSuccess: (user: any) => void
}

export default function AuthDialog({ onAuthSuccess }: AuthDialogProps) {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() },
          },
        })

        if (error) throw error

        if (data?.user) {
          setSuccessMsg('Conta criada com sucesso! Entrando...')
          if (name.trim()) {
            localStorage.setItem('skyoffice_user_name', name.trim())
          }
          setTimeout(() => {
            onAuthSuccess(data.user)
          }, 1000)
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (error) throw error

        if (data?.session?.user) {
          const userName =
            data.session.user.user_metadata?.full_name ||
            data.session.user.email?.split('@')[0] ||
            'Membro'
          localStorage.setItem('skyoffice_user_name', userName)
          onAuthSuccess(data.session.user)
        }
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Falha ao autenticar. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  const handleGuestEntry = () => {
    const guestUser = {
      id: 'guest-' + Math.random().toString(36).substr(2, 9),
      email: 'visitante@workoffice.com',
      user_metadata: { full_name: 'Visitante' },
    }
    localStorage.setItem('skyoffice_user_name', 'Visitante')
    onAuthSuccess(guestUser)
  }

  return (
    <CardWrapper>
      {/* Topo com Logo WorkOffice */}
      <TopLogoWrapper>
        <img src="/assets/workoffice-logo.jpg" alt="WorkOffice" />
      </TopLogoWrapper>

      <Header>
        <h2>Escritório Virtual Privado</h2>
        <p>Acesse sua equipe em tempo real</p>
      </Header>

      <ToggleTabs>
        <TabButton
          type="button"
          $active={!isRegister}
          onClick={() => {
            setIsRegister(false)
            setErrorMsg(null)
            setSuccessMsg(null)
          }}
        >
          <LockIcon style={{ fontSize: 16 }} />
          Entrar
        </TabButton>
        <TabButton
          type="button"
          $active={isRegister}
          onClick={() => {
            setIsRegister(true)
            setErrorMsg(null)
            setSuccessMsg(null)
          }}
        >
          <PersonIcon style={{ fontSize: 17 }} />
          Criar Conta
        </TabButton>
      </ToggleTabs>

      {errorMsg && (
        <Alert severity="error" style={{ width: '100%', fontSize: 12, borderRadius: 8 }}>
          {errorMsg}
        </Alert>
      )}

      {successMsg && (
        <Alert severity="success" style={{ width: '100%', fontSize: 12, borderRadius: 8 }}>
          {successMsg}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        {isRegister && (
          <InputGroup>
            <InputLabel>Seu Nome Completo *</InputLabel>
            <InputWrapper>
              <span className="left-icon">
                <PersonIcon style={{ fontSize: 18 }} />
              </span>
              <input
                type="text"
                required
                placeholder="Ex: Felipe Rocha"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </InputWrapper>
          </InputGroup>
        )}

        <InputGroup>
          <InputLabel>E-mail Corporativo *</InputLabel>
          <InputWrapper>
            <span className="left-icon">
              <EmailIcon style={{ fontSize: 18 }} />
            </span>
            <input
              type="email"
              required
              placeholder="felipe.rocha@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </InputWrapper>
        </InputGroup>

        <InputGroup>
          <InputLabel>Senha *</InputLabel>
          <InputWrapper>
            <span className="left-icon">
              <LockIcon style={{ fontSize: 18 }} />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="right-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? (
                <VisibilityOffIcon style={{ fontSize: 18 }} />
              ) : (
                <VisibilityIcon style={{ fontSize: 18 }} />
              )}
            </button>
          </InputWrapper>
        </InputGroup>

        <PixelSubmitButton type="submit" disabled={loading}>
          <ArrowForwardIcon className="arrow-icon" />
          <span>
            {loading
              ? 'AGUARDE...'
              : isRegister
              ? 'CADASTRAR E ACESSAR'
              : 'ENTRAR NO ESCRITÓRIO'}
          </span>
        </PixelSubmitButton>

        <GuestFooterLink type="button" onClick={handleGuestEntry}>
          — Ou continuar como visitante anônimo —
        </GuestFooterLink>
      </Form>
    </CardWrapper>
  )
}
