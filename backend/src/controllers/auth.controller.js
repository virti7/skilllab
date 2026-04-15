import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      instituteId: user.instituteId,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function register(req, res) {
  try {
    console.log("REQ BODY:", req.body);

    const { name, email, password, role, instituteName } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const uppercaseRole = role.toUpperCase();

    const allowedRoles = ['ADMIN', 'STUDENT', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(uppercaseRole)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let instituteId = null;

    if (uppercaseRole === 'ADMIN') {
      if (!instituteName) {
        return res.status(400).json({ success: false, message: 'Institute name required for admin' });
      }

      const newInstitute = await prisma.institute.create({
        data: { name: instituteName },
      });

      instituteId = newInstitute.id;
    } else {
      const institute = await prisma.institute.findFirst();
      instituteId = institute?.id || null;
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: uppercaseRole,
        instituteId,
      },
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.toLowerCase(),
        instituteId: user.instituteId,
      },
    });

  } catch (error) {
    console.error('REGISTER ERROR:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Database error',
    });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    console.log("LOGIN REQUEST:", email);

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    console.log("USER FOUND:", user);

    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);

    console.log("PASSWORD MATCH:", match);

    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'User logged in successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.toLowerCase(),
        instituteId: user.instituteId,
      },
    });

  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
}

export async function me(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { institute: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.toLowerCase(),
      instituteId: user.instituteId,
      instituteName: user.institute?.name,
    });

  } catch (err) {
    console.error('ME ERROR:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
