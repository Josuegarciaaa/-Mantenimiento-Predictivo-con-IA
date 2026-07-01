import { createContext, useContext, useReducer } from 'react'

const AppContext = createContext(null)

const initialState = {
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
