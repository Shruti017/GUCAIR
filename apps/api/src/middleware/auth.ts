import {Request,Response,NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import type {Role} from '../models/User';
export interface AuthRequest extends Request { user?:{id:string;role:Role;university:string|null} }
export function authenticate(req:AuthRequest,res:Response,next:NextFunction){
 const header=req.headers.authorization; if(!header?.startsWith('Bearer ')) return res.status(401).json({message:'Authentication required'});
 try {const p=jwt.verify(header.slice(7),process.env.JWT_ACCESS_SECRET||'development-only-change-me') as jwt.JwtPayload; req.user={id:String(p.sub),role:p.role as Role,university:p.university?String(p.university):null}; next();} catch{return res.status(401).json({message:'Invalid or expired access token'});}
}
export function allowRoles(...roles:Role[]){return (req:AuthRequest,res:Response,next:NextFunction)=>{if(!req.user||!roles.includes(req.user.role))return res.status(403).json({message:'You do not have permission to perform this action'});next();};}
