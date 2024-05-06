const User = require('../../../schemas/User')
const crypto = require('crypto');
const asyncHandler = require('../../../middleware/async');
const nodemailer = require('../../../utils/nodemailer');
const ErrorResponse = require('../../../utils/errorResponse');

//--//
/**
 * @description creates a new user
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {object} JSON response
 */
exports.signup = async (req, res, next) => {
  try {
    const device_token = req.body.device_token
    // Check if the email is already registered
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return next(new ErrorResponse('Email is already registered', 409));
    }
    // Create and save a new user document
    req.body.picture = (req.file && req.file.path) ? req.file.path : process.env.ICON;
    req.body.contactInfo = (req.body.contactInfo) ? JSON.parse(req.body.contactInfo) : []
    const user = await User.create(req.body)
    
    // grab token and send to email
    const confirmEmailToken = user.generateEmailConfirmToken();

    // Create reset url
    const confirmEmailURL = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/ecom/auth/confirmemail?token=${confirmEmailToken}`;

    const message = `You are receiving this email because you need to confirm your email address. Please make a GET request to: \n\n ${confirmEmailURL}`;

    // user.save({ validateBeforeSave: false });

    const sendResult = await nodemailer.sendEmail({
      email: user.email,
      subject: 'Email confirmation token',
      message,
    });
    sendTokenResponse(user, 200, res, device_token);
  } catch (error) {
    console.error('ERROR', error)
    return next(error);
  }
}


/**
 * @description Authenticate user and generate token
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {object} JSON response
 */
exports.login = async (req, res, next) => {
  try {
    const { username, password, socialId, device_token } = req.body;

    // Validate email and password
    if (!username || !password) return next(new ErrorResponse('Please provide an email and password', 400));

    // Check for user
    const user = await User.findOne({
      $or: [
        { email: username },
        { phone: username },
      ]
    }).select("+password");
    
    if (!user || !user.password) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // if(user.isEmailConfirmed == false){
    //   return next(new ErrorResponse('Email not verified', 401));
    // }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }
    sendTokenResponse(user, 200, res, device_token);
  } catch (error) {
    console.error('ERROR', error);
    return next(error);
  }
};

/**
 * @description generates a 4 digit otp and sends it to the user's phone number
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {object} JSON response
 */
// exports.generateOtp = async (req, res, next) => {
//   try {
//     const { phone } = req.body;

//     if (!phone) {
//         return next(new ErrorResponse('Phone number is required', 400));
//     }
  
//     const user = await User.findOne({
//       phone: phone,
//     });

//     if (!user) {
//       return next(new ErrorResponse('Invalid phone', 400));
//     }

//     //generate 4 digit random number 
//     const otp = Math.floor(1000 + Math.random() * 9000);
//     user.otp = otp.toString();
//     user.otp = '1010';
//     // user.confirmationToken = null;

//     await user.save();

//     res.status(200).json({
//       success: true,
//       data: {},
//     });
//   } catch (error) {
//     console.error('ERROR', error);
//     return next(error);
//   }
// };

/**
 * @description recieve a 4 digit otp and verify it from the user's phone number
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {object} JSON response
 */

exports.verifyotp = async (req, res, next) => {
  let user;
  try {
    const { username, code } = req.body;

    // Validate email and code
    if (!username || !code) {
      return next(new ErrorResponse('Please provide an email and password', 400));
    }

    // Check for user
    user = await User.findOne({
      $or: [
        { email: username },
        { phone: username },
      ]
    }).select('+otp');

    if (!user) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    const resetToken = user.getResetPasswordToken();

    if(code != user.otp){
      return next(new ErrorResponse('Invalid otp'), 400)
    }else if(code == user.otp){
    //remove otp from use 
      user.otp = '';
      await user.save({ validateBeforeSave: false });
      // await user.save();
    }
    res.status(200).json({
      success: true,
      data: {
        token: resetToken
      },
    });
  } catch (error) {
    console.error('ERROR', error);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
    return next(error);
  }
};


exports.logout = asyncHandler(async (req, res, next) => {
  req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token);
  await req.user.save();
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
});

/**
 * @description Get the currently authenticated user
 * @param {object} req - request object
 * @param {object} res - response object
 * @returns {object} JSON response
 */
exports.getUserProfile = async (req, res) => {
  try {
      const user = req.user;
      user.tokens = undefined;
      res.status(200).json({
        success: true,
        data: user,
      });
  } catch (error) {
      console.error('ERROR', error)
  }
}

exports.getAllUsers = async (req, res) => {
  try {
    const user = await User.find().select('-otp -confirmEmailToken -isEmailConfirmed -twoFactorEnable -tokens');
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
      console.error('ERROR', error)
  }
}

exports.updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    user.name = req.body.name || user.name;
    user.contactInfo = (req.body.contactInfo) ? JSON.parse(req.body.contactInfo) : user.contactInfo
    // let contactInfo = (req.body.contactInfo) ? JSON.parse(req.body.contactInfo) : []
    // contactInfo.forEach(element => {
    //   user.contactInfo.push(element)
    // });
    user.picture = (req.file && req.file.path) ? req.file.path : user.picture;
    await user.save();
    user.tokens = [];
    return  res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
      console.error('ERROR', error)
      return next(error)
  }
}

exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email }).select('+otp');
      if (!user) {
        return next(new ErrorResponse('No user found', 404));
      }
      //generate 4 digit random number 
      const otp = Math.floor(1000 + Math.random() * 9000);
      // user.otp = otp.toString();
      user.otp = '1010';
      // user.confirmationToken = null;
  
      // Get reset token
      const resetToken = user.getResetPasswordToken();
      await user.save({ validateBeforeSave: false });
    
      // Create reset url
      // const resetUrl = `${req.protocol}://${req.get(
      //   'host',
      // )}/api/v1/auth/resetpassword/${resetToken}`;
      const message = `You are receiving this email because you (or someone else) has requested the reset of a password ${otp}`;
      
      try {
        await nodemailer.sendEmail({
          email: user.email,
          subject: 'Password reset token',
          message,
        });
        res.status(200).json({ success: true, data: "otp sent to email" });
      } catch (err) {
        console.log(err);
        // user.resetPasswordToken = undefined;
        // user.resetPasswordExpire = undefined;
        // await user.save({ validateBeforeSave: false });
        return next(new ErrorResponse('Email could not be sent', 500));
      }
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse('Invalid token', 400));
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});


exports.confirmEmail = asyncHandler(async (req, res, next) => {
  // grab token from email
  const { token } = req.query;

  if (!token) {
    return next(new ErrorResponse('Invalid Token', 400));
  }

  const splitToken = token.split('.')[0];
  const confirmEmailToken = crypto
    .createHash('sha256')
    .update(splitToken)
    .digest('hex');

  // get user by token
  const user = await User.findOne({
    confirmEmailToken,
    isEmailConfirmed: false,
  });

  if (!user) {
    return next(new ErrorResponse('Invalid Token', 400));
  }

  // update confirmed to true
  user.confirmEmailToken = undefined;
  user.isEmailConfirmed = true;

  // save
  await user.save({ validateBeforeSave: false });

  // return token
  sendTokenResponse(user, 200, res);
});



//--////////////////////////////////
//--////////////////////////////////
//--////////////////////////////////
// Get token from model, create cookie and send response
const sendTokenResponse = async (user, statusCode, res, device_token) => {
    // Create token
    // const device_token = "q93744376b76785n8"
    const token = await user.getSignedJwtToken(device_token);
    res.status(statusCode).cookie('token', token).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailConfirmed: user.isEmailConfirmed,
        picture: user.picture
      }
    });
  };
  
