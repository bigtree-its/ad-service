//Require Underscore JS ( Visit: http://underscorejs.org/#)
const _ = require("underscore");

// Require Validation Utils
const Product = require("../../model/products/product");
const Supplier = require("../../model/common/supplier");
const { errorFormatter, validationResult } = require("../validation");

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

    checkDuplicateAndPersist(req, res);
};

async function checkDuplicateAndPersist(req, res) {
    console.log(`Checking if Product already exist..`);
    var slug = getSlug(req.body.name, req.body.group, req.body.supplier._id);
    var _id = await Product.exists({ slug: slug });
    if (_id) {
        console.log(`Product already exist with name ${req.body.name}`);
        res.status(400).send({
            message: `Product already exist with name ${req.body.name}`,
        });
    } else {
        persist(req, res);
    }
}

// Retrieve and return all product from the database.
exports.lookup = (req, res) => {
    let query = Product.find();
    if (req.query.supplier) {
        query.where("supplier", req.query.supplier);
    }
    if (req.query.group) {
        query.where({ group: new RegExp("^" + req.query.group + "$", "i") });
    }
    if (req.query.origin) {
        query.where({ group: new RegExp("^" + req.query.origin + "$", "i") });
    }
    if (req.query.organic) {
        query.where({ organic: true });
    }
    if (req.query.stock) {
        query.where({ stock: true });
    }
    if (req.query.nationwide) {
        query.where({ nationwide: true });
    }
    if (req.query.slug) {
        query.where("slug", req.query.slug);
    }
    query.where({ active: true });
    Product.find(query)
        .then((result) => {
            console.log(`Returning ${result.length} products.`);
            res.send(result);
        })
        .catch((error) => {
            console.log(
                "Error while fetching product from database. " + error.message
            );
            res.status(500).send({
                message: error.message || "Some error occurred while retrieving Product.",
            });
        });
};

// Deletes all
exports.deleteEverything = (req, res) => {
    Product.remove()
        .then((result) => {
            res.send({ message: "Deleted all products" });
        })
        .catch((err) => {
            return res.status(500).send({
                message: `Could not delete all products. ${err.message}`,
            });
        });
};

// Find a single product with a productId
exports.findOne = (req, res) => {
    console.log("Received request get a product with id " + req.params.id);
    Product.findOne({ _id: req.params.id })
        .then((product) => {
            if (!product) {
                return returnError(req, res, 400, "Product not found");
            }
            res.send(product);
        })
        .catch((err) => {
            if (err.kind === "ObjectId") {
                return returnError(req, res, 400, "Product not found");
            }
            return res.status(500).send({
                message: "Error while retrieving product with id " + req.params.id,
            });
        });
};

// Update a product identified by the productId in the request
exports.update = (req, res) => {
    console.log(`Updating Product ${req.params.id}`);
    // Validate Request
    if (!req.body) {
        return res.status(400).send({ message: "Product body cannot be empty" });
    }
    if (req.body.supplier) {
        // fetch supplier details from database
        Supplier.findById({ _id: req.body.supplier._id })
            .then((supplier) => {
                if (!supplier) {
                    return returnError(req, res, 400, "Supplier not found");
                } else {
                    req.body.supplier = {
                        _id: supplier._id,
                        name: supplier.name,
                        tradingName: supplier.tradingName,
                        email: supplier.contact.email,
                        mobile: supplier.contact.mobile,
                        telephone: supplier.contact.telephone,
                    };
                    console.log("Supplier found. " + JSON.stringify(req.body.supplier));
                    updateProduct(req, res);
                }
            })
            .catch((err) => {
                if (err.kind === "ObjectId") {
                    return returnError(req, res, 400, "Supplier not found");
                }
                return res.status(500).send({
                    message: "Error while retrieving product with id " + req.params.id,
                });
            });
    } else {
        updateProduct(req, res);
    }
};

function updateProduct(req, res) {
    const filter = { _id: req.params.id };
    // Find Product and update it with the request body
    Product.findOneAndUpdate(filter, req.body)
        .populate("supplier")
        .then((Product) => {
            if (!Product) {
                return res
                    .status(404)
                    .send({ message: `Product not found with id ${req.params.id}` });
            }
            res.send(Product);
        })
        .catch((err) => {
            if (err.kind === "ObjectId") {
                return res
                    .status(404)
                    .send({ message: `Product not found with id ${req.params.id}` });
            }
            return res.status(500).send({
                message: `Error updating Product with id ${req.params.id}`,
            });
        });
}

// Delete a product with the specified productId in the request
exports.delete = async(req, res) => {
    Product.deleteOne({ _id: req.params.id })
        .then((result) => {
            console.log("Deleted Product " + JSON.stringify(result));
            res.send({ message: "Product deleted successfully!" });
        })
        .catch((err) => {
            console.error("Error while deleting product " + JSON.stringify(err));
            if (err.kind === "ObjectId" || err.name === "NotFound") {
                res
                    .status(404)
                    .send({ message: `Product not found with id ${req.params.id}` });
            } else {
                res.status(500).send({
                    message: `Could not delete Product with id ${req.params.id}`,
                });
            }
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
    Supplier.findById({ _id: req.body.supplier._id })
        .then((supplier) => {
            if (!supplier) {
                return returnError(req, res, 400, "Supplier not found");
            } else {
                req.body.supplier = {
                    _id: supplier._id,
                    name: supplier.name,
                    tradingName: supplier.tradingName,
                    email: supplier.contact.email,
                    mobile: supplier.contact.mobile,
                    telephone: supplier.contact.telephone,
                };
                console.log("Supplier found. " + JSON.stringify(req.body.supplier));
                const product = buildProductObject(req);
                console.log("Saving new product " + JSON.stringify(product));
                product
                    .save()
                    .then((data) => {
                        console.log(`Persisted Product: ${data._id}`);
                        res.status(201).send(data);
                    })
                    .catch((err) => {
                        console.error("Save failed. " + err);
                        res.status(500).send({
                            message: err.message ||
                                "Some error occurred while creating the Product.",
                        });
                    });
            }
        })
        .catch((err) => {
            if (err.kind === "ObjectId") {
                return returnError(req, res, 400, "Supplier not found");
            }
            return res.status(500).send({
                message: "Error while retrieving product with id " + req.params.id,
            });
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
        name: req.body.name,
        group: req.body.group,
        description: req.body.description,
        productInfo: req.body.productInfo,
        image: req.body.image,
        origin: req.body.origin,
        gallery: req.body.gallery,
        color: req.body.color,
        weight: req.body.weight,
        size: req.body.size,
        supplier: req.body.supplier,
        variants: req.body.variants,
        sizes: req.body.sizes,
        colors: req.body.colors,
        price: req.body.price,
        priceOld: req.body.priceOld,
        dispatchedFrom: req.body.dispatchedFrom,
        availableDate: req.body.availableDate,
        deliveryLeadTime: req.body.deliveryLeadTime,
        dateAdded: req.body.dateAdded,
        stock: req.body.stock,
        organic: req.body.organic,
        active: req.body.active,
        discontinued: req.body.discontinued,
        featured: req.body.featured,
        preOrder: req.body.preOrder,
        freeDelivery: req.body.freeDelivery,
        nationwide: req.body.nationwide,
        collectionOnly: req.body.collectionOnly,
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
    return (
        name
        .trim()
        .replace(/[\W_]+/g, "-")
        .toLowerCase() +
        "--" +
        group
        .trim()
        .replace(/[\W_]+/g, "-")
        .toLowerCase() +
        "--" +
        supplier
        .trim()
        .replace(/[\W_]+/g, "-")
        .toLowerCase()
    );
}