const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resume: {
      type: String,
      required: [true, 'Please provide a resume link or text'],
    },
    coverLetter: {
      type: String,
    },
    status: {
      type: String,
      enum: ['Pending', 'Reviewed', 'Accepted', 'Rejected'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

// Optimize performance: Speed up lookups for a specific job's applications
ApplicationSchema.index({ job: 1 });
// Optimize performance: Speed up lookups for a candidate's application history
ApplicationSchema.index({ applicant: 1 });

module.exports = mongoose.model('Application', ApplicationSchema);