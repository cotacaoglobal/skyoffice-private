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
  background: #091326;
  border: 4px solid #083344;
  border-radius: 20px;
  padding: 42px 36px 30px 36px;
  width: 400px;
  max-width: calc(100vw - 24px);
  box-shadow: 
    0 0 0 2px #020b17,
    0 20px 50px rgba(0, 0, 0, 0.85),
    0 0 30px rgba(0, 235, 199, 0.22),
    inset 0 0 0 2px #0d4a5e;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #f8fafc;
  z-index: 1000;
  box-sizing: border-box;

  @media (max-width: 600px) {
    padding: 38px 18px 24px 18px;
    width: calc(100vw - 20px) !important;
    max-width: calc(100vw - 20px) !important;
    gap: 14px;
  }
`

// Cantos de Diamante Pixel Art
const PixelCorner = styled.div<{ $position: 'tl' | 'tr' | 'bl' | 'br' }>`
  position: absolute;
  width: 14px;
  height: 14px;
  background: #00f5d4;
  border: 2px solid #020b17;
  box-shadow: 
    0 0 8px #00f5d4,
    inset -2px -2px 0 #0f766e,
    inset 2px 2px 0 #ffffff;
  z-index: 10;

  ${({ $position }) =>
    $position === 'tl' &&
    `
    top: -4px;
    left: -4px;
    border-radius: 3px 0 0 0;
  `}

  ${({ $position }) =>
    $position === 'tr' &&
    `
    top: -4px;
    right: -4px;
    border-radius: 0 3px 0 0;
  `}

  ${({ $position }) =>
    $position === 'bl' &&
    `
    bottom: -4px;
    left: -4px;
    border-radius: 0 0 0 3px;
  `}

  ${({ $position }) =>
    $position === 'br' &&
    `
    bottom: -4px;
    right: -4px;
    border-radius: 0 0 3px 0;
  `}
`

// Emblema pixel central no topo que transborda a borda
const TopBadge = styled.div`
  position: absolute;
  top: -28px;
  left: 50%;
  transform: translateX(-50%);
  width: 56px;
  height: 56px;
  background: #062b3a;
  border: 3px solid #00f5d4;
  border-radius: 14px;
  box-shadow: 
    0 0 16px rgba(0, 245, 212, 0.5),
    0 4px 10px rgba(0, 0, 0, 0.6),
    inset 0 0 0 2px #020b17;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 12;
`

const Header = styled.div`
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
  margin-top: 6px;

  h2 {
    margin: 0;
    font-family: 'Silkscreen', 'Press Start 2P', monospace, sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: #ffffff;
    text-shadow: 0 2px 0 #000000, 0 0 10px rgba(0, 235, 199, 0.3);
    letter-spacing: 0.3px;

    @media (max-width: 480px) {
      font-size: 16px;
    }
  }

  p {
    margin: 0;
    font-family: 'Silkscreen', monospace, sans-serif;
    font-size: 11px;
    color: #94a3b8;
    letter-spacing: 0.2px;
  }
`

const ToggleTabs = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;
  margin: 4px 0 2px 0;
`

