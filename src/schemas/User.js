const mongoose = require('mongoose')
const { Schema } = mongoose
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const UserSchema = new Schema({
    name: { type: String },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      sparse: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      // required: [true, 'Please add a password'],
      required: false,
      minlength: 6,
      select: false
    },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'user'],
        default: 'user'
    },
    contactInfo: [{
      phone: String,
      city: String
    }],
    picture: { type: String },
    age: { type: Number },
    tokens: [{
      token: {
        type: String,
        required: true,
      },
      device_token:{ type: String },
    }],
    confirmEmailToken: {type: String},
    isEmailConfirmed: {
      type: Boolean,
      default: false,
    },
    otp: {type: String},
    resetPasswordToken: {type: String},
    resetPasswordExpire: {type: Date},
},{ timestamps: true })

/**
 * Encrypts the password before saving it to the database.
 * @param {Function} next - Callback function.
 */
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
      next();
    }
  
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});


/**
 * Sign JWT and return
 * @returns {string} JWT token
 */
UserSchema.methods.getSignedJwtToken = async function (device_token) {
  const token = jwt.sign({ _id: this._id.toString() }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
  this.tokens = this.tokens.concat({ token, device_token });
  await this.save();
  return token;
};

/**
 * Compares the given plain text password with the hashed password in the database.
 * @param {string} enteredPassword - The password entered by the user.
 * @returns {boolean} Returns true if the passwords match, else returns false.
 */UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

/**
 * Generate email confirm token
 * @param {Function} - Callback function
 */UserSchema.methods.generateEmailConfirmToken = function () {
  // email confirmation token
  const confirmationToken = crypto.randomBytes(20).toString('hex');

  this.confirmEmailToken = crypto
    .createHash('sha256')
    .update(confirmationToken)
    .digest('hex');

  const confirmTokenExtend = crypto.randomBytes(100).toString('hex');
  const confirmTokenCombined = `${confirmationToken}.${confirmTokenExtend}`;
  return confirmTokenCombined;
};

// // Reverse populate with virtuals
// UserSchema.virtual('products', {
//   ref: 'Product',
//   localField: '_id',
//   foreignField: 'user',
//   justOne: false
// });

UserSchema.indexes({ email: 1}, { unique: true });

module.exports = mongoose.model('User', UserSchema);
