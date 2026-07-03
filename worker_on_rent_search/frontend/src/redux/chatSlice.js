import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
    name: "chat",
    initialState: {
        chats: [],
        activeChat: null,
        messages: []
    },
    reducers: {
        setChats: (state, action) => {
            state.chats = action.payload
        },
        setActiveChat: (state, action) => {
            state.activeChat = action.payload
        },
        setMessages: (state, action) => {
            state.messages = action.payload
        },
        addMessage: (state, action) => {
            state.messages.push(action.payload)
        }
    }
})

export const { setChats, setActiveChat, setMessages, addMessage } = chatSlice.actions
export default chatSlice.reducer
