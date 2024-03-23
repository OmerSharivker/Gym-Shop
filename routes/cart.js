
//
var express = require('express');
var router = express.Router();
// Get Product model
var Product = require('../models/product');



/*
 * GET add product to cart
 */

var productCart = []; // Initialize the productCart array\

// This route adds a product to the cart and updates the productCart array
router.get('/add/:product', async function (req, res) {
    var slug = req.params.product;

    try {
        var product = await Product.findOne({ slug: slug }).exec();
        if (!product) {
            return res.status(404).send('Product not found');
        }

        if (!req.session.cart) {
            req.session.cart = [];
        }

        var cart = req.session.cart;
        var newItem = true;

        for (var i = 0; i < cart.length; i++) {
            if (cart[i].title == slug) {
                cart[i].qty++;
                newItem = false;
                break;
            }
        }

        if (newItem) {
            cart.push({
                title: slug,
                qty: 1,
                price: parseFloat(product.price).toFixed(2),
                image: '/product_images/' + product._id + '/' + product.image
            });
        }

        productCart.push(product.title); // Update the productCart array

        req.flash('success', 'Product added!');
        res.redirect('back');
    } catch (err) {
        console.log(err);
        return res.status(500).send('An error occurred');
    }
});



// This route updates the sales data using the productCart array
router.get('/buynow', async function (req, res) {
    try {
        for (const productTitle of productCart) {
            await Product.updateMany(
                { title: productTitle },
                { $inc: { pursche: +1 } }
            );
        }

        productCart = []; // Clear the productCart array

        delete req.session.cart;

        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        return res.status(500).send('An error occurred');
    }
});

module.exports = router;
/*
 * GET checkout page
 */
router.get('/checkout', function (req, res) {

    if (req.session.cart && req.session.cart.length == 0) {
        //if cart is not empty
        delete req.session.cart;
        res.redirect('/cart/checkout');
    } else {
        //if cart is empty
        res.render('checkout', {
            title: 'Checkout',
            cart: req.session.cart
        });

    }
});

/*
 * GET update product
 */
router.get('/update/:product', function (req, res) {
    var slug = req.params.product;
    var cart = req.session.cart;
    var action = req.query.action;

    if (cart && Array.isArray(cart)) {  // Check if cart is defined and an array
        for (var i = 0; i < cart.length; i++) {
            if (cart[i].title == slug) {
                switch (action) {
                    case "add":
                        cart[i].qty++;
                        break;
                    case "remove":
                        cart[i].qty--;

                        if (cart[i].qty == 0) {
                            cart.splice(i, 1);
                        }
                        break;

                    case "clear":
                        cart.splice(i, 1);
                        if (cart.length == 0) {
                            delete req.session.cart;
                        }
                        break;
                    default:
                        console.log('update problem');
                        break;
                }
                break;
            }
        }
    }

    req.flash('success', 'Cart Updated!');
    res.redirect('/cart/checkout');
});
/*
 * GET clear cart
 */
router.get('/clear', function (req, res) {

    delete req.session.cart;

    req.flash('success', 'Cleared!');
    res.redirect('/cart/checkout');
});


// Exports
module.exports = router;