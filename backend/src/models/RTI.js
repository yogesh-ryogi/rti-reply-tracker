const mongoose = require('mongoose');

const logEntrySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    text: { type: String, required: true },
  },
  { _id: false }
);

const rtiSchema = new mongoose.Schema(
  {
    // Human-readable ID e.g. RTI-001
    displayId: {
      type: String,
      required: true,
      unique: true,
    },
    panchayat: {
      type: String,
      enum: ['alpha', 'beta', 'gamma'],
      required: true,
      index: true,
    },
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    filedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    // Computed or stored: filedAt + 30 days
    dueAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'replied'],
      default: 'open',
      index: true,
    },
    repliedAt: Date,
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    replyText: String,
    nudge: {
      type: Boolean,
      default: false,
    },
    log: [logEntrySchema],
  },
  { timestamps: true }
);

// Virtual: days left (can be negative if overdue)
rtiSchema.virtual('daysLeft').get(function () {
  if (this.status === 'replied') return null;
  const now = new Date();
  const ms = this.dueAt - now;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
});

// Virtual: zone for UI
rtiSchema.virtual('zone').get(function () {
  if (this.status === 'replied') return { label: 'Replied', color: 'mut' };
  const left = this.daysLeft;
  if (left < 0) return { label: 'Overdue', color: 'bad' };
  if (left <= 2) return { label: 'Critical', color: 'crit' };
  if (left <= 10) return { label: 'Due soon', color: 'warn' };
  return { label: 'On track', color: 'ok' };
});

rtiSchema.set('toJSON', { virtuals: true });
rtiSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('RTI', rtiSchema);
