const Redis = require('ioredis');
const Job = require('../models/Job'); // Loads your existing Mongoose Job schema file

const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
const SPATIAL_MAP_KEY = 'worker:locations:spatial_index';

class GeoMatchEngine {
  /**
   * Sync active worker coordinate parameters directly to in-memory spatial indexes
   */
  static async updateWorkerCoordinates(workerId, lat, lng) {
    // Inject coordinates directly into the tracking grid index
    await redis.geoadd(SPATIAL_MAP_KEY, lng, lat, workerId);
    // Set a sliding heartbeat key to drop disconnected devices automatically after 5 minutes
    await redis.set(`worker:heartbeat:${workerId}`, 'ALIVE', 'EX', 300);
  }

  /**
   * Broadcast an available job to all active workers within a 5.0 KM operating boundary radius
   */
  static async broadcastToNearbyPool(jobId, io) {
    const job = await Job.findById(jobId);
    if (!job) return { broadcastedCount: 0 };

    const matchingRadiusKM = 5.0;

    // Direct, ultra-fast geographic boundary lookup over memory indices
    const nearbyWorkerIds = await redis.georadius(
      SPATIAL_MAP_KEY,
      job.location.coordinates[0], // longitude
      job.location.coordinates[1], // latitude
      matchingRadiusKM,
      'km'
    );

    if (!nearbyWorkerIds || nearbyWorkerIds.length === 0) return { broadcastedCount: 0 };

    let successCount = 0;
    for (const workerId of nearbyWorkerIds) {
      const isOnline = await redis.get(`worker:heartbeat:${workerId}`);
      if (!isOnline) {
        // Prune the index if a worker dropped offline without gracefully disconnecting
        await redis.zrem(SPATIAL_MAP_KEY, workerId);
        continue;
      }

      // Fire a direct event payload through the socket channel instance
      io.to(`user:${workerId}`).emit('job:new_broadcast', {
        id: job._id,
        title: job.title,
        budget: job.budget,
        address: job.address
      });
      successCount++;
    }

    return { broadcastedCount: successCount };
  }
}

module.exports = GeoMatchEngine;