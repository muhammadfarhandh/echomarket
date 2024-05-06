const express = require("express");
const Product = require('../../../schemas/Product');
const productController = require("../controllers/product");
const upload = require('../../../middleware/multerCloudinary');
const advancedResults = require('../../../middleware/advancedResults');
const { protect, authorize } = require('../../../middleware/auth');
//--////////////////////////////////
let routes = function(){
    let routes = express.Router({mergeParams: true});
    //--////////////////////////////////
    routes.route("/fetch").get([protect], advancedResults(Product, {path: 'seller', select: 'name picture' }), productController.fetch);
    //--////////////////////////////////
    routes.route("/create").post([protect], [upload.array('photos')], productController.create);
    //--////////////////////////////////
    routes.route("/update/:id").put([protect], [upload.array('photos')], productController.update);
    //--////////////////////////////////
    routes.route("/delete/:id").delete([protect], productController.delete);
    //--////////////////////////////////
    return routes;
};
//--////////////////////////////////
module.exports = routes;