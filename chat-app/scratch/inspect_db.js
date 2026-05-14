const mongoose = require('mongoose');
const User = require('./src/models/User').default;
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await User.find({});
  console.log('USERS:', JSON.stringify(users, null, 2));
  process.exit(0);
}
run();