const TabButton = styled.button<{ $active: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  font-family: 'Silkscreen', monospace, sans-serif;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  outline: none;

  background: ${({ $active }) => ($active ? '#063542' : '#101c36')};
  border: 2px solid ${({ $active }) => ($active ? '#00f5d4' : '#1e293b')};
  color: ${({ $active }) => ($active ? '#00f5d4' : '#64748b')};
  box-shadow: ${({ $active }) =>
    $active ? '0 0 12px rgba(0, 245, 212, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)' : 'none'};

  &:hover {
    color: ${({ $active }) => ($active ? '#00f5d4' : '#e2e8f0')};
    border-color: ${({ $active }) => ($active ? '#00f5d4' : '#334155')};
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
  font-family: 'Silkscreen', monospace, sans-serif;
  font-size: 11px;
  color: #94a3b8;
  letter-spacing: 0.2px;
`

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  background: #0d1933;
  border: 2px solid #0284c7;
  border-radius: 10px;
  padding: 0 12px;
  transition: all 0.15s ease;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);

  &:focus-within {
    border-color: #00f5d4;
    box-shadow: 
      0 0 10px rgba(0, 245, 212, 0.45),
      inset 0 2px 4px rgba(0, 0, 0, 0.4);
  }

  .left-icon {
    color: #00f5d4;
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
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #ffffff;

    &::placeholder {
      color: #475569;
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
      color: #00f5d4;
    }
  }
`

const PixelSubmitButton = styled.button`
  width: 100%;
  padding: 14px 18px;
  background: linear-gradient(180deg, #00f5d4 0%, #00c9ab 100%);
  border: 2px solid #002b24;
  border-top: 2px solid #a7f3d0;
  border-left: 2px solid #a7f3d0;
  border-bottom: 5px solid #036b5c;
  border-right: 5px solid #036b5c;
  border-radius: 14px;
  color: #01221b;
  font-family: 'Silkscreen', 'Press Start 2P', monospace, sans-serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 6px 16px rgba(0, 245, 212, 0.35);
  margin-top: 6px;
  transition: all 0.1s ease;
  outline: none;

  &:hover {
    background: linear-gradient(180deg, #38ef7d 0%, #00f5d4 100%);
    box-shadow: 0 8px 22px rgba(0, 245, 212, 0.55);
  }

  &:active {
    transform: translateY(3px);
    border-bottom: 2px solid #036b5c;
    border-right: 2px solid #036b5c;
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
  font-family: 'Silkscreen', monospace, sans-serif;
  font-size: 11px;
  color: #64748b;
  text-align: center;
  cursor: pointer;
  margin-top: 6px;
  transition: color 0.15s, text-shadow 0.15s;
  outline: none;

  &:hover {
    color: #00f5d4;
    text-shadow: 0 0 8px rgba(0, 245, 212, 0.6);
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
          email,
          password,
          options: {
            data: {
              name: name.trim() || email.split('@')[0],
            },
          },
        })
        if (error) throw error

        if (data.session) {
          onAuthSuccess(data.user)
        } else {
          setSuccessMsg('Conta criada! Você já pode entrar ou confirmar seu e-mail.')
          setIsRegister(false)
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error

        if (data.user) {
          onAuthSuccess(data.user)
        }
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Falha na autenticação. Verifique os dados.')
    } finally {
      setLoading(false)
    }
  }

  const handleGuestEntry = () => {
    onAuthSuccess({
      email: 'visitante@escritorio.local',
      user_metadata: { name: 'Visitante' },
    })
  }

  return (
    <CardWrapper>
      {/* 4 Cantos Pixel Art */}
      <PixelCorner $position="tl" />
      <PixelCorner $position="tr" />
      <PixelCorner $position="bl" />
      <PixelCorner $position="br" />

      {/* Emblema central no topo (Caderno Pixel) */}
      <TopBadge>
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          style={{ imageRendering: 'pixelated' }}
        >
          {/* Capa do caderno */}
          <rect
            x="5"
            y="3"
            width="15"
            height="18"
            rx="2"
            fill="#00ebc7"
            stroke="#020b17"
            strokeWidth="2"
          />
          {/* Espirais brancas */}
          <rect x="3" y="6" width="3" height="2" fill="#ffffff" />
          <rect x="3" y="11" width="3" height="2" fill="#ffffff" />
          <rect x="3" y="16" width="3" height="2" fill="#ffffff" />
          {/* Detalhe interno do caderno */}
          <line x1="12" y1="8" x2="12" y2="16" stroke="#020b17" strokeWidth="2" strokeLinecap="round" />
          <line x1="15" y1="10" x2="15" y2="13" stroke="#020b17" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </TopBadge>

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
              placeholder="••••••••"
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
