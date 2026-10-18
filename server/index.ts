import http from 'http'
import express from 'express'
import cors from 'cors'
import { Server, LobbyRoom } from 'colyseus'
import { monitor } from '@colyseus/monitor'
import { RoomType } from '../types/Rooms'

// import socialRoutes from "@colyseus/social/express"

import { SkyOffice } from './rooms/SkyOffice'

const port = Number(process.env.PORT || 2567)
const app = express()

app.use(cors())
app.use(express.json())
// app.use(express.static('dist'))

// Configuração Centralizada da IA do Escritório
let officeGeminiApiKey: string = process.env.GEMINI_API_KEY || ''

app.get('/api/office-settings', (req, res) => {
  res.json({
    hasGeminiApiKey: Boolean(officeGeminiApiKey),
    geminiApiKey: officeGeminiApiKey,
  })
})

app.post('/api/office-settings', (req, res) => {
  const { geminiApiKey } = req.body
  if (typeof geminiApiKey === 'string') {
    officeGeminiApiKey = geminiApiKey.trim()
    console.log('[SkyOffice] Chave de API do Gemini do escritório atualizada com sucesso.')
    res.json({ success: true, hasGeminiApiKey: Boolean(officeGeminiApiKey) })
  } else {
    res.status(400).json({ error: 'Chave inválida' })
  }
})

const server = http.createServer(app)
const gameServer = new Server({
  server,
})

// register room handlers
gameServer.define(RoomType.LOBBY, LobbyRoom)
gameServer.define(RoomType.PUBLIC, SkyOffice, {
  name: 'Pink Aplly',
  description: '',
  password: null,
  autoDispose: false,
})
gameServer.define(RoomType.CUSTOM, SkyOffice).enableRealtimeListing()

/**
 * Register @colyseus/social routes
 *
 * - uncomment if you want to use default authentication (https://docs.colyseus.io/server/authentication/)
 * - also uncomment the import statement
 */
// app.use("/", socialRoutes);

// register colyseus monitor AFTER registering your room handlers
app.use('/colyseus', monitor())

gameServer.listen(port)
console.log(`Listening on ws://localhost:${port}`)
