import {Schema,model} from 'mongoose';
const schema=new Schema({user:{type:Schema.Types.ObjectId,ref:'User',required:true,index:true},tokenHash:{type:String,required:true},expiresAt:{type:Date,required:true, expires:0}},{timestamps:true});
export default model('RefreshSession',schema);
