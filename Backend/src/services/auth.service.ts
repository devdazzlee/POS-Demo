import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma/client';
import { config } from '../config/app';
import { AppError } from '../utils/apiError';
import { Role, Branch } from '@prisma/client';

class AuthService {
  async register(data: { email: string; password: string; role?: Role }) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError(400, 'Email already in use');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: data.role || Role.ADMIN, // Use Role.USER instead of string
      },
      select: {
        id: true,
        email: true,
        role: true,
        created_at: true,
      },
    });

    return user;
  }

  async registerAdmin(data: { email: string; password: string; branch_id: Branch['id'], role: Role }) {
    if (data.role === Role.SUPER_ADMIN) {
      throw new AppError(400, 'Cannot assign SUPER_ADMIN role');
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError(400, 'Email already in use');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        branch_id: data.branch_id,
        role: data.role || Role.ADMIN,
      },
      select: {
        id: true,
        email: true,
        role: true,
        branch_id: true,
        created_at: true,
      },
    });

    return user;
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        branch_id: true,
        password: true,
        role: true,
      },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError(400, 'Invalid username or password');
    }

    // Pure-JWT auth: the signed token (no expiry) IS the session. No Redis,
    // no server-side store. Logout becomes a client-side localStorage wipe.
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        branch_id: user.branch_id,
      },
      config.jwtSecret,
    );

    // Omit password from returned user object
    const { id, password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  // Logout is intentionally a no-op on the server: there is no session to
  // invalidate. The frontend clears its localStorage token; that's it. We
  // keep the method so the existing /auth/logout route stays valid.
  async logout(_userId: string) {
    return;
  }
}

export { AuthService };
