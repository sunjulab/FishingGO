const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://sunjulab:B6Wd3vA0g22g1qG6@cluster0.pny9i0j.mongodb.net/fishing_go?retryWrites=true&w=majority';

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to DB via pny9i0j.");

    const PaymentHistory = require('./models/PaymentHistory');
    const Subscription = require('./models/Subscription');

    const result = await PaymentHistory.deleteMany({
        $or: [
          { isTest: true },
          { merchant_uid: null }, 
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
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

run();
