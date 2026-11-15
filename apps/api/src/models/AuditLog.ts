import {Schema,model} from 'mongoose';
const schema=new Schema({actor:{type:Schema.Types.ObjectId,ref:'User',default:null},action:{type:String,required:true},entity:{type:String,required:true},entityId:{type:String,default:''},details:{type:Schema.Types.Mixed,default:{}},ip:{type:String,default:''}},{timestamps:true});
schema.index({createdAt:-1});export default model('AuditLog',schema);
