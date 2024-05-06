const express = require("express");
//--//
let routes = function(){
    const router = express();
    //--//
    router.use("/auth", require("./routes/auth")());
    //--//
    return router;
};
module.exports = routes;