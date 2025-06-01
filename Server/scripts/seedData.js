const mongoose = require('mongoose');
const Subject = require('../models/Subject');
const Tutor = require('../models/Tutor');
require('dotenv').config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Create subjects
    const subjects = await Subject.insertMany([
      { name: 'Mathematics', category: 'Mathematics', description: 'Basic to advanced mathematics' },
      { name: 'Physics', category: 'Science', description: 'Physics concepts and problems' },
      { name: 'English', category: 'Languages', description: 'English language and literature' }
    ]);
    
    console.log('Subjects created:', subjects);
    
    // Update existing tutors with subjects
    const tutors = await Tutor.find({});
    
    for (let tutor of tutors) {
      if (tutor.subjects.length === 0) {
        tutor.subjects.push({
          subject: subjects[0]._id, // Mathematics
          hourlyRate: 25,
          level: 'intermediate'
        });
        await tutor.save();
        console.log(`Updated tutor ${tutor.firstName} with subjects`);
      }
    }
    
    console.log('Data seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
