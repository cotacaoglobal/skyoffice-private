import React from 'react'
import styled from 'styled-components'

import { useAppSelector } from './hooks'

import RoomSelectionDialog from './components/RoomSelectionDialog'
import LoginDialog from './components/LoginDialog'
import ComputerDialog from './components/ComputerDialog'
import WhiteboardDialog from './components/WhiteboardDialog'
import VideoConnectionDialog from './components/VideoConnectionDialog'
import Chat from './components/Chat'
import HelperButtonGroup from './components/HelperButtonGroup'
import MobileVirtualJoystick from './components/MobileVirtualJoystick'
import MembersSidebar from './components/MembersSidebar'
import AuthDialog from './components/AuthDialog'
import BottomTaskbar from './components/BottomTaskbar'
import PlayerContextMenu from './components/PlayerContextMenu'

const Backdrop = styled.div`
  position: absolute;
  height: 100%;
  width: 100%;
  pointer-events: none;

  & > * {
    pointer-events: auto;
  }
`

function App() {
  const loggedIn = useAppSelector((state) => state.user.loggedIn)
  const computerDialogOpen = useAppSelector((state) => state.computer.computerDialogOpen)
  const whiteboardDialogOpen = useAppSelector((state) => state.whiteboard.whiteboardDialogOpen)
  const videoConnected = useAppSelector((state) => state.user.videoConnected)
  const roomJoined = useAppSelector((state) => state.room.roomJoined)

  const [authUser, setAuthUser] = React.useState<any>(null)
  const [authChecked, setAuthChecked] = React.useState<boolean>(false)

  React.useEffect(() => {
    let isMounted = true
    const timeout = setTimeout(() => {
      if (isMounted) setAuthChecked(true)
    }, 2000)

    // Verifica sessão existente do Supabase
    import('./supabaseClient')
      .then(({ supabase }) => {
        supabase.auth
          .getSession()
          .then(({ data }) => {
            if (isMounted) {
              if (data?.session?.user) {
                setAuthUser(data.session.user)
              }
              setAuthChecked(true)
            }
          })
          .catch((err) => {
            console.warn('Erro ao obter sessão do Supabase:', err)
            if (isMounted) setAuthChecked(true)
          })
      })
      .catch((err) => {
        console.warn('Erro ao carregar cliente Supabase:', err)
        if (isMounted) setAuthChecked(true)
      })

    return () => {
      isMounted = false
      clearTimeout(timeout)
    }
  }, [])

  let ui: JSX.Element
  if (!authChecked) {
    ui = (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: '#091326',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#00f5d4',
          fontFamily: "'Silkscreen', monospace, sans-serif",
          zIndex: 99999,
          gap: 12,
        }}
      >
        <div style={{ fontSize: 24 }}>🏢 Carregando Escritório...</div>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>Inicializando ambiente virtual...</div>
      </div>
    )
  } else if (!authUser) {
    ui = <AuthDialog onAuthSuccess={(user) => setAuthUser(user)} />
  } else if (loggedIn) {
    if (computerDialogOpen) {
      /* Render ComputerDialog if user is using a computer. */
      ui = <ComputerDialog />
    } else if (whiteboardDialogOpen) {
      /* Render WhiteboardDialog if user is using a whiteboard. */
      ui = <WhiteboardDialog />
    } else {
      ui = (
        /* Render Chat or VideoConnectionDialog if no dialogs are opened. */
        <>
          <Chat />
          <MembersSidebar />
          <MobileVirtualJoystick />
          <BottomTaskbar />
          <PlayerContextMenu />
        </>
      )
    }
  } else if (roomJoined) {
    /* Render LoginDialog if not logged in but selected a room. */
    ui = <LoginDialog />
  } else {
    /* Render RoomSelectionDialog if yet selected a room. */
    ui = <RoomSelectionDialog />
  }

  return (
    <Backdrop>
      {ui}
      {/* Render HelperButtonGroup if no dialogs are opened. */}
      {!computerDialogOpen && !whiteboardDialogOpen && <HelperButtonGroup />}
    </Backdrop>
  )
}

export default App
