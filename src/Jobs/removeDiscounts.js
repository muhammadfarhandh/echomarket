// cronJobs.js
const cron = require('node-cron');
const productController = require('../module/company/controllers/product');

// Run the cron job every day at midnight
// cron.schedule('* * * * *', () => {
//     console.log('running a task every minute');
//     productController.removeExpiredDiscounts
//   });
cron.schedule('* * * * *', productController.removeExpiredDiscounts);
