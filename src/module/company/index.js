const express = require("express");
//--//
let routes = function(){
    const router = express();
    //--//
    // router.use("/home", require("./routes/home")());
    router.use("/product", require("./routes/product")());
    //--//
    return router;
};
module.exports = routes;