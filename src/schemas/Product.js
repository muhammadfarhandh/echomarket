const mongoose = require('mongoose');
const slugify = require('slugify');
const uuid = require('uuid')


const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String
  },
  description: {
    type: String,
    required: true,
  },
  quantity: { 
    type: Number, 
    default: 10
  },
  price: {
    type: Number,
    required: true,
  },
  discounts: [{
    discount: { type: Number, required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true }
}],
  isSold: {
    type: Boolean,
    default: false,
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Users who have saved this product
  savedByUsers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    select: false 
  }],
  // Array of photo URLs
  photos: {
    type: [String],
    validate: [arrayLimit, '{PATH} exceeds the limit of 3'],
  },
  filters: [{ // array of filters like size color etc  
    title: { type: String }, 
    values: [{ type : String }]
  }],
  status: { 
    type: String,
    enum: ['0', '1'],
    default: '1',
  },
}, { timestamps: true });

function arrayLimit(val) {
    return val.length <= 3;
}

// Create bootcamp slug from the name
ProductSchema.pre('save', function(next) {
    const uniqueId = uuid.v4().substring(0, 8);
    this.slug = `${slugify(this.name, {   
    replacement: '-',  // replace spaces with replacement character, defaults to `-`
    remove: /[*+~.?()'"!:@]/g, // remove characters that match regex, defaults to `undefined`
    lower: true,      // convert to lower case, defaults to `false`
    strict: false,     // strip special characters except replacement, defaults to `false`
    locale: 'vi',      // language code of the locale to use
    trim: true  
  })}-${uniqueId}`;
  next();
});

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;
