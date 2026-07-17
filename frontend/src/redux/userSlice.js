import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    userData: null,
    currentCity: null,
    currentState: null,
    currentAddress: null,
    socket: null,
    myOrders: []
  },
  reducers: {
    setUserData: (state, action) => {
      state.userData = action.payload
    },
    setCurrentCity: (state, action) => {
      state.currentCity = action.payload
    },
    setCurrentState: (state, action) => {
      state.currentState = action.payload
    },
    setCurrentAddress: (state, action) => {
      state.currentAddress = action.payload
    },
    setSocket: (state, action) => {
      state.socket = action.payload
    },
    setMyOrders: (state, action) => {
      state.myOrders = action.payload
    },
    addMyOrder: (state, action) => {
      state.myOrders = [action.payload, ...(state.myOrders || [])]
    },
    updateOrderStatus: (state, action) => {
      const { orderId, shopId, status } = action.payload || {}
      state.myOrders = (state.myOrders || []).map(order => {
        if (String(order._id) !== String(orderId)) return order
        return {
          ...order,
          shopOrders: (order.shopOrders || []).map(shopOrder => (
            String(shopOrder.shop?._id || shopOrder.shop) === String(shopId)
              ? { ...shopOrder, status }
              : shopOrder
          ))
        }
      })
    },
    updateRealtimeOrderStatus: (state, action) => {
      const { orderId, shopId, status } = action.payload || {}
      state.myOrders = (state.myOrders || []).map(order => {
        if (String(order._id) !== String(orderId)) return order
        return {
          ...order,
          shopOrders: (order.shopOrders || []).map(shopOrder => (
            String(shopOrder.shop?._id || shopOrder.shop) === String(shopId)
              ? { ...shopOrder, status }
              : shopOrder
          ))
        }
      })
    }
  }
})

export const {
  setUserData,
  setCurrentAddress,
  setCurrentCity,
  setCurrentState,
  setSocket,
  setMyOrders,
  addMyOrder,
  updateOrderStatus,
  updateRealtimeOrderStatus
} = userSlice.actions
export default userSlice.reducer
