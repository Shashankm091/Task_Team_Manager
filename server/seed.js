const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config();

const User = require('./src/models/User');
const Project = require('./src/models/Project');
const Task = require('./src/models/Task');

const seedData = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('Error: MONGODB_URI is not set in environment variables');
      process.exit(1);
    }

    console.log('Connecting to database for seeding...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to Database. Clearing old data...');

    // Clear existing data
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});

    console.log('Data cleared. Creating default users...');

    // 1. Create Users
    // Admin user
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    const adminUser = await User.create({
      name: 'Demo Admin',
      email: 'admin@demo.com',
      password: adminPasswordHash,
      role: 'Admin'
    });

    // Member user
    const memberPasswordHash = await bcrypt.hash('Member@123', 10);
    const memberUser = await User.create({
      name: 'Demo Member',
      email: 'member@demo.com',
      password: memberPasswordHash,
      role: 'Member'
    });

    // Additional Member user for team demo
    const teamMemberPasswordHash = await bcrypt.hash('Member@123', 10);
    const memberUser2 = await User.create({
      name: 'Sarah Chen',
      email: 'sarah@demo.com',
      password: teamMemberPasswordHash,
      role: 'Member'
    });

    console.log('Users created:');
    console.log(`- Admin: admin@demo.com / Admin@123`);
    console.log(`- Member: member@demo.com / Member@123`);
    console.log(`- Member 2: sarah@demo.com / Member@123`);

    // 2. Create Projects
    console.log('Creating demo projects...');
    
    // Project 1
    const project1Deadline = new Date();
    project1Deadline.setDate(project1Deadline.getDate() + 14); // 2 weeks out
    const project1 = await Project.create({
      name: 'Apollo Website Redesign',
      description: 'Overhaul corporate portal landing pages, modernizing layout and improving conversion metrics.',
      deadline: project1Deadline,
      members: [adminUser._id, memberUser._id, memberUser2._id],
      created_by: adminUser._id
    });

    // Project 2
    const project2Deadline = new Date();
    project2Deadline.setDate(project2Deadline.getDate() + 30); // 30 days out
    const project2 = await Project.create({
      name: 'Mobile App Beta Launch',
      description: 'Develop and launch the beta version of our iOS/Android tracking application.',
      deadline: project2Deadline,
      members: [adminUser._id, memberUser2._id],
      created_by: adminUser._id
    });

    // Project 3 (Overdue Project Demo)
    const project3Deadline = new Date();
    project3Deadline.setDate(project3Deadline.getDate() - 5); // 5 days in the past
    const project3 = await Project.create({
      name: 'Q1 Compliance Audit',
      description: 'Prepare documentation and security compliance self-assessments for external auditors.',
      deadline: project3Deadline,
      members: [adminUser._id, memberUser._id],
      created_by: adminUser._id
    });

    console.log('Projects created successfully.');

    // 3. Create Tasks
    console.log('Creating demo tasks...');

    // Tasks for Project 1 (Apollo Website Redesign)
    const task1 = await Task.create({
      title: 'Design UI Mockups',
      description: 'Create high-fidelity mockups for landing pages and registration dashboards.',
      priority: 'High',
      status: 'Done',
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days out
      project: project1._id,
      assigned_to: memberUser._id,
      created_by: adminUser._id
    });

    const task2 = await Task.create({
      title: 'Build Responsive CSS Layouts',
      description: 'Implement glassmorphic landing page styles using modern custom properties.',
      priority: 'High',
      status: 'In Progress',
      due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days out
      project: project1._id,
      assigned_to: memberUser._id,
      created_by: adminUser._id
    });

    const task3 = await Task.create({
      title: 'Connect Auth API',
      description: 'Configure JWT access and refresh token authentication flow in frontend code.',
      priority: 'Medium',
      status: 'To Do',
      due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days out
      project: project1._id,
      assigned_to: memberUser2._id,
      created_by: adminUser._id
    });

    // Tasks for Project 2 (Mobile App Beta Launch)
    const task4 = await Task.create({
      title: 'Setup Apple Developer Account',
      description: 'Complete registration and pay subscription fee to publish internal TestFlight build.',
      priority: 'Medium',
      status: 'Done',
      due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days out
      project: project2._id,
      assigned_to: memberUser2._id,
      created_by: adminUser._id
    });

    const task5 = await Task.create({
      title: 'Integrate Analytics SDK',
      description: 'Set up logging pipelines for user registration events and task completion funnels.',
      priority: 'Low',
      status: 'To Do',
      due_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days out
      project: project2._id,
      assigned_to: memberUser2._id,
      created_by: adminUser._id
    });

    // Tasks for Project 3 (Q1 Compliance Audit) - Overdue demos
    const task6 = await Task.create({
      title: 'Gather Server Logs',
      description: 'Export audit logs and authentication logs for security evaluation.',
      priority: 'High',
      status: 'To Do', // Will automatically be marked as Overdue because date is in the past!
      due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days in the past
      project: project3._id,
      assigned_to: memberUser._id,
      created_by: adminUser._id
    });

    const task7 = await Task.create({
      title: 'Final Audit Report Sign-off',
      description: 'Review and sign-off on the completed compliance report.',
      priority: 'High',
      status: 'Done', // Should stay Done even though due date is in the past
      due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day in the past
      project: project3._id,
      assigned_to: adminUser._id,
      created_by: adminUser._id
    });

    console.log('Tasks created successfully.');
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedData();
