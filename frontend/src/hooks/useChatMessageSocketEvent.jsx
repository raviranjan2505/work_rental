import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addMessage } from '../redux/chatSlice'

function useChatMessageSocketEvent() {
    const dispatch = useDispatch()
    const { socket } = useSelector(state => state.user)
    const { activeChat } = useSelector(state => state.chat)
    const activeChatId = activeChat?._id

    useEffect(() => {
        if (!socket) return
        const onChatMessage = ({ chatId, message }) => {
            if (chatId === activeChatId) {
                dispatch(addMessage(message))
            }
        }
        socket.on('chatMessage', onChatMessage)
        return () => socket.off('chatMessage', onChatMessage)
    }, [socket, activeChatId])
}

export default useChatMessageSocketEvent
