import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { prependNotification } from '../redux/notificationSlice'

function useNotificationSocketEvents() {
    const dispatch = useDispatch()
    const { socket } = useSelector(state => state.user)

    useEffect(() => {
        if (!socket) return
        const onNotification = (notification) => dispatch(prependNotification(notification))
        socket.on('notification', onNotification)
        return () => socket.off('notification', onNotification)
    }, [socket])
}

export default useNotificationSocketEvents
