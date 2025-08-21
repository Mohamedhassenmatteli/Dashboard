const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Replace the following with your MongoDB connection string
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/DataBase';

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    
    });

    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
