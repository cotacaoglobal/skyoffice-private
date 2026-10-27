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

  @media (max-width: 768px) {
    padding: 14px 10px;
    align-items: center;
  }
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

  @media (max-width: 768px) {
    max-width: 420px;
    max-height: 94vh;
    border-radius: 20px;
  }
`

const ModalHeader = styled.div`
  padding: 18px 24px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .header-content {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 14px;
  }

  .header-top-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
  }

  .brand {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    flex: 1;

    .icon-box {
      width: 44px;
      height: 44px;
      min-width: 44px;
      border-radius: 12px;
      background: #eff6ff;
      color: #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .title-group {
      h3 {
        margin: 0;
        font-size: 19px;
        font-weight: 800;
        color: #0f172a;
        line-height: 1.25;
      }

      p {
        margin: 4px 0 0 0;
        font-size: 12.5px;
        color: #64748b;
        line-height: 1.4;
      }
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
    margin-top: -2px;
    margin-right: -4px;

    &:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
  }

  .new-dept-btn {
    width: 100%;
    background: #2563eb;
    color: #ffffff;
    border: none;
    border-radius: 10px;
    padding: 10px 16px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all 0.15s ease;
    box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);

    &:hover {
      background: #1d4ed8;
      box-shadow: 0 4px 10px rgba(37, 99, 235, 0.35);
    }
  }

  @media (max-width: 768px) {
    padding: 18px 18px 14px 18px;

    .brand {
      .icon-box {
        width: 46px;
        height: 46px;
        min-width: 46px;
        border-radius: 12px;
      }

      .title-group h3 {
        font-size: 17.5px;
      }

      .title-group p {
        font-size: 11.5px;
      }
    }

    .new-dept-btn {
      padding: 9px 16px;
      font-size: 13.5px;
      border-radius: 10px;
    }
  }
`

const ModalBody = styled.div`
  padding: 20px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #ffffff;

  @media (max-width: 768px) {
    padding: 16px 14px;
    gap: 14px;
  }
`

const DepartmentGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`

const DeptCard = styled.div<{ $themeColor: string }>`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  transition: all 0.2s ease;
  border-left: 4px solid ${({ $themeColor }) => $themeColor};

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;

    h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
    }

    .badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 11.5px;
      font-weight: 600;

      &.open {
        background: #f0fdf4;
        color: #16a34a;
        border: 1px solid #dcfce7;
      }

      &.restricted {
        background: #f5f3ff;
        color: #7c3aed;
        border: 1px solid #ede9fe;
      }

      &.password {
        background: #fffbeb;
        color: #b45309;
        border: 1px solid #fef3c7;
      }
    }
  }

  .description {
    font-size: 13px;
    color: #475569;
    line-height: 1.45;
    margin: 0;
  }

  .members-area {
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    border-radius: 10px;
    padding: 10px 12px;
    font-size: 12px;
    color: #475569;
    display: flex;
    flex-direction: column;
    gap: 6px;

    .members-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #334155;
    }

    .members-subtext {
      color: #64748b;
      font-size: 11.5px;
      margin-left: 26px;
    }

    .member-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-left: 26px;
    }
  }

  .card-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 4px;
    gap: 10px;

    .copy-link {
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 7px 14px;
      font-size: 13px;
      font-weight: 600;
      color: #2563eb;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s;

      &:hover {
        background: #eff6ff;
        border-color: #93c5fd;
      }
    }

    .action-right {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .enter-btn {
      background: #2563eb;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 7px 16px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s;
      box-shadow: 0 1px 3px rgba(37, 99, 235, 0.2);

      &:hover {
        background: #1d4ed8;
      }
    }
  }

  @media (max-width: 768px) {
    padding: 14px 14px;

    .card-top h4 {
      font-size: 15px;
    }

    .description {
      font-size: 12.5px;
    }

    .card-actions {
      .copy-link {
        padding: 6px 12px;
        font-size: 12.5px;
      }

      .enter-btn {
        padding: 6px 14px;
        font-size: 12.5px;
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
          <div className="header-content">
            <div className="header-top-row">
              <div className="brand">
                <div className="icon-box">
                  <BusinessIcon style={{ fontSize: 26 }} />
                </div>
                <div className="title-group">
                  <h3>Departamentos & Salas Corporativas</h3>
                  <p>Gerencie salas fixas, permissões de membros e links de convite direto</p>
                </div>
              </div>
              <button className="close-btn" onClick={onClose} title="Fechar">
                <CloseIcon style={{ fontSize: 20 }} />
              </button>
            </div>

            <button className="new-dept-btn" onClick={() => setShowCreateModal(true)}>
              <AddIcon style={{ fontSize: 18 }} />
              Novo Departamento
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
                    <div>
                      {dept.accessType === 'open' && (
                        <span className="badge-pill open">
                          <span style={{ fontSize: 10 }}>●</span> Aberto
                        </span>
                      )}
                      {dept.accessType === 'members_only' && (
                        <span className="badge-pill restricted">
                          <LockIcon style={{ fontSize: 13 }} /> Restrito
                        </span>
                      )}
                      {dept.accessType === 'password' && (
                        <span className="badge-pill password">
                          <LockIcon style={{ fontSize: 13 }} /> Com Senha
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="description">{dept.description || 'Sem descrição informada.'}</p>

                  <div className="members-area">
                    <div className="members-label">
                      <GroupIcon style={{ fontSize: 17, color: '#475569' }} />
                      <span>Membros com Acesso:</span>
                    </div>
                    <span className="members-subtext">
                      {dept.accessType === 'open'
                        ? 'Todos os colaboradores da empresa'
                        : dept.allowedMembers.length > 0
                        ? dept.allowedMembers.join(', ')
                        : 'Apenas diretores e equipe autorizada'}
                    </span>
                  </div>

                  <div className="card-actions">
                    <button className="copy-link" onClick={() => handleCopyInviteLink(dept)}>
                      {copiedId === dept.id ? (
                        <>
                          <CheckCircleIcon style={{ fontSize: 15, color: '#16a34a' }} />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <ContentCopyIcon style={{ fontSize: 15 }} />
                          Copiar Link
                        </>
                      )}
                    </button>

                    <div className="action-right">
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
