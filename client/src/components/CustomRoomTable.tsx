import React, { useState } from 'react'
import styled from 'styled-components'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import TableContainer from '@mui/material/TableContainer'
import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import Tooltip from '@mui/material/Tooltip'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import LockIcon from '@mui/icons-material/Lock'
import { useAppSelector } from '../hooks'
import { getAvatarString, getColorByString } from '../util'

import phaserGame from '../PhaserGame'
import Bootstrap from '../scenes/Bootstrap'

const MessageText = styled.p`
  margin: 10px;
  font-size: 18px;
  color: #475569;
  text-align: center;
`

const CustomRoomTableContainer = styled(TableContainer)<{
  component: React.ElementType
}>`
  max-height: 500px;

  table {
    min-width: 650px;
  }
`

const TableRowWrapper = styled(TableRow)`
  &:last-child td,
  &:last-child th {
    border: 0;
  }

  .avatar {
    height: 30px;
    width: 30px;
    font-size: 15px;
  }

  .name {
    min-width: 100px;
    overflow-wrap: anywhere;
  }

  .description {
    min-width: 200px;
    overflow-wrap: anywhere;
  }

  .join-wrapper {
    display: flex;
    gap: 3px;
    align-items: center;
  }

  .lock-icon {
    font-size: 18px;
  }
`

const PasswordDialog = styled(Dialog)`
  .dialog-content {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .MuiDialog-paper {
    background: #ffffff; color: #0f172a; border-radius: 16px;
  }
`

export const CustomRoomTable = () => {
  const [password, setPassword] = useState('')
  const [selectedRoom, setSelectedRoom] = useState('')
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showPasswordError, setShowPasswordError] = useState(false)
  const [passwordFieldEmpty, setPasswordFieldEmpty] = useState(false)
  const lobbyJoined = useAppSelector((state) => state.room.lobbyJoined)
  const availableRooms = useAppSelector((state) => state.room.availableRooms)

  const handleJoinClick = (roomId: string, password: string | null) => {
    if (!lobbyJoined) return
    const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap
    bootstrap.network
      .joinCustomById(roomId, password)
      .then(() => bootstrap.launchGame())
      .catch((error) => {
        console.error(error)
        if (password) setShowPasswordError(true)
      })
  }

  const handlePasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const isValidPassword = password !== ''

    if (isValidPassword === passwordFieldEmpty) setPasswordFieldEmpty(!passwordFieldEmpty)
    if (isValidPassword) handleJoinClick(selectedRoom, password)
  }

  const resetPasswordDialog = () => {
    setShowPasswordDialog(false)
    setPassword('')
    setPasswordFieldEmpty(false)
    setShowPasswordError(false)
  }

  return availableRooms.length === 0 ? (
    <MessageText>Não há salas personalizadas no momento. Crie uma nova ou entre no escritório principal.</MessageText>
  ) : (
    <>
      <CustomRoomTableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>Nome da Sala</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell>ID</TableCell>
              <TableCell align="center">
                <PeopleAltIcon />
              </TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {availableRooms.map((room) => {
              const { roomId, metadata, clients } = room
              const { name, description, hasPassword } = metadata
              return (
                <TableRowWrapper key={roomId}>
                  <TableCell>
                    <Avatar className="avatar" style={{ background: getColorByString(name) }}>
                      {getAvatarString(name)}
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <div className="name" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontWeight: 600 }}>{name}</span>
                      {metadata?.theme && (
                        <span
                          style={{
                            fontSize: 10,
                            padding: '1px 6px',
                            borderRadius: 4,
                            background:
                              metadata.theme === 'ti_dev'
                                ? '#0284c7'
                                : metadata.theme === 'executive'
                                ? '#7c3aed'
                                : metadata.theme === 'creative'
                                ? '#059669'
                                : '#475569',
                            color: '#ffffff',
                            width: 'fit-content',
                            fontWeight: 'bold',
                          }}
                        >
                          {metadata.theme === 'ti_dev'
                            ? '💻 TI & Devs'
                            : metadata.theme === 'executive'
                            ? '👔 Diretoria'
                            : metadata.theme === 'creative'
                            ? '🎨 Criativo'
                            : '🏢 Corporativo'}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="description">{description}</div>
                  </TableCell>
                  <TableCell>{roomId}</TableCell>
                  <TableCell align="center">{clients}</TableCell>
                  <TableCell align="center">
                    <Tooltip title={hasPassword ? 'Requer senha para entrar' : ''}>
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => {
                          if (hasPassword) {
                            setShowPasswordDialog(true)
                            setSelectedRoom(roomId)
                          } else {
                            handleJoinClick(roomId, null)
                          }
                        }}
                      >
                        <div className="join-wrapper">
                          {hasPassword && <LockIcon className="lock-icon" />}
                          Entrar
                        </div>
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRowWrapper>
              )
            })}
          </TableBody>
        </Table>
      </CustomRoomTableContainer>
      <PasswordDialog open={showPasswordDialog} onClose={resetPasswordDialog}>
        <form onSubmit={handlePasswordSubmit}>
          <DialogContent className="dialog-content">
            <MessageText>Esta é uma sala privada. Por favor, digite a senha:</MessageText>
            <TextField
              autoFocus
              fullWidth
              error={passwordFieldEmpty}
              helperText={passwordFieldEmpty && 'A senha é obrigatória'}
              value={password}
              label="Senha"
              type="password"
              variant="outlined"
              color="secondary"
              onInput={(e) => {
                setPassword((e.target as HTMLInputElement).value)
              }}
            />
            {showPasswordError && (
              <Alert severity="error" variant="outlined">
                Senha Incorreta!
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button color="secondary" onClick={resetPasswordDialog}>
              Cancelar
            </Button>
            <Button color="secondary" type="submit">
              Entrar
            </Button>
          </DialogActions>
        </form>
      </PasswordDialog>
    </>
  )
}
