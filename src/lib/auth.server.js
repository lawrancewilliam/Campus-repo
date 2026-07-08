import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';

const JWT_SECRET = env.JWT_SECRET || 'fallback-super-secret-key-for-local-dev';
const SALT_ROUNDS = 10;

/**
 * Hash a password using bcryptjs.
 * @param {string} password 
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare plain password against bcrypt hash.
 * @param {string} password 
 * @param {string} hashedPassword 
 * @returns {Promise<boolean>}
 */
export async function comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
}

/**
 * Generate a JWT token containing user details.
 * @param {object} payload 
 * @returns {string}
 */
export function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verify JWT token.
 * @param {string} token 
 * @returns {object}
 */
export function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}
