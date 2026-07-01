import { io } from 'socket.io-client'

let socket = null

export const initSocket = () => {
    if (socket) return socket

    // En desarrollo local Vite usa un proxy (/api), por lo que conectamos a la misma URL origen
    // En produccion se conectara a la URL del backend
    socket = io('/', {
        autoConnect: false,
        path: '/socket.io'
    })

    return socket
}

export const getSocket = () => {
    if (!socket) {
        return initSocket()
    }
    return socket
}

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect()
        socket = null
    }
}
