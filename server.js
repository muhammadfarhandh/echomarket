const express = require("express");
const db = require("./src/config/db");
const errorHandler = require('./src/middleware/error');
const cookieParser = require('cookie-parser');
const path = require('path');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');

const cronJobs = require('./src/Jobs/removeDiscounts');


//Load env
require('dotenv').config()

// Database Connection 
db.connect()

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Sanitize data
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 1000
});
app.use(limiter);

// Prevent http param pollution
app.use(hpp());

//--////////////////////////////////////////////////////////////////
let whitelist = ['http://localhost:3000']
const corsOptions = {
  origin: function (origin, callback) {
    // Check if the origin is in the whitelist or if it's coming from Postman
    if (
      (whitelist.indexOf(origin) !== -1 || !origin) ||
      (origin && origin.startsWith('postman'))
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));
//--////////////////////////////////////////////////////////////////

// Set static folder
app.use(express.static(path.join(__dirname, 'uploads')));
                             
// app.get("/", function (req, res) {
//   res.send();
// });

// Mount routers
app.use("/api/v1/ecom", require("./src/module/auth")());
app.use("/api/v1/ecom/company", require("./src/module/company")());

//--//
app.use(errorHandler);
//--//

const PORT = process.env.PORT || 3000
const server = app.listen(PORT, () => {
    console.log(
      `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
    )
  }
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});