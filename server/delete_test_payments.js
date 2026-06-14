require('dotenv').config();
const mongoose = require('mongoose');

const buildMongoUri = () => {
  if (process.env.MONGO_URI) return process.env.MONGO_URI;
  const pass = process.env.MONGO_PASS;
  const host = process.env.MONGO_HOST || 'cluster0.cyqhznd.mongodb.net';
  const user = process.env.MONGO_USER || 'fishinggo';
  const db = process.env.MONGO_DB || 'fishinggo';
  if (pass) {
    const enc = encodeURIComponent(pass);
    return `mongodb+srv://${user}:${enc}@${host}/${db}?appName=Cluster0`;
  }
  return '';
};

async function run() {
  await mongoose.connect(buildMongoUri());
  console.log("Connected to DB.");

  const PaymentHistory = require('./models/PaymentHistory');
  const Subscription = require('./models/Subscription');

  // 삭제할 가짜 결제 내역 (110,000원 또는 merchant_uid null)
  const result = await PaymentHistory.deleteMany({
      $or: [
        { isTest: true },
        { merchant_uid: null }, // 테스트 결제들
        { amount: 110000 }
      ]
  });
  console.log(`Deleted ${result.deletedCount} test payments.`);

  const subResult = await Subscription.deleteMany({
      $or: [
        { isTest: true },
        { amount: 110000 }
      ]
  });
  console.log(`Deleted ${subResult.deletedCount} test Subscriptions.`);

  process.exit(0);
}

run();
