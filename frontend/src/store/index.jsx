import { createContext, useContext, useReducer } from 'react'

const AppContext = createContext(null)

const initialState = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    engines: [],
    predictions: [],
    alerts: [],
    dashboard: null,
    selectedEngine: null,
    isLoading: false,
    error: null
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
                selectedEngine: null
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
        case 'UPDATE_ALERT':
            return {
                ...state,
                alerts: state.alerts.map(a => a.id === action.payload.id ? action.payload : a)
            }
        case 'CLEAR_ERROR':
            return { ...state, error: null }
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
