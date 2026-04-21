import bcrypt from 'bcrypt';
import { prisma } from '../prisma/prisma.js';
import { generateToken } from '../utils/jwt.js';

export const signup = async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Missing fields' });

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword }
    });

    const token = generateToken(user.id);
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email }});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user.id);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email }});
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};
