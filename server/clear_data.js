const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Project = require('./src/models/Project');
const Task = require('./src/models/Task');

const clearData = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('Error: MONGODB_URI is not set in environment variables');
      process.exit(1);
    }

    console.log('Connecting to database to clear data...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected. Clearing all projects and tasks...');
    
    await Project.deleteMany({});
    await Task.deleteMany({});
    
    console.log('All projects and tasks successfully deleted. Users are kept so you can still log in using the demo accounts (or register new ones).');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing data:', error);
    process.exit(1);
  }
};

clearData();
