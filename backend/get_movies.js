const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/cineconnect');
  const movies = await mongoose.connection.db.collection('movies').find({ 
    title: { $regex: 'toxic|kd|janayagan', $options: 'i' } 
  }).toArray();
  
  console.log(JSON.stringify(movies, null, 2));
  process.exit(0);
}

run().catch(console.error);
