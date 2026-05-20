const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    applicant: { // This links candidate (ObjectId -> User)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resumeLink: { 
      type: String,
      required: [true, 'Please provide a resume link'],
    },
    coverLetter: {
      type: String,
      required: [true, 'Please provide a cover letter'],
    },
    applicationStatus: { 
      type: String,
      enum: ['pending', 'Reviewed', 'Accepted', 'Rejected'], 
      default: 'pending',
    },
  },
  {
    timestamps: true, // Covers createdAt timestamps requirement
  }
);

ApplicationSchema.index({ job: 1 });
ApplicationSchema.index({ applicant: 1 });

module.exports = mongoose.model('Application', ApplicationSchema);