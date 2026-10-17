import React, { useState } from 'react'
import styled from 'styled-components'
import BusinessIcon from '@mui/icons-material/Business'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import LockIcon from '@mui/icons-material/Lock'
import PublicIcon from '@mui/icons-material/Public'
import GroupIcon from '@mui/icons-material/Group'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CloseIcon from '@mui/icons-material/Close'
import Dialog from '@mui/material/Dialog'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Alert from '@mui/material/Alert'

import { DepartmentRoom, DepartmentStorage } from '../services/DepartmentStorage'
import { RoomTheme } from '../../../types/Rooms'
import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(6px);
  z-index: 10006;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #1e293b;
`

const ModalCard = styled.div`
  width: 100%;
  max-width: 820px;
  max-height: 85vh;
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e2e8f0;
`

const ModalHeader = styled.div`
  padding: 18px 24px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .brand {
    display: flex;
    align-items: center;
    gap: 12px;

    .icon-box {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: #eff6ff;
      color: #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
    }

    p {
      margin: 2px 0 0 0;
      font-size: 12px;
      color: #64748b;
    }
  }

  .close-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    color: #64748b;
    padding: 6px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;

    &:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
  }
`

const ModalBody = styled.div`
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
`

const DepartmentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 16px;
`

const DeptCard = styled.div<{ $themeColor: string }>`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  transition: all 0.2s ease;
  border-left: 4px solid ${({ $themeColor }) => $themeColor};

  &:hover {
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
    transform: translateY(-1px);
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;

    h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
    }

    .badge-group {
      display: flex;
      gap: 6px;
      align-items: center;
    }
  }

  .description {
    font-size: 13px;
    color: #475569;
    line-height: 1.4;
    margin: 0;
  }

  .members-area {
    background: #f8fafc;
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 12px;
    color: #64748b;
    display: flex;
    flex-direction: column;
    gap: 6px;

    .member-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
  }

  .card-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 6px;
    gap: 8px;

    .copy-link {
      background: transparent;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.15s;

      &:hover {
        background: #f1f5f9;
        color: #0f172a;
      }
    }

    .enter-btn {
      background: #2563eb;
      color: #ffffff;
      border: none;
      border-radius: 6px;
      padding: 6px 14px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s;

      &:hover {
        background: #1d4ed8;
      }
    }
  }
`

interface Props {
  open: boolean
  onClose: () => void
  onSwitchDepartment: (dept: DepartmentRoom) => void
}

