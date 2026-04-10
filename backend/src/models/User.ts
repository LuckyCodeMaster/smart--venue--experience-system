import db from '../config/database';
import { User, UserPublic } from '../types';
import { v4 as uuidv4 } from 'uuid';

const TABLE = 'users';

const toPublic = (user: User): UserPublic => {
  const { password_hash: _password_hash, ...pub } = user;
  return pub;
};

export const UserModel = {
  async find(filters: Partial<User> = {}): Promise<UserPublic[]> {
    const users = await db<User>(TABLE).where(filters).select('*');
    return users.map(toPublic);
  },

  async findById(id: string): Promise<UserPublic | null> {
    const user = await db<User>(TABLE).where({ id }).first();
    return user ? toPublic(user) : null;
  },

  async findByEmail(email: string): Promise<User | null> {
    const user = await db<User>(TABLE).where({ email: email.toLowerCase() }).first();
    return user ?? null;
  },

  async create(data: {
    email: string;
    password_hash: string;
    first_name: string;
    last_name: string;
    role?: string;
  }): Promise<UserPublic> {
    const id = uuidv4();
    const now = new Date();
    const [user] = await db<User>(TABLE)
      .insert({
        id,
        email: data.email.toLowerCase(),
        password_hash: data.password_hash,
        first_name: data.first_name,
        last_name: data.last_name,
        role: (data.role ?? 'attendee') as 'admin' | 'staff' | 'attendee',
        is_active: true,
        created_at: now,
        updated_at: now,
      })
      .returning('*');
    return toPublic(user);
  },

  async update(id: string, data: Partial<Omit<User, 'id' | 'created_at'>>): Promise<UserPublic | null> {
    const [user] = await db<User>(TABLE)
      .where({ id })
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    return user ? toPublic(user) : null;
  },

  async delete(id: string): Promise<boolean> {
    const count = await db<User>(TABLE).where({ id }).delete();
    return count > 0;
  },

  async updatePassword(id: string, password_hash: string): Promise<boolean> {
    const count = await db<User>(TABLE)
      .where({ id })
      .update({ password_hash, updated_at: new Date() });
    return count > 0;
  },

  async existsByEmail(email: string): Promise<boolean> {
    const result = await db<User>(TABLE)
      .where({ email: email.toLowerCase() })
      .count<{ count: string }>('id as count')
      .first();
    return parseInt(result?.count ?? '0', 10) > 0;
  },
};

export default UserModel;
