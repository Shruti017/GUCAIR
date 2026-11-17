import { createHash } from 'node:crypto';
import mongoose from 'mongoose';
import type { Options, Store } from 'express-rate-limit';

type Counter = { totalHits: number; expiresAt: Date };

export class MongoRateLimitStore implements Store {
  readonly localKeys = false;
  readonly prefix: string;
  private windowMs = 15 * 60 * 1000;
  private indexPromise: Promise<unknown> | null = null;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  private collection() {
    return mongoose.connection.collection<Counter & { _id: string }>('rate_limit_counters');
  }

  private ensureExpiryIndex(): Promise<unknown> {
    if (!this.indexPromise) {
      this.indexPromise = this.collection()
        .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
        .catch((error) => {
          this.indexPromise = null;
          throw error;
        });
    }
    return this.indexPromise;
  }

  private idFor(key: string): string {
    const digest = createHash('sha256').update(key).digest('hex');
    return `${this.prefix}:${digest}`;
  }

  async increment(key: string) {
    await this.ensureExpiryIndex();
    const now = new Date();
    const nextExpiry = new Date(now.getTime() + this.windowMs);
    const result = await this.collection().findOneAndUpdate(
      { _id: this.idFor(key) },
      [{
        $set: {
          totalHits: {
            $cond: [
              { $gt: ['$expiresAt', now] },
              { $add: [{ $ifNull: ['$totalHits', 0] }, 1] },
              1,
            ],
          },
          expiresAt: {
            $cond: [{ $gt: ['$expiresAt', now] }, '$expiresAt', nextExpiry],
          },
        },
      }],
      { upsert: true, returnDocument: 'after' },
    ) as unknown as Counter | { value: Counter | null } | null;

    const counter = result && 'value' in result ? result.value : result;
    if (!counter) throw new Error('Rate limit counter could not be updated');
    return { totalHits: counter.totalHits, resetTime: new Date(counter.expiresAt) };
  }

  async get(key: string) {
    const counter = await this.collection().findOne({ _id: this.idFor(key) }) as Counter | null;
    if (!counter || counter.expiresAt <= new Date()) return undefined;
    return { totalHits: counter.totalHits, resetTime: new Date(counter.expiresAt) };
  }

  async decrement(key: string): Promise<void> {
    await this.collection().updateOne(
      { _id: this.idFor(key), totalHits: { $gt: 0 } },
      { $inc: { totalHits: -1 } },
    );
  }

  async resetKey(key: string): Promise<void> {
    await this.collection().deleteOne({ _id: this.idFor(key) });
  }

  async resetAll(): Promise<void> {
    await this.collection().deleteMany({ _id: { $regex: `^${this.prefix}:` } });
  }
}