export default function DepartmentManagerDialog({
  open,
  onClose,
  onSwitchDepartment,
}: Props) {
  const [departments, setDepartments] = useState<DepartmentRoom[]>(DepartmentStorage.getDepartments())
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Formulário de novo departamento
  const [newDeptName, setNewDeptName] = useState('')
  const [newDeptDesc, setNewDeptDesc] = useState('')
  const [newDeptTheme, setNewDeptTheme] = useState<RoomTheme>('ti_dev')
  const [newDeptAccess, setNewDeptAccess] = useState<'open' | 'members_only' | 'password'>('open')
  const [newDeptPassword, setNewDeptPassword] = useState('')
  const [memberInput, setMemberInput] = useState('')
  const [allowedMembers, setAllowedMembers] = useState<string[]>([])

  if (!open) return null

  const themeColorMap: Record<RoomTheme, string> = {
    default: '#475569',
    ti_dev: '#0284c7',
    executive: '#7c3aed',
    creative: '#059669',
  }

  const handleCopyInviteLink = (dept: DepartmentRoom) => {
    const url = `${window.location.origin}${window.location.pathname}?dept=${dept.id}`
    navigator.clipboard.writeText(url)
    setCopiedId(dept.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleAddMember = () => {
    if (memberInput.trim() && !allowedMembers.includes(memberInput.trim())) {
      setAllowedMembers([...allowedMembers, memberInput.trim()])
      setMemberInput('')
    }
  }

  const handleRemoveMember = (name: string) => {
    setAllowedMembers(allowedMembers.filter((m) => m !== name))
  }

  const handleSaveNewDepartment = () => {
    if (!newDeptName.trim()) return

    const newDept: DepartmentRoom = {
      id: `dept-${Date.now()}`,
      name: newDeptName.trim(),
      description: newDeptDesc.trim(),
      theme: newDeptTheme,
      accessType: newDeptAccess,
      password: newDeptAccess === 'password' ? newDeptPassword : null,
      allowedMembers,
      createdAt: new Date().toISOString(),
      isPermanent: true,
    }

    DepartmentStorage.upsertDepartment(newDept)
    setDepartments(DepartmentStorage.getDepartments())

    // Limpa form
    setNewDeptName('')
    setNewDeptDesc('')
    setNewDeptPassword('')
    setAllowedMembers([])
    setShowCreateModal(false)
  }

  const handleDeleteDepartment = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este departamento?')) {
      DepartmentStorage.deleteDepartment(id)
      setDepartments(DepartmentStorage.getDepartments())
    }
  }

  return (
    <ModalBackdrop onClick={onClose}>
      <ModalCard onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <div className="brand">
            <div className="icon-box">
              <BusinessIcon style={{ fontSize: 24 }} />
            </div>
            <div>
              <h3>Departamentos & Salas Corporativas</h3>
              <p>Gerencie salas fixas, permissões de membros e links de convite direto</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateModal(true)}
              style={{ background: '#2563eb', textTransform: 'none', fontWeight: 600, borderRadius: 8 }}
            >
              Novo Departamento
            </Button>
            <button className="close-btn" onClick={onClose} title="Fechar">
              <CloseIcon style={{ fontSize: 20 }} />
            </button>
          </div>
        </ModalHeader>

        <ModalBody>
          <DepartmentGrid>
            {departments.map((dept) => {
              const themeColor = themeColorMap[dept.theme] || '#475569'
              return (
                <DeptCard key={dept.id} $themeColor={themeColor}>
                  <div className="card-top">
                    <h4>{dept.name}</h4>
                    <div className="badge-group">
                      {dept.accessType === 'open' && (
                        <Chip
                          icon={<PublicIcon style={{ fontSize: 13 }} />}
                          label="Aberto"
                          size="small"
                          style={{ height: 22, fontSize: 10, background: '#f0fdf4', color: '#16a34a' }}
                        />
                      )}
                      {dept.accessType === 'members_only' && (
                        <Chip
                          icon={<GroupIcon style={{ fontSize: 13 }} />}
                          label="Restrito"
                          size="small"
                          style={{ height: 22, fontSize: 10, background: '#f5f3ff', color: '#7c3aed' }}
                        />
                      )}
                      {dept.accessType === 'password' && (
                        <Chip
                          icon={<LockIcon style={{ fontSize: 13 }} />}
                          label="Com Senha"
                          size="small"
                          style={{ height: 22, fontSize: 10, background: '#fffbeb', color: '#b45309' }}
                        />
                      )}
                    </div>
                  </div>

                  <p className="description">{dept.description || 'Sem descrição informada.'}</p>

                  <div className="members-area">
                    <span>
                      👥 <strong>Membros com Acesso:</strong>{' '}
                      {dept.accessType === 'open' ? 'Todos os colaboradores da empresa' : `${dept.allowedMembers.length} membro(s) autorizados`}
                    </span>
                    {dept.allowedMembers.length > 0 && (
                      <div className="member-chips">
                        {dept.allowedMembers.map((m, i) => (
                          <Chip key={i} label={m} size="small" style={{ height: 20, fontSize: 10 }} />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="card-actions">
                    <button className="copy-link" onClick={() => handleCopyInviteLink(dept)}>
                      {copiedId === dept.id ? (
                        <>
                          <CheckCircleIcon style={{ fontSize: 14, color: '#16a34a' }} />
                          Link Copiado!
                        </>
                      ) : (
                        <>
                          <ContentCopyIcon style={{ fontSize: 14 }} />
                          Copiar Link
                        </>
                      )}
                    </button>

                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {dept.id !== 'dept-geral' && (
                        <button
                          onClick={() => handleDeleteDepartment(dept.id)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                          title="Excluir Departamento"
                        >
                          <DeleteOutlineIcon style={{ fontSize: 18 }} />
                        </button>
                      )}
                      <button
                        className="enter-btn"
                        onClick={() => {
                          onClose()
                          onSwitchDepartment(dept)
                        }}
                      >
                        Entrar na Sala
                        <ArrowForwardIcon style={{ fontSize: 14 }} />
                      </button>
                    </div>
                  </div>
                </DeptCard>
              )
            })}
          </DepartmentGrid>
        </ModalBody>
      </ModalCard>

      {/* Modal Criar Novo Departamento */}
      <Dialog open={showCreateModal} onClose={() => setShowCreateModal(false)} maxWidth="sm" fullWidth>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
            🏢 Criar Novo Departamento / Sala Fixa
          </h3>

          <TextField
            label="Nome do Departamento"
            variant="outlined"
            size="small"
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
            placeholder="Ex: Squad Mobile, Suporte ao Cliente, RH"
            fullWidth
          />

          <TextField
            label="Descrição"
            variant="outlined"
            size="small"
            multiline
            rows={2}
            value={newDeptDesc}
            onChange={(e) => setNewDeptDesc(e.target.value)}
            placeholder="Finalidade e escopo desta sala"
            fullWidth
          />

          <FormControl size="small" fullWidth>
            <InputLabel>Layout & Ambiente</InputLabel>
            <Select
              value={newDeptTheme}
              label="Layout & Ambiente"
              onChange={(e) => setNewDeptTheme(e.target.value as RoomTheme)}
            >
              <MenuItem value="default">🏢 Escritório Geral Corporativo</MenuItem>
              <MenuItem value="ti_dev">💻 Setor Squad TI, Devs & Infra</MenuItem>
              <MenuItem value="executive">👔 Sala de Diretoria & Conferência</MenuItem>
              <MenuItem value="creative">🎨 Estúdio de Design & Brainstorming</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel>Política de Acesso</InputLabel>
            <Select
              value={newDeptAccess}
              label="Política de Acesso"
              onChange={(e) => setNewDeptAccess(e.target.value as any)}
            >
              <MenuItem value="open">🌍 Aberto para todos os membros</MenuItem>
              <MenuItem value="members_only">🔒 Restrito apenas a membros cadastrados</MenuItem>
              <MenuItem value="password">🔑 Protegido por Senha</MenuItem>
            </Select>
          </FormControl>

          {newDeptAccess === 'password' && (
            <TextField
              label="Senha de Acesso"
              type="password"
              variant="outlined"
              size="small"
              value={newDeptPassword}
              onChange={(e) => setNewDeptPassword(e.target.value)}
              fullWidth
            />
          )}

          {newDeptAccess === 'members_only' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                Adicionar Membros Permitidos:
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <TextField
                  size="small"
                  placeholder="Nome ou email do membro"
                  value={memberInput}
                  onChange={(e) => setMemberInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                  fullWidth
                />
                <Button variant="outlined" onClick={handleAddMember}>
                  Adicionar
                </Button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {allowedMembers.map((m) => (
                  <Chip
                    key={m}
                    label={m}
                    onDelete={() => handleRemoveMember(m)}
                    size="small"
                  />
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <Button onClick={() => setShowCreateModal(false)}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={handleSaveNewDepartment}
              disabled={!newDeptName.trim()}
              style={{ background: '#2563eb' }}
            >
              Salvar Departamento
            </Button>
          </div>
        </div>
      </Dialog>
    </ModalBackdrop>
  )
}
