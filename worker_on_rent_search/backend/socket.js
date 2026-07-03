import User from "./models/user.model.js"
import WorkerProfile from "./models/workerProfile.model.js"

export const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(socket.id)
    socket.on('identity', async ({ userId }) => {
      try {
        await User.findByIdAndUpdate(userId, {
          socketId: socket.id, isOnline: true
        }, { new: true })
      } catch (error) {
        console.log(error)
      }
    })

    // Worker app calls this continuously while online/on a job so customers
    // can see live position, ETA, and route (Phase 3).
    socket.on('updateWorkerLocation', async ({ latitude, longitude, workerId }) => {
      try {
        await User.findByIdAndUpdate(workerId, {
          location: { type: 'Point', coordinates: [longitude, latitude] },
          isOnline: true,
          socketId: socket.id
        })

        const profile = await WorkerProfile.findOneAndUpdate(
          { user: workerId },
          {
            location: { type: 'Point', coordinates: [longitude, latitude] },
            isOnline: true
          },
          { new: true }
        )

        if (profile) {
          io.emit('workerLocationUpdate', {
            workerId,
            latitude,
            longitude
          })
        }
      } catch (error) {
        console.log('updateWorkerLocation error', error)
      }
    })

    socket.on('disconnect', async () => {
      try {
        await User.findOneAndUpdate({ socketId: socket.id }, {
          socketId: null,
          isOnline: false
        })
      } catch (error) {
        console.log(error)
      }
    })
  })
}
