import { useEffect } from 'react'
import { useSelector } from 'react-redux'

function useUpdateWorkerLocation() {
    const { userData, socket } = useSelector(state => state.user)

    useEffect(() => {
        if (!socket || !userData || userData.role !== "worker") return
        if (!navigator.geolocation) return

        const watchId = navigator.geolocation.watchPosition((pos) => {
            socket.emit('updateWorkerLocation', {
                workerId: userData._id,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
            })
        })

        return () => navigator.geolocation.clearWatch(watchId)
    }, [socket, userData?._id])
}

export default useUpdateWorkerLocation
