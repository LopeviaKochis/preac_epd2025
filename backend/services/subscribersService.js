import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = join(__dirname, '..', 'data');
const dataFile = join(dataDir, 'subscribers.json');

async function ensureFile() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.access(dataFile).catch(async () => {
      await fs.writeFile(dataFile, JSON.stringify({ subscribers: [] }, null, 2), 'utf-8');
    });
  } catch (e) {
    // no-op
  }
}

async function readAll() {
  await ensureFile();
  const raw = await fs.readFile(dataFile, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch {
    return { subscribers: [] };
  }
}

async function writeAll(data) {
  await ensureFile();
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2), 'utf-8');
}

export const subscribersService = {
  async getAll() {
    const data = await readAll();
    return data.subscribers || [];
  },

  async isSubscribed(phone) {
    const subs = await this.getAll();
    return subs.some((s) => s.phone === phone);
  },

  async subscribe(phone, name = 'Invitado') {
    const subs = await this.getAll();
    if (subs.find((s) => s.phone === phone)) {
      return { already: true, phone };
    }
    const now = new Date().toISOString();
    subs.push({ phone, name, subscribedAt: now });
    await writeAll({ subscribers: subs });
    return { phone, name, subscribedAt: now };
  },

  async unsubscribe(phone) {
    const subs = await this.getAll();
    const filtered = subs.filter((s) => s.phone !== phone);
    const changed = filtered.length !== subs.length;
    if (changed) {
      await writeAll({ subscribers: filtered });
    }
    return { phone, removed: changed };
  },

  async getStatus(phone) {
    const subs = await this.getAll();
    const found = subs.find((s) => s.phone === phone);
    return found ? { subscribed: true, ...found } : { subscribed: false, phone };
  }
};
