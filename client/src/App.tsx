import React from 'react'
import styled from 'styled-components'

import { useAppSelector, useAppDispatch } from './hooks'
import store from './stores'
import { setLoggedIn } from './stores/UserStore'

import RoomSelectionDialog from './components/RoomSelectionDialog'
import LoginDialog from './components/LoginDialog'
import ComputerDialog from './components/ComputerDialog'
import WhiteboardDialog from './components/WhiteboardDialog'
import VideoConnectionDialog from './components/VideoConnectionDialog'
import Chat from './components/Chat'
import HelperButtonGroup from './components/HelperButtonGroup'
import MobileVirtualJoystick from './components/MobileVirtualJoystick'
import MembersSidebar from './components/MembersSidebar'
import SoWorkSidebar from './components/SoWorkSidebar/SoWorkSidebar'
import AuthDialog from './components/AuthDialog'
import BottomTaskbar from './components/BottomTaskbar'
import ScreenShareViewer from './components/ScreenShareViewer'
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
  const [isAutoConnecting, setIsAutoConnecting] = React.useState<boolean>(false)

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

  // Auto-login / Reconexão automática caso o usuário tenha recarregado a página (F5)
  React.useEffect(() => {
    if (!authChecked || !authUser || loggedIn || isAutoConnecting) return

    const autoLogin = localStorage.getItem('skyoffice_auto_login') === 'true'
    const savedName = localStorage.getItem('skyoffice_user_name')
    const savedAvatar = localStorage.getItem('skyoffice_user_avatar') || 'adam'

    if (autoLogin && savedName) {
      setIsAutoConnecting(true)

      const tryAutoConnect = () => {
        const bootstrap = (window as any).game?.scene?.keys?.bootstrap
        const gameScene = (window as any).game?.scene?.keys?.game
        const lobbyJoined = (store?.getState?.() as any)?.room?.lobbyJoined

        if (bootstrap && bootstrap.network && (lobbyJoined || bootstrap.network.lobbyJoined)) {
          bootstrap.network
            .joinOrCreatePublic()
            .then(() => {
              bootstrap.launchGame()
              // Aguarda o Game Scene estar pronto para registrar teclas e jogador
              const checkGameInterval = setInterval(() => {
                const activeGame = (window as any).game?.scene?.keys?.game
                if (activeGame && activeGame.myPlayer) {
                  clearInterval(checkGameInterval)
                  activeGame.registerKeys()
                  activeGame.myPlayer.setPlayerName(savedName)
                  activeGame.myPlayer.setPlayerTexture(savedAvatar)
                  activeGame.network.readyToConnect()
                  store.dispatch(setLoggedIn(true))
                  setIsAutoConnecting(false)
                }
              }, 100)
            })
            .catch((err) => {
              console.warn('Falha no auto-login / reconexão automática:', err)
              setIsAutoConnecting(false)
            })
        } else {
          // Tenta novamente após um pequeno delay até o lobby carregar
          setTimeout(tryAutoConnect, 200)
        }
      }

      tryAutoConnect()
    }
  }, [authChecked, authUser, loggedIn, isAutoConnecting])

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
  } else if (isAutoConnecting || (!loggedIn && localStorage.getItem('skyoffice_auto_login') === 'true' && localStorage.getItem('skyoffice_user_name'))) {
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
        <div style={{ fontSize: 24 }}>🏢 Reconectando ao Escritório...</div>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>Restaurando sua sessão e avatar...</div>
      </div>
    )
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
          <SoWorkSidebar />
          <MobileVirtualJoystick />
          <BottomTaskbar />
          <ScreenShareViewer />
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
