//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require('underscore');

// Require Validation Utils
const Product = require('../../model/products/product');
const Supplier = require('../../model/common/supplier');
const { errorFormatter, validationResult } = require('../validation');

// Create and Save a new product
exports.create = (req, res) => {
    console.log("Creating new product " + JSON.stringify(req.body));
    // Validate Request
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
        return res.json({ errors: _.uniq(errors.array()) });
    }
    var slug = getSlug(req.body.name, req.body.group, req.body.supplier._id);
    console.log(`Finding if a product already exist for: ${slug}`);

    Product.exists({ slug: slug }, function (err, result) {
        if (err) {
            console.log(`Error while finding product for: ${slug}`);
            return res.status(500).send({ message: `Error while finding product for: ${slug}` });
        } else if (result) {
            console.log(`Product already exist for: ${slug}`);
            res.status(400).send({ message: `Product already exist for: ${slug}` });
        } else {
            persist(req, res);
        }
    });

};

// Retrieve and return all product from the database.
exports.lookup = (req, res) => {
    let query = Product.find();
    if (req.query.supplier) {
        query.where('supplier', req.query.supplier);
    }
    if (req.query.group) {
        query.where('group', req.query.group);
    }
    if (req.query.slug) {
        query.where('slug', req.query.slug);
    }
    query.where({ active: true });
    Product.find(query).then(result => {
        console.log(`Returning ${result.length} products.`);
        res.send(result);
    }).catch(error => {
        console.log("Error while fetching product from database. " + error.message);
        res.status(500).send({
            message: error.message || "Some error occurred while retrieving Product."
        });
    });
};


// Deletes all
exports.deleteEverything = (req, res) => {
    Product.remove().then(result => {
        res.send({ message: "Deleted all products" });
    }).catch(err => {
        return res.status(500).send({
            message: `Could not delete all products. ${err.message}`
        });
    });
};

// Find a single product with a productId
exports.findOne = (req, res) => {
    console.log("Received request get a product with id " + req.params.id);
    Product.findOne({ _id: req.params.id })
        .then(product => {
            if (!product) {
                return returnError(req, res, 400, "Product not found");
            }
            res.send(product);
        })
        .catch(err => {
            if (err.kind === 'ObjectId') {
                return returnError(req, res, 400, "Product not found");
            }
            return res.status(500).send({ message: "Error while retrieving product with id " + req.params.id });
        });
};

// Update a product identified by the productId in the request
exports.update = (req, res) => {
    console.log("Updating product " + JSON.stringify(req.body));
    // Validate Request
    if (!req.body) {
        return res.status(400).send({ message: "product body can not be empty" });
    }
    // Find product and update it with the request body
    Product.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
        .then(product => {
            if (!product) {
                return returnError(req, res, 400, "Product not found");
            }
            res.send(product);
        }).catch(err => {
            if (err.kind === 'ObjectId') {
                return returnError(req, res, 400, "Product not found");
            }
            return res.status(500).send({
                message: "Error updating product with id " + req.params.id
            });
        });
};

// Delete a product with the specified productId in the request
exports.delete = (req, res) => {
    Product.findByIdAndRemove(req.params.id)
        .then(product => {
            if (!product) {
                return returnError(req, res, 400, "Product not found");
            }
            res.send({ message: "product deleted successfully!" });
        }).catch(err => {
            if (err.kind === 'ObjectId' || err.name === 'NotFound') {
                return returnError(req, res, 400, "Product not found");
            }
            return res.status(500).send({
                message: "Could not delete product with id " + req.params.id
            });
        });
};

/**
 * Persists new product document
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function persist(req, res) {
    
    // Save product in the database
    Supplier.findOne({ _id: req.body.supplier._id })
        .then(supplier => {
            if (!supplier) {
                return returnError(req, res, 400, "Supplier not found");
            }
            console.log('Supplier found');
            req.body.supplier = {
                "_id": supplier._id,
                "name": supplier.name,
                "tradingName": supplier.tradingName,
                "email": supplier.contact.email,
                "mobile": supplier.contact.mobile,
                "telephone": supplier.contact.telephone,
            }
            const product = buildProductObject(req);
            console.log('Saving new product '+ JSON.stringify(product))
            product.save()
                .then(data => {
                    res.status(201).send(data);
                }).catch(err => {
                    res.status(500).send({
                        message: err.message || "Some error occurred while creating the Product."
                    });
                });
        })
        .catch(err => {
            if (err.kind === 'ObjectId') {
                return returnError(req, res, 400, "Supplier not found");
            }
            return res.status(500).send({ message: "Error while retrieving product with id " + req.params.id });
        });

}

/**
 * Returns Error 
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
function returnError(req, res, code, msg) {
    res.status(code).send({ message: msg });
}

/**
 * Builds product object from Request
 * 
 * @param {Request} req 
 */
function buildProductObject(req) {
    return new Product(buildObject(req));
}

/**
 * Builds product Json from Request
 * 
 * @param {Request} req 
 */
function buildObject(req) {
    return {
        active: req.body.active ? req.body.active : false,
        name: req.body.name,
        slug: getSlug(req.body.name, req.body.group, req.body.supplier._id),
        productInfo: req.body.productInfo,
        group: req.body.group,
        supplier: req.body.supplier,
        size: req.body.size,
        color: req.body.color,
        price: req.body.price,
        priceOld: req.body.priceOld,
        orderBy: req.body.orderBy,
        readyBy: req.body.readyBy,
        image: req.body.image,
        gallery: req.body.gallery,
        colors: req.body.colors,
        sizes: req.body.sizes,
        varients: req.body.varients,
        freeDelivery: req.body.freeDelivery,
        dispatchFrom: req.body.dispatchFrom,
        availableDate: req.body.availableDate,
        deliveryLeadTime: req.body.deliveryLeadTime,
        dateAdded: req.body.dateAdded,
        preOrder: req.body.preOrder,
        collectionOnly: req.body.collectionOnly,
        discontinued: req.body.discontinued,
        featured: req.body.featured,
        active: true
    };
}

/**
 * Returns the slug from the given name
 * e.g if name = M & S products then Slug = m-s-products
 * Replaces special characters and replace space with -
 * 
 * @param {String} name 
 */
function getSlug(name, group, supplier) {
    return name.trim().replace(/[\W_]+/g, "-").toLowerCase() + "--" + group.trim().replace(/[\W_]+/g, "-").toLowerCase() + "--" + supplier.trim().replace(/[\W_]+/g, "-").toLowerCase();
}