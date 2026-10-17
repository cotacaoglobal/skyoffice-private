import React, { useState } from 'react'
import styled from 'styled-components'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'

import { IRoomData, RoomTheme } from '../../../types/Rooms'
import { useAppSelector } from '../hooks'

import phaserGame from '../PhaserGame'
import Bootstrap from '../scenes/Bootstrap'

const CreateRoomFormWrapper = styled.form`
  display: flex;
  flex-direction: column;
  width: 340px;
  gap: 16px;
`

export const CreateRoomForm = () => {
  const [values, setValues] = useState<IRoomData>({
    name: '',
    description: '',
    password: null,
    autoDispose: true,
    theme: 'default',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [nameFieldEmpty, setNameFieldEmpty] = useState(false)
  const [descriptionFieldEmpty, setDescriptionFieldEmpty] = useState(false)
  const lobbyJoined = useAppSelector((state) => state.room.lobbyJoined)

  const handleChange = (prop: keyof IRoomData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [prop]: event.target.value })
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const isValidName = values.name !== ''
    const isValidDescription = values.description !== ''

    if (isValidName === nameFieldEmpty) setNameFieldEmpty(!nameFieldEmpty)
    if (isValidDescription === descriptionFieldEmpty)
      setDescriptionFieldEmpty(!descriptionFieldEmpty)

    // create custom room if name and description are not empty
    if (isValidName && isValidDescription && lobbyJoined) {
      const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap
      bootstrap.network
        .createCustom(values)
        .then(() => bootstrap.launchGame())
        .catch((error) => console.error(error))
    }
  }

  return (
    <CreateRoomFormWrapper onSubmit={handleSubmit}>
      <TextField
        label="Nome da Sala"
        variant="outlined"
        color="secondary"
        autoFocus
        error={nameFieldEmpty}
        helperText={nameFieldEmpty && 'O nome da sala é obrigatório'}
        onChange={handleChange('name')}
      />

      <TextField
        label="Descrição da Sala"
        variant="outlined"
        color="secondary"
        error={descriptionFieldEmpty}
        helperText={descriptionFieldEmpty && 'A descrição é obrigatória'}
        multiline
        rows={2}
        onChange={handleChange('description')}
      />

      <FormControl variant="outlined" color="secondary" size="small">
        <InputLabel id="theme-select-label">Ambiente / Setor da Sala</InputLabel>
        <Select
          labelId="theme-select-label"
          id="theme-select"
          value={values.theme || 'default'}
          label="Ambiente / Setor da Sala"
          onChange={(e) => setValues({ ...values, theme: e.target.value as RoomTheme })}
        >
          <MenuItem value="default">🏢 Escritório Geral Corporativo</MenuItem>
          <MenuItem value="ti_dev">💻 Setor Squad TI, Devs & Infra</MenuItem>
          <MenuItem value="executive">👔 Sala de Diretoria & Conferência</MenuItem>
          <MenuItem value="creative">🎨 Estúdio de Design & Brainstorming</MenuItem>
        </Select>
      </FormControl>

      <TextField
        type={showPassword ? 'text' : 'password'}
        label="Senha (opcional)"
        onChange={handleChange('password')}
        color="secondary"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <Button variant="contained" color="secondary" type="submit">
        Criar Sala
      </Button>
    </CreateRoomFormWrapper>
  )
}
