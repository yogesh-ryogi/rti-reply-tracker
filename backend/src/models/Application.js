const mongoose = require('mongoose');

const logEntrySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    text: { type: String, required: true },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    requestedAt: { type: Date, required: true },
    dueAt: { type: Date, required: true },
    paid: { type: Boolean, default: false },
    paidAt: Date,
    method: String, // UPI, Debit card, Net banking
    txnId: String,
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    displayId: {
      type: String,
      required: true,
      unique: true, // APP-001
    },
    scheme: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scheme',
      required: true,
    },
    // Keep scheme displayId for convenience
    schemeDisplayId: String,
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    panchayat: {
      type: String,
      enum: ['alpha', 'beta', 'gamma'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        'Submitted',
        'Under review',
        'Payment requested',
        'Payment received',
        'Approved',
        'Rejected',
      ],
      default: 'Submitted',
      index: true,
    },
    note: {
      type: String,
      default: '',
    },
    payment: paymentSchema,
    reply: String,
    sanctionRef: String,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    filedAt: {
      type: Date,
      default: Date.now,
    },
    log: [logEntrySchema],
  },
  { timestamps: true }
);

applicationSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Application', applicationSchema);
