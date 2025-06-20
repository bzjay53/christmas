import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { message } from 'antd'
import { useAuth } from './AuthContext'

// 거래 관련 타입 정의
export interface TradingOrder {
  id: string
  stockCode: string
  stockName: string
  orderType: 'buy' | 'sell'
  quantity: number
  price: number
  orderMethod: 'limit' | 'market'
  status: 'pending' | 'submitted' | 'filled' | 'cancelled' | 'failed'
  aiDecision: boolean
  aiReason?: string
  aiConfidence?: number
  createdAt: string
  updatedAt: string
  totalAmount: number
}

export interface Portfolio {
  totalValue: number
  totalProfit: number
  totalProfitRate: number
  cashBalance: number
  positions: Position[]
  dailyOrders: TradingOrder[]
}

export interface Position {
  stockCode: string
  stockName: string
  quantity: number
  averagePrice: number
  currentPrice: number
  totalValue: number
  profitLoss: number
  profitRate: number
}

export interface MarketData {
  stockCode: string
  stockName: string
  currentPrice: number
  changeRate: number
  changeAmount: number
  volume: number
  lastUpdated: string
}

// 거래 상태
interface TradingState {
  orders: TradingOrder[]
  portfolio: Portfolio | null
  marketData: Record<string, MarketData>
  isTrading: boolean
  loading: boolean
  error: string | null
}

// 액션 타입
type TradingAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ORDERS'; payload: TradingOrder[] }
  | { type: 'ADD_ORDER'; payload: TradingOrder }
  | { type: 'UPDATE_ORDER'; payload: { id: string; updates: Partial<TradingOrder> } }
  | { type: 'SET_PORTFOLIO'; payload: Portfolio }
  | { type: 'SET_MARKET_DATA'; payload: Record<string, MarketData> }
  | { type: 'UPDATE_MARKET_DATA'; payload: MarketData }
  | { type: 'SET_TRADING_STATUS'; payload: boolean }

// 리듀서
const tradingReducer = (state: TradingState, action: TradingAction): TradingState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    
    case 'SET_ORDERS':
      return { ...state, orders: action.payload }
    
    case 'ADD_ORDER':
      return { ...state, orders: [action.payload, ...state.orders] }
    
    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === action.payload.id
            ? { ...order, ...action.payload.updates }
            : order
        )
      }
    
    case 'SET_PORTFOLIO':
      return { ...state, portfolio: action.payload }
    
    case 'SET_MARKET_DATA':
      return { ...state, marketData: action.payload }
    
    case 'UPDATE_MARKET_DATA':
      return {
        ...state,
        marketData: {
          ...state.marketData,
          [action.payload.stockCode]: action.payload
        }
      }
    
    case 'SET_TRADING_STATUS':
      return { ...state, isTrading: action.payload }
    
    default:
      return state
  }
}

// 초기 상태
const initialState: TradingState = {
  orders: [],
  portfolio: null,
  marketData: {},
  isTrading: false,
  loading: false,
  error: null
}

// 컨텍스트 타입
interface TradingContextType {
  state: TradingState
  actions: {
    fetchOrders: () => Promise<void>
    fetchPortfolio: () => Promise<void>
    fetchMarketData: (stockCode: string) => Promise<void>
    createOrder: (orderData: Omit<TradingOrder, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<void>
    cancelOrder: (orderId: string) => Promise<void>
    startTrading: () => Promise<void>
    stopTrading: () => Promise<void>
    clearError: () => void
  }
}

const TradingContext = createContext<TradingContextType | undefined>(undefined)

export const useTrading = () => {
  const context = useContext(TradingContext)
  if (context === undefined) {
    throw new Error('useTrading must be used within a TradingProvider')
  }
  return context
}

interface TradingProviderProps {
  children: React.ReactNode
}

export const TradingProvider: React.FC<TradingProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(tradingReducer, initialState)
  const { userProfile, isAuthenticated } = useAuth()

