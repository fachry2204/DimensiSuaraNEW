
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const user = { id: 1, username: 'admin', role: 'Admin' };
const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
console.log(token);
