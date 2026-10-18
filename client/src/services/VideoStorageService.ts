// IndexedDB Service para armazenamento persistente de vídeos de reuniões (Blob)
const DB_NAME = 'skyoffice_media_db'
const DB_VERSION = 1
const STORE_NAME = 'meeting_videos'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export class VideoStorageService {
  /**
   * Salva o Blob do vídeo no IndexedDB associado ao ID da reunião
   */
  static async saveVideo(meetingId: string, videoBlob: Blob): Promise<void> {
    try {
      const db = await openDB()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const record = {
          id: meetingId,
          blob: videoBlob,
          savedAt: new Date().toISOString(),
        }
        const request = store.put(record)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (e) {
      console.warn('Falha ao salvar vídeo no IndexedDB:', e)
    }
  }

  /**
   * Recupera o Blob do vídeo e gera uma URL segura
   */
  static async getVideoUrl(meetingId: string): Promise<string | null> {
    try {
      const db = await openDB()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const request = store.get(meetingId)

        request.onsuccess = () => {
          const result = request.result
          if (result && result.blob) {
            const url = URL.createObjectURL(result.blob)
            resolve(url)
          } else {
            resolve(null)
          }
        }
        request.onerror = () => reject(request.error)
      })
    } catch (e) {
      console.warn('Falha ao recuperar vídeo do IndexedDB:', e)
      return null
    }
  }

  /**
   * Remove o vídeo do IndexedDB
   */
  static async deleteVideo(meetingId: string): Promise<void> {
    try {
      const db = await openDB()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const request = store.delete(meetingId)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (e) {
      console.warn('Falha ao remover vídeo do IndexedDB:', e)
    }
  }
}
