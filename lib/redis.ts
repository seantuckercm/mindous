import Redis from 'ioredis';

// Singleton pattern for Redis client
let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is not set');
    }

    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      enableOfflineQueue: true,
      connectTimeout: 10000,
      lazyConnect: false,
    });

    // Handle connection events
    redis.on('connect', () => {
      console.log('✅ Redis client connected');
    });

    redis.on('ready', () => {
      console.log('✅ Redis client ready');
    });

    redis.on('error', (err) => {
      console.error('❌ Redis client error:', err);
    });

    redis.on('close', () => {
      console.log('⚠️ Redis client connection closed');
    });

    redis.on('reconnecting', () => {
      console.log('🔄 Redis client reconnecting...');
    });
  }

  return redis;
}

// Helper function to publish events to a channel
export async function publishEvent(channel: string, data: any): Promise<number> {
  const client = getRedisClient();
  const message = JSON.stringify({
    ...data,
    timestamp: new Date().toISOString(),
  });
  return client.publish(channel, message);
}

// Helper function to subscribe to a channel
export async function subscribeToChannel(
  channel: string,
  callback: (message: any) => void
): Promise<Redis> {
  // Create a new Redis instance for subscription (pub/sub requires separate connection)
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is not set');
  }

  const subscriber = new Redis(redisUrl);

  subscriber.on('message', (ch, message) => {
    if (ch === channel) {
      try {
        const parsedMessage = JSON.parse(message);
        callback(parsedMessage);
      } catch (err) {
        console.error('Error parsing Redis message:', err);
      }
    }
  });

  await subscriber.subscribe(channel);
  console.log(`✅ Subscribed to Redis channel: ${channel}`);

  return subscriber;
}

// Helper function to unsubscribe and disconnect
export async function unsubscribeAndDisconnect(subscriber: Redis, channel: string): Promise<void> {
  await subscriber.unsubscribe(channel);
  await subscriber.quit();
  console.log(`✅ Unsubscribed from Redis channel: ${channel}`);
}

// Get channel name for a run
export function getRunChannel(runId: string): string {
  return `run:${runId}`;
}

// Cleanup function
export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    console.log('✅ Redis client disconnected');
  }
}
