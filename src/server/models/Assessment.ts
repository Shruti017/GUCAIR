import { Schema, model, models } from 'mongoose';
const questionSchema = new Schema({text:{type:String,required:true},helpText:{type:String,default:''},type:{type:String,enum:['scale','yes_no','number','text'],default:'scale'},required:{type:Boolean,default:true},options:[{label:String,score:Number}],order:{type:Number,default:0}},{_id:true});
const dimensionSchema = new Schema({key:{type:String,required:true},name:{type:String,required:true},description:{type:String,default:''},weight:{type:Number,required:true,min:0,max:100},order:{type:Number,default:0},questions:[questionSchema]},{_id:true});
const assessmentSchema = new Schema({title:{type:String,required:true},version:{type:Number,default:1},description:{type:String,default:''},status:{type:String,enum:['draft','active','archived'],default:'draft'},dimensions:[dimensionSchema],createdBy:{type:Schema.Types.ObjectId,ref:'User'}},{timestamps:true});
export default models.Assessment || model('Assessment',assessmentSchema);