  // API 호출 함수들
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    
    const response = await fetch(`${baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // 주문 목록 조회
  const fetchOrders = async () => {
    if (!isAuthenticated || !userProfile) return

    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const orders = await apiCall(`/api/trading/orders/${userProfile.uid}`)
      dispatch({ type: 'SET_ORDERS', payload: orders })
      dispatch({ type: 'SET_ERROR', payload: null })
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      dispatch({ type: 'SET_ERROR', payload: '주문 목록을 불러오는데 실패했습니다.' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  // 포트폴리오 조회
  const fetchPortfolio = async () => {
    if (!isAuthenticated || !userProfile) return

    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const portfolio = await apiCall(`/api/trading/portfolio/${userProfile.uid}`)
      dispatch({ type: 'SET_PORTFOLIO', payload: portfolio })
      dispatch({ type: 'SET_ERROR', payload: null })
    } catch (error) {
      console.error('Failed to fetch portfolio:', error)
      dispatch({ type: 'SET_ERROR', payload: '포트폴리오를 불러오는데 실패했습니다.' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  // 시장 데이터 조회
  const fetchMarketData = async (stockCode: string) => {
    try {
      const marketData = await apiCall(`/api/market/stock/${stockCode}`)
      dispatch({ type: 'UPDATE_MARKET_DATA', payload: marketData })
    } catch (error) {
      console.error('Failed to fetch market data:', error)
    }
  }

  // 주문 생성
  const createOrder = async (orderData: Omit<TradingOrder, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    if (!isAuthenticated || !userProfile) {
      throw new Error('로그인이 필요합니다.')
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      const newOrder = await apiCall('/api/trading/orders', {
        method: 'POST',
        body: JSON.stringify({
          ...orderData,
          userId: userProfile.uid
        })
      })

      dispatch({ type: 'ADD_ORDER', payload: newOrder })
      message.success('주문이 생성되었습니다.')
      dispatch({ type: 'SET_ERROR', payload: null })
    } catch (error) {
      console.error('Failed to create order:', error)
      const errorMessage = error instanceof Error ? error.message : '주문 생성에 실패했습니다.'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      message.error(errorMessage)
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  // 주문 취소
  const cancelOrder = async (orderId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      await apiCall(`/api/trading/orders/${orderId}/cancel`, {
        method: 'POST'
      })

      dispatch({ 
        type: 'UPDATE_ORDER', 
        payload: { 
          id: orderId, 
          updates: { 
            status: 'cancelled',
            updatedAt: new Date().toISOString()
          } 
        } 
      })
      
      message.success('주문이 취소되었습니다.')
      dispatch({ type: 'SET_ERROR', payload: null })
    } catch (error) {
      console.error('Failed to cancel order:', error)
      const errorMessage = error instanceof Error ? error.message : '주문 취소에 실패했습니다.'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      message.error(errorMessage)
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  // 거래 시작
  const startTrading = async () => {
    try {
      await apiCall('/api/trading/start', { method: 'POST' })
      dispatch({ type: 'SET_TRADING_STATUS', payload: true })
      message.success('자동매매가 시작되었습니다.')
    } catch (error) {
      console.error('Failed to start trading:', error)
      message.error('자동매매 시작에 실패했습니다.')
      throw error
    }
  }

  // 거래 중지
  const stopTrading = async () => {
    try {
      await apiCall('/api/trading/stop', { method: 'POST' })
      dispatch({ type: 'SET_TRADING_STATUS', payload: false })
      message.success('자동매매가 중지되었습니다.')
    } catch (error) {
      console.error('Failed to stop trading:', error)
      message.error('자동매매 중지에 실패했습니다.')
      throw error
    }
  }

  // 에러 클리어
  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null })
  }

  // 초기 데이터 로드
  useEffect(() => {
    if (isAuthenticated && userProfile) {
      fetchOrders()
      fetchPortfolio()
    }
  }, [isAuthenticated, userProfile])

  const value: TradingContextType = {
    state,
    actions: {
      fetchOrders,
      fetchPortfolio,
      fetchMarketData,
      createOrder,
      cancelOrder,
      startTrading,
      stopTrading,
      clearError
    }
  }

  return (
    <TradingContext.Provider value={value}>
      {children}
    </TradingContext.Provider>
  )
}