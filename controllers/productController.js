import Product from '../models/Product.js';
import cloudinary from '../config/cloudinary.js';

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب المنتجات', error: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'المنتج غير موجود' });
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب المنتج', error: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      nameEn,
      formula,
      category,
      price,
      priceSAR: req.body.priceSAR || price,
      priceEGP: req.body.priceEGP,
      currency: 'SAR',
      weight,
      tag,
      color,
      description,
      spec,
      stock
    } = req.body;

    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'الصورة مطلوبة' });
    }

    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'green-line/products',
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    const product = await Product.create({
      name,
      nameEn,
      formula,
      category,
      price,
      priceSAR: req.body.priceSAR || price,
      priceEGP: req.body.priceEGP,
      currency: 'SAR',
      weight,
      tag,
      color,
      description,
      spec,
      stock,
      image: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في إنشاء المنتج', error: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'المنتج غير موجود' });
    }

    // If new image uploaded, delete old one and upload new
    if (req.file) {
      // Delete old image from Cloudinary
      await cloudinary.uploader.destroy(product.image.publicId);

      // Upload new image
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'green-line/products',
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      });

      req.body.image = {
        url: result.secure_url,
        publicId: result.public_id,
      };
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تحديث المنتج', error: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'المنتج غير موجود' });
    }

    // Delete image from Cloudinary
    await cloudinary.uploader.destroy(product.image.publicId);

    await product.deleteOne();

    res.json({ message: 'تم حذف المنتج بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في حذف المنتج', error: error.message });
  }
};
