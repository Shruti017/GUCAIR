import { Schema, model, Types } from 'mongoose';
export type Role = 'super_admin'|'university_admin'|'faculty'|'student';
const userSchema = new Schema({
  name:{type:String,required:true,trim:true,maxlength:100}, email:{type:String,required:true,unique:true,lowercase:true,trim:true},
  passwordHash:{type:String,required:true,select:false}, role:{type:String,enum:['super_admin','university_admin','faculty','student'],default:'student'},
  university:{type:Types.ObjectId,ref:'University',default:null}, isActive:{type:Boolean,default:true},
  refreshTokenHash:{type:String,select:false,default:null}
},{timestamps:true});
export default model('User',userSchema);
