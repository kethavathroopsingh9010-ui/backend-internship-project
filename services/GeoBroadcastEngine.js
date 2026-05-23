const Redis = require('ioredis');
const { PrismaClient } = require('@prisma/client');

const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
const prisma = new PrismaClient();
const REDIS_GEO_INDEX_KEY = 'worker:locations:spatial_map';

class GeoBroadcastEngine {
  static async refreshWorkerPositionLocation(workerId, lat, lng) {
    await redis.geoadd(REDIS_GEO_INDEX_KEY, lng, lat, workerId);
    await redis.set(`worker:active_pulse:${workerId}`, 'ALIVE', 'EX', 300);

    await prisma.workerProfile.update({
      where: { userId: workerId },
      data: { lastLatitude: lat, lastLongitude: lng, lastLocationSync: new Date() }
    });
  }

  static async dispatchNearbyJobBroadcast(jobId, io) {
    const job = await prisma.job.findUniqueOrThrow({ where: { id: jobId } });
    const allocationRadiusKM = 5.0; 

    const matchedWorkerIds = await redis.georadius(
      REDIS_GEO_INDEX_KEY,
      job.longitude,
      job.latitude,
      allocationRadiusKM,
      'km'
    );

    if (!matchedWorkerIds || matchedWorkerIds.length === 0) return { targetedDispatches: 0 };

    let dispatchedEventsCount = 0;
    for (const workerId of matchedWorkerIds) {
      const activePulseCheck = await redis.get(`worker:active_pulse:${workerId}`);
      if (!activePulseCheck) {
        await redis.zrem(REDIS_GEO_INDEX_KEY, workerId);
        continue;
      }

      io.to(`user:${workerId}`).emit('job:broadcast_alert', {
        jobId: job.id,
        title: job.title,
        budget: job.budget,
        address: job.address
      });
      dispatchedEventsCount++;
    }

    return { targetedDispatches: dispatchedEventsCount };
  }
}

module.exports = GeoBroadcastEngine;