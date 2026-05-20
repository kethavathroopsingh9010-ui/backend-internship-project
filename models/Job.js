const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema(
  {
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a job title'],
      trim: true,
    },
    company: {
      type: String,
      required: [true, 'Please add a company name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a job description'],
    },
    requirements: {
      type: [String], 
      required: [true, 'Please add job requirements'],
    },
    salary: {
      type: String,
      required: [true, 'Please add a salary range'],
    },
    location: {
      type: String,
      required: [true, 'Please add a job location'],
      default: 'Remote',
    },
  },
  {
    timestamps: true, 
  }
);

//(Before exporting, using correct capitalized Casing)
JobSchema.index({ title: 'text', company: 'text' }); 
JobSchema.index({ recruiter: 1 }); 


module.exports = mongoose.model('Job', JobSchema);