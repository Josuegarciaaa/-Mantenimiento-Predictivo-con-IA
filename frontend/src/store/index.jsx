import { createContext, useContext, useReducer } from 'react'

const AppContext = createContext(null)

let _toastId = 0

const initialState = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    engines: [],
    predictions: [],
    alerts: [],
    dashboard: null,
    selectedEngine: null,
    activeModelType: 'auto',
    isLoading: false,
    error: null,
    toasts: [],
    sidebarOpen: false
}

function appReducer(state, action) {
    switch (action.type) {
        case 'LOGIN_SUCCESS':
            localStorage.setItem('token', action.payload.token)
            localStorage.setItem('user', JSON.stringify(action.payload.user))
            return {
                ...state,
                token: action.payload.token,
                user: action.payload.user,
                isAuthenticated: true,
                error: null
            }
        case 'LOGOUT':
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            return {
                ...state,
                token: null,
                user: null,
                isAuthenticated: false,
                engines: [],
                predictions: [],
                alerts: [],
                dashboard: null,
                selectedEngine: null,
                activeModelType: 'auto'
            }
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload }
        case 'SET_ERROR':
            return { ...state, error: action.payload, isLoading: false }
        case 'SET_DASHBOARD':
            return { ...state, dashboard: action.payload, isLoading: false }
        case 'SET_ENGINES':
            return { ...state, engines: action.payload, isLoading: false }
        case 'SET_PREDICTIONS':
            return { ...state, predictions: action.payload, isLoading: false }
        case 'SET_ALERTS':
            return { ...state, alerts: action.payload, isLoading: false }
        case 'SET_SELECTED_ENGINE':
            return { ...state, selectedEngine: action.payload, isLoading: false }
        case 'SET_MODEL_TYPE':
            return { ...state, activeModelType: action.payload }
        case 'UPDATE_ALERT':
            return {
                ...state,
                alerts: state.alerts.map(a => a.id === action.payload.id ? action.payload : a)
            }
        case 'CLEAR_ERROR':
            return { ...state, error: null }
        case 'ADD_TOAST': {
            const toast = { ...action.payload, id: ++_toastId }
            // Keep max 5 toasts
            const toasts = [toast, ...state.toasts].slice(0, 5)
            return { ...state, toasts }
        }
        case 'REMOVE_TOAST':
            return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) }
        case 'TOGGLE_SIDEBAR':
            return { ...state, sidebarOpen: !state.sidebarOpen }
        case 'CLOSE_SIDEBAR':
            return { ...state, sidebarOpen: false }
        default:
            return state
    }
}

export function AppProvider({ children }) {
    const [state, dispatch] = useReducer(appReducer, initialState)
    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    )
}

export function useAppState() {
    const context = useContext(AppContext)
    if (!context) throw new Error('useAppState debe usarse dentro de AppProvider')
    return context
}

export default AppContext
