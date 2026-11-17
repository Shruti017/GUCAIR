import {Schema,model,models} from 'mongoose';
const schema=new Schema({user:{type:Schema.Types.ObjectId,ref:'User',required:true,index:true},title:{type:String,required:true,maxlength:160},message:{type:String,required:true,maxlength:1200},kind:{type:String,enum:['system','assessment','ranking','content'],default:'system'},readAt:{type:Date,default:null},link:{type:String,default:''}},{timestamps:true});
schema.index({user:1,createdAt:-1});export default models.Notification || model('Notification',schema);
