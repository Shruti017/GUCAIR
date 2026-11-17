import { Schema, model, models } from 'mongoose';
const universitySchema = new Schema({
  name:{type:String,required:true,trim:true,index:true}, slug:{type:String,required:true,unique:true},
  country:{type:String,required:true,index:true}, city:{type:String,default:''}, website:{type:String,default:''},
  description:{type:String,default:''}, logoUrl:{type:String,default:''}, status:{type:String,enum:['pending','verified','rejected'],default:'pending',index:true},
  createdBy:{type:Schema.Types.ObjectId,ref:'User',default:null}, isDemo:{type:Boolean,default:false}
},{timestamps:true});
universitySchema.index({name:'text',country:'text',city:'text'});
export default models.University || model('University',universitySchema);
