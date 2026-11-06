const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema(
  {
    displayId: {
      type: String,
      required: true,
      unique: true, // S1, S2, ...
    },
    name: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      enum: ['Central', 'State'],
      required: true,
    },
    issuedAt: {
      type: Date,
      required: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    summary: String,
    benefit: String,
    eligibility: String,
    documents: String,
    howToApply: String,
  },
  { timestamps: true }
);

// Virtual for status relative to a given "now" (or current time)
schemeSchema.methods.getStatus = function (now = new Date()) {
  const daysLeft = Math.ceil((this.deadline - now) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { label: 'Closed', color: 'mut', daysLeft };
  if (daysLeft === 0) return { label: 'Closes today', color: 'crit', daysLeft };
  if (daysLeft <= 7) return { label: 'Closing soon', color: 'crit', daysLeft };
  if (daysLeft <= 14) return { label: 'Closing soon', color: 'warn', daysLeft };
  return { label: 'Open', color: 'ok', daysLeft };
};

schemeSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Scheme', schemeSchema);
