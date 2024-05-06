const express = require("express");
const authController = require("../controllers/auth");
const { protect, authorize } = require('../../../middleware/auth');
const upload = require('../../../middleware/multerCloudinary');
//--//
let routes = function(){
    let routes = express.Router({mergeParams: true});
    //--//
    routes.route("/signup").post([upload.single('picture')], authController.signup);
    routes.route("/login").post(authController.login);
    routes.route("/logout").post([protect], authController.logout);
    //--////////////////////////////////
    routes.route("/confirmemail").get(authController.confirmEmail);
    // routes.route("/otp").post(authController.generateOtp);
    routes.route("/verify-otp").post(authController.verifyotp);
    routes.route("/forgot").post(authController.forgotPassword);
    routes.route("/resetpassword/:resettoken").put(authController.resetPassword);
    //--////////////////////////////////
    routes.route("/profile").get([protect], authController.getUserProfile);
    routes.route("/users").get([protect], [authorize('admin')], authController.getAllUsers);
    routes.route("/update-profile").put([protect], upload.single('picture'), authController.updateUserProfile);
    //--//
    return routes;
};
//--//
module.exports = routes;