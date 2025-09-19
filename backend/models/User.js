import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(__dirname, '../data/users.json');

// Asegurarse de que el directorio data existe
const DATA_DIR = path.join(__dirname, '../data');

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function readUsers() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Si el archivo no existe, retornar array vacío
    return [];
  }
}

async function writeUsers(users) {
  await ensureDataDir();
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

export const User = {
  // Crear nuevo usuario
  async create(userData) {
    const users = await readUsers();
    
    // Verificar si el email ya existe
    const existingUser = users.find(u => u.email === userData.email);
    if (existingUser) {
      throw new Error('El email ya está registrado');
    }
    
    // Verificar si el teléfono ya existe
    if (userData.phone) {
      const existingPhone = users.find(u => u.phone === userData.phone);
      if (existingPhone) {
        throw new Error('El teléfono ya está registrado');
      }
    }
    
    // Hash de la contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
    
    // Crear nuevo usuario
    const newUser = {
      id: Date.now().toString(), // ID simple para la demo
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };
    
    users.push(newUser);
    await writeUsers(users);
    
    // Retornar usuario sin la contraseña
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  },

  // Encontrar usuario por email
  async findByEmail(email) {
    const users = await readUsers();
    return users.find(u => u.email === email && u.isActive);
  },

  // Encontrar usuario por ID
  async findById(id) {
    const users = await readUsers();
    const user = users.find(u => u.id === id && u.isActive);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  },

  // Validar contraseña
  async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },

  // Actualizar usuario
  async update(id, updateData) {
    const users = await readUsers();
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      throw new Error('Usuario no encontrado');
    }
    
    // Si se actualiza la contraseña, hashearla
    if (updateData.password) {
      const saltRounds = 12;
      updateData.password = await bcrypt.hash(updateData.password, saltRounds);
    }
    
    users[userIndex] = {
      ...users[userIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    await writeUsers(users);
    
    const { password, ...userWithoutPassword } = users[userIndex];
    return userWithoutPassword;
  },

  // Listar todos los usuarios (solo para admin)
  async findAll() {
    const users = await readUsers();
    return users
      .filter(u => u.isActive)
      .map(({ password, ...userWithoutPassword }) => userWithoutPassword);
  },

  // Desactivar usuario (soft delete)
  async deactivate(id) {
    const users = await readUsers();
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      throw new Error('Usuario no encontrado');
    }
    
    users[userIndex].isActive = false;
    users[userIndex].updatedAt = new Date().toISOString();
    
    await writeUsers(users);
    return true;
  }
};