import { Schema, model } from 'mongoose';
const answerSchema=new Schema({questionId:{type:Schema.Types.ObjectId,required:true},dimensionId:{type:Schema.Types.ObjectId,required:true},value:{type:Schema.Types.Mixed},score:{type:Number,min:0,max:100}},{_id:false});
const submissionSchema=new Schema({university:{type:Schema.Types.ObjectId,ref:'University',required:true,index:true},assessment:{type:Schema.Types.ObjectId,ref:'Assessment',required:true},submittedBy:{type:Schema.Types.ObjectId,ref:'User',required:true},answers:[answerSchema],status:{type:String,enum:['in_progress','submitted','published'],default:'in_progress',index:true},overallScore:{type:Number,min:0,max:100},dimensionScores:[{dimensionId:Schema.Types.ObjectId,key:String,name:String,score:Number,weight:Number}],readinessLevel:{type:String},submittedAt:Date,publishedAt:Date},{timestamps:true});
submissionSchema.index({university:1,status:1,createdAt:-1});
export default model('AssessmentSubmission',submissionSchema);
