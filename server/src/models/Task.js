const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a task title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot be more than 1000 characters'],
    },
    priority: {
      type: String,
      required: true,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    status: {
      type: String,
      required: true,
      enum: ['To Do', 'In Progress', 'Done', 'Overdue'],
      default: 'To Do',
    },
    due_date: {
      type: Date,
      required: [true, 'Please add a task due date'],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Function to check if task is overdue
const updateOverdueStatus = function (doc) {
  if (doc && doc.status !== 'Done' && doc.due_date && new Date(doc.due_date) < new Date()) {
    doc.status = 'Overdue';
  }
};

// Check overdue status on initialization (when fetched from DB)
TaskSchema.post('init', function (doc) {
  updateOverdueStatus(doc);
});

// Check overdue status before saving
TaskSchema.pre('save', function (next) {
  updateOverdueStatus(this);
  next();
});

module.exports = mongoose.model('Task', TaskSchema);
