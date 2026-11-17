import {Request,Response,NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import type {Role} from '../models/User';
export interface AuthRequest extends Request { user?:{id:string;role:Role;university:string|null} }
export function authenticate(req:AuthRequest,res:Response,next:NextFunction){
 const header=req.headers.authorization;
 const token=header?.startsWith('Bearer ')?header.slice(7):req.cookies?.gucair_access;
 if(!token) return res.status(401).json({message:'Authentication required'});
 try {
  const secret=process.env.JWT_ACCESS_SECRET;
  if(!secret) throw new Error('JWT_ACCESS_SECRET is not configured');
  const p=jwt.verify(token,secret) as jwt.JwtPayload;
  if(typeof p.sub!=='string'||!['super_admin','university_admin','faculty','student'].includes(p.role)) throw new Error('Invalid access token claims');
  req.user={id:p.sub,role:p.role as Role,university:p.university?String(p.university):null};
  next();
 } catch{return res.status(401).json({message:'Invalid or expired access token'});}
}
export function allowRoles(...roles:Role[]){return (req:AuthRequest,res:Response,next:NextFunction)=>{if(!req.user||!roles.includes(req.user.role))return res.status(403).json({message:'You do not have permission to perform this action'});next();};}
