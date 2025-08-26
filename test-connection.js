const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://ayra11349:l5r70wYofri4QFLw@typinggamecluster.aabcxmq.mongodb.net/typing-game?retryWrites=true&w=majority&appName=TypingGameCluster';

async function testConnection() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connection successful');
    
    // Test if we can create and save a document
    const TestModel = mongoose.model('Test', new mongoose.Schema({ name: String }));
    const testDoc = new TestModel({ name: 'Test Document' });
    await testDoc.save();
    console.log('✅ Document creation successful');
    
    // Clean up
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('✅ Clean up successful');
    
    await mongoose.disconnect();
    console.log('✅ Disconnection successful');
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

testConnection();