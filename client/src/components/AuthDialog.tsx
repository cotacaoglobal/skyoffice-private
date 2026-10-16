import React, { useState } from 'react'
import styled from 'styled-components'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import LockIcon from '@mui/icons-material/Lock'
import HowToRegIcon from '@mui/icons-material/HowToReg'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import { supabase } from '../supabaseClient'

const Wrapper = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #171821;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 36px 48px;
  width: 380px;
  max-width: 90vw;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #f8fafc;
  z-index: 1000;

  @media (max-width: 480px) {
    padding: 24px 18px;
    width: 92vw;
    gap: 12px;
  }
`

const Header = styled.div`
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;

  .icon-box {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: rgba(0, 235, 199, 0.1);
    color: #00ebc7;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 4px;
  }

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #f8fafc;
  }

  p {
    margin: 0;
    font-size: 13px;
    color: #94a3b8;
  }
`

const Form = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const ToggleMode = styled.div`
  display: flex;
  background: #212330;
  border-radius: 8px;
  padding: 4px;
  width: 100%;
  gap: 4px;

  button {
    flex: 1;
    background: transparent;
    border: none;
    padding: 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.2s;

    &.active {
      background: #2a2c3d;
      color: #00ebc7;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }

    &:hover:not(.active) {
      color: #f1f5f9;
    }
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

  // Permite entrada como visitante se desejar
  const handleGuestEntry = () => {
    onAuthSuccess({
      email: 'visitante@escritorio.local',
      user_metadata: { name: 'Visitante' },
    })
  }

  return (
    <Wrapper>
      <Header>
        <div className="icon-box">
          <MeetingRoomIcon style={{ fontSize: 28 }} />
        </div>
        <h2>Escritório Virtual Privado</h2>
        <p>Acesse sua equipe em tempo real</p>
      </Header>

      <ToggleMode>
        <button
          type="button"
          className={!isRegister ? 'active' : ''}
          onClick={() => {
            setIsRegister(false)
            setErrorMsg(null)
            setSuccessMsg(null)
          }}
        >
          <LockIcon style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }} />
          Entrar
        </button>
        <button
          type="button"
          className={isRegister ? 'active' : ''}
          onClick={() => {
            setIsRegister(true)
            setErrorMsg(null)
            setSuccessMsg(null)
          }}
        >
          <HowToRegIcon style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }} />
          Criar Conta
        </button>
      </ToggleMode>

      {errorMsg && (
        <Alert severity="error" style={{ width: '100%', fontSize: 12 }}>
          {errorMsg}
        </Alert>
      )}

      {successMsg && (
        <Alert severity="success" style={{ width: '100%', fontSize: 12 }}>
          {successMsg}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        {isRegister && (
          <TextField
            label="Seu Nome Completo"
            variant="outlined"
            size="small"
            fullWidth
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            InputLabelProps={{ style: { color: '#94a3b8' } }}
            InputProps={{ style: { color: '#f1f5f9', background: '#212330' } }}
          />
        )}

        <TextField
          label="E-mail Corporativo"
          type="email"
          variant="outlined"
          size="small"
          fullWidth
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          InputLabelProps={{ style: { color: '#94a3b8' } }}
          InputProps={{ style: { color: '#f1f5f9', background: '#212330' } }}
        />

        <TextField
          label="Senha"
          type="password"
          variant="outlined"
          size="small"
          fullWidth
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          InputLabelProps={{ style: { color: '#94a3b8' } }}
          InputProps={{ style: { color: '#f1f5f9', background: '#212330' } }}
        />

        <Button
          variant="contained"
          color="secondary"
          type="submit"
          disabled={loading}
          style={{
            marginTop: 8,
            padding: '10px 0',
            fontWeight: 700,
            background: '#00ebc7',
            color: '#0d1117',
          }}
        >
          {loading ? 'Aguarde...' : isRegister ? 'Cadastrar e Acessar' : 'Entrar no Escritório'}
        </Button>

        <Button
          variant="text"
          size="small"
          onClick={handleGuestEntry}
          style={{ color: '#64748b', fontSize: 11, textTransform: 'none' }}
        >
          Ou continuar como visitante anônimo
        </Button>
      </Form>
    </Wrapper>
  )
}
