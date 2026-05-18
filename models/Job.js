const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema(
  {
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Links the job post to the User who created it
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
      type: [String], // Array of strings for skills/qualifications
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
    timestamps: true, // Automatically creates createdAt and updatedAt fields
  }
);

module.exports = mongoose.model('Job', JobSchema);