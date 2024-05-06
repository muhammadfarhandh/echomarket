const asyncHandler = require('../../../middleware/async');
const Product = require('../../../schemas/Product');
const User = require('../../../schemas/User');
const ErrorResponse = require('../../../utils/errorResponse');


exports.fetch = asyncHandler(async (req, res, next) => { 
    res.status(200).json(res.advancedResults);
});


// Create a product with multiple images
exports.create = async (req, res, next) => {
    try {
        const seller = req.user.id;
        let filters = JSON.parse(req.body.filters);
        let discounts = JSON.parse(req.body.discounts);
      
      // Extracting image URLs from Cloudinary response
      const photos = req.files.map(file => file.path);
  
      // Create the product
      const record = await Product.create({...req.body, seller, filters, discounts, photos});
  
      res.status(201).json({ success: true, record });
    } catch (error) {
      console.error('ERROR', error);
      return next(error);
    }
  };

//--////////////////////////////////
exports.update = async (req, res, next) => {
try {
    const record = await Product.findById(req.params.id)
    if(!record) return next(new ErrorResponse("Record not found!", 400))
        // Make sure user is product owner
    if (record.seller.toString() !== req.user.id) {
        return next(
            new ErrorResponse(
                `User ${req.user.id} is not authorized to update this product`,
                401
            )
        );
    }
    record.name = req.body.name || record.name;
    record.description = req.body.description || record.description;
    record.price = req.body.price || record.price;
    record.filters = (req.body.filters) ? JSON.parse(req.body.filters) : record.filters;
    record.photos = (req.files && req.files.length > 0) ? req.files.map(file => file.path) : record.photos;
    await record.save();
    res.status(200).json({
        success: true,
        data: record
    });
} catch (error) {
    console.error(error);
    return next(error)
}
}


//--////////////////////////////////
exports.delete = async (req, res, next) => {
    try {
        const record = await Product.findById(req.params.id)
        if(!record) return next(new ErrorResponse("Record not found!", 400))
          // Make sure user is product owner
        if (record.seller.toString() !== req.user.id) {
            return next(
              new ErrorResponse(
                  `User ${req.user.id} is not authorized to delete this product`,
                  401
              )
            );
        }
        await record.deleteOne()
        res.status(200).json({
            success: true,
            data: record
        });
    } catch (error) {
        console.error(error);
        return next(error)
    }
  }
  //--////////////////////////////////



// Automatically remove expired discounts
exports.removeExpiredDiscounts = async () => {
    try {
        const currentDate = new Date();
        console.log(currentDate);
        // const list = await Product.find({ 'discounts.end_date': { $lt: currentDate } })
        Product.updateMany(
            { 'discounts.end_date': { $lt: currentDate } },
            { $pull: { discounts: { end_date: { $lt: currentDate } } } }
        );
        console.log("Disscount Removed");
    } catch (error) {
        console.error('Error removing expired discounts:', error);
    }
};