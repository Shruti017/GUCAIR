import {Router} from 'express';import Notification from '../models/Notification';import {authenticate,AuthRequest} from '../middleware/auth';
const router=Router();router.use(authenticate);
router.get('/',async(req:AuthRequest,res,next)=>{try{const items=await Notification.find({user:req.user!.id}).sort({createdAt:-1}).limit(100).lean();const unread=await Notification.countDocuments({user:req.user!.id,readAt:null});res.json({items,unread});}catch(e){next(e);}});
router.patch('/:id/read',async(req:AuthRequest,res,next)=>{try{const item=await Notification.findOneAndUpdate({_id:req.params.id,user:req.user!.id},{readAt:new Date()},{new:true});if(!item)return res.status(404).json({message:'Notification not found'});res.json({item});}catch(e){next(e);}});
router.post('/read-all',async(req:AuthRequest,res,next)=>{try{await Notification.updateMany({user:req.user!.id,readAt:null},{readAt:new Date()});res.json({message:'All notifications marked as read'});}catch(e){next(e);}});
export default router;
