import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { Role } from '../models/User';
const accessSecret=()=>{const value=process.env.JWT_ACCESS_SECRET;if(!value)throw new Error('JWT_ACCESS_SECRET is required');return value;};
const refreshSecret=()=>{const value=process.env.JWT_REFRESH_SECRET;if(!value)throw new Error('JWT_REFRESH_SECRET is required');return value;};
export function signAccess(user:{_id:unknown;role:Role;university?:unknown}) { return jwt.sign({sub:String(user._id),role:user.role,university:user.university?String(user.university):null},accessSecret(),{expiresIn:(process.env.ACCESS_TOKEN_TTL||'15m') as jwt.SignOptions['expiresIn']}); }
export function signRefresh(userId:string) { return jwt.sign({sub:userId,jti:crypto.randomUUID()},refreshSecret(),{expiresIn:`${Number(process.env.REFRESH_TOKEN_DAYS||7)}d`}); }
export function verifyRefresh(token:string) { return jwt.verify(token,refreshSecret()) as jwt.JwtPayload; }
export function hashToken(token:string) { return crypto.createHash('sha256').update(token).digest('hex'); }
