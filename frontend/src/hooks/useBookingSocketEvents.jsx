import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { applyBookingUpdate, setLiveWorkerLocation } from '../redux/bookingSlice'

function useBookingSocketEvents() {
    const dispatch = useDispatch()
    const { socket } = useSelector(state => state.user)
    const { activeBooking } = useSelector(state => state.booking)
    const activeWorkerId = activeBooking?.worker?._id

    useEffect(() => {
        if (!socket) return

        const onBookingUpdate = (booking) => dispatch(applyBookingUpdate(booking))
        const onWorkerLocation = ({ workerId, latitude, longitude }) => {
            if (workerId === activeWorkerId) {
                dispatch(setLiveWorkerLocation({ latitude, longitude }))
            }
        }

        socket.on('bookingStatusUpdate', onBookingUpdate)
        socket.on('workerLocationUpdate', onWorkerLocation)

        return () => {
            socket.off('bookingStatusUpdate', onBookingUpdate)
            socket.off('workerLocationUpdate', onWorkerLocation)
        }
    }, [socket, activeWorkerId])
}

export default useBookingSocketEvents
