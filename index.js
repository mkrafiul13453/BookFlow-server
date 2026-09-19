const express = require('express');
const app = express()
const cors = require('cors')
app.use(cors())
app.use(express.json())
require('dotenv').config()

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT;
const uri = process.env.MONGODB_URI;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
async function run() {
    try {
        const db = client.db('BookFlow');
        const booksCollection = db.collection("books");
        const usersCollection = db.collection("user");
        const cartsCollection = db.collection("carts");
        const ordersCollection = db.collection("orders");


// ..........................................................Add book by librarian api.......................................................................
        app.post("/librarian/add-book", async (req, res) => {
            const data = req.body;
            const result = await booksCollection.insertOne({ ...data});
            res.send(result)
        })

// ..........................................................Get all book api.......................................................................
        app.get("/librarian/add-book", async (req, res) => {
            const result = await booksCollection.find().toArray();
            res.send(result)
        })

        // ..........................................................Get all book by librarian id api.......................................................................
        app.get("/librarian/add-book/data", async (req, res) => {
            const { userId } = req.query;
            const result = await booksCollection.find({userId: userId}).toArray();
            res.send(result)
        })

        // ..........................................................Delete single book by librarian id api.......................................................................
        app.delete("/librarian/delete-book", async (req, res) => {
            const { bookId, userId } = req.query;

            const result = await booksCollection.deleteOne({
                _id: new ObjectId(bookId),
                userId: userId,
            });

            res.send(result);
        });


        // ..........................................................Update single book by librarian id api.......................................................................
        app.patch("/librarian/update-book", async (req, res) => {
            const { bookId, userId } = req.query;

            const { title, author, price, category, description } = req.body;

            const result = await booksCollection.updateOne(
                {
                    _id: new ObjectId(bookId),
                    userId: userId,
                },
                {
                    $set: {
                        title,
                        author,
                        price,
                        category,
                        description,
                    },
                }
            );

            res.send(result);
        });

        
// ..........................................................Get single book book id api.......................................................................
        app.get("/librarian/add-book/:id", async (req, res) => {
            const { id } = req.params;

            const result = await booksCollection.findOne({_id: new ObjectId(id),
            });

            res.send(result);
        });

        // .......................................................Add to cart post api.................................................................
        app.post("/cart", async (req, res) => {
            const { userId, bookId } = req.body;

            if (!userId || !bookId) {
                return res.status(400).send({
                    success: false,
                    message: "userId and bookId are required",
                });
            }

            const book = await booksCollection.findOne({
                _id: new ObjectId(bookId),
            });

            if (!book) {
                return res.status(404).send({
                    success: false,
                    message: "Book not found",
                });
            }

            const existingCartItem = await cartsCollection.findOne({
                userId: userId,
                bookId: bookId,
            });

            if (existingCartItem) {
                const result = await cartsCollection.updateOne(
                    {
                        _id: existingCartItem._id,
                    },
                    {
                        $inc: {
                            quantity: 1,
                        },
                    }
                );

                return res.send({
                    success: true,
                    message: "Book quantity increased",
                    result,
                });
            }

            const cartItem = {
                userId: userId,
                bookId: bookId,
                title: book.title,
                author: book.author,
                price: Number(book.price),
                image: book.image,
                category: book.category,
                quantity: 1,
            };

            const result = await cartsCollection.insertOne(cartItem);

            res.send({
                success: true,
                message: "Book added to cart",
                result,
            });
        });

         // .......................................................Add to cart get api.................................................................
        app.get("/cart", async (req, res) => {
            const { userId } = req.query;

            if (!userId) {
                return res.status(400).send({
                    success: false,
                    message: "userId is required",
                });
            }

            const result = await cartsCollection
                .find({ userId: userId })
                .toArray();

            res.send(result);
        });

        // .......................................................Cart update api.......................................................................
        app.patch("/cart/:id", async (req, res) => {
            const { id } = req.params;
            const { userId, quantity } = req.body;

            if (!userId || !quantity || quantity < 1) {
                return res.status(400).send({
                    success: false,
                    message: "Invalid userId or quantity",
                });
            }

            const result = await cartsCollection.updateOne(
                {
                    _id: new ObjectId(id),
                    userId: userId,
                },
                {
                    $set: {
                        quantity: Number(quantity),
                    },
                }
            );

            res.send({
                success: true,
                message: "Cart quantity updated",
                result,
            });
        });

        // ....................................Cart single item delete api.......................................................................
        app.delete("/cart/:id", async (req, res) => {
            const { id } = req.params;
            const { userId } = req.query;

            if (!userId) {
                return res.status(400).send({
                    success: false,
                    message: "userId is required",
                });
            }

            const result = await cartsCollection.deleteOne({
                _id: new ObjectId(id),
                userId: userId,
            });

            res.send({
                success: true,
                message: "Book removed from cart",
                result,
            });
        });

        // ..........................................................CLear entire cart api.......................................................................
        app.delete("/cart", async (req, res) => {
            const { userId } = req.query;

            if (!userId) {
                return res.status(400).send({
                    success: false,
                    message: "userId is required",
                });
            }

            const result = await cartsCollection.deleteMany({
                userId: userId,
            });

            res.send({
                success: true,
                message: "Cart cleared successfully",
                result,
            });
        });

        // .......................................................Create Order API.................................................................

        app.post("/orders", async (req, res) => {
            try {
                const { userId, user } = req.body;

                if (!userId) {
                    return res.status(400).send({
                        success: false,
                        message: "userId is required",
                    });
                }

                // Get user's current cart directly from MongoDB
                const cartItems = await cartsCollection
                    .find({ userId: userId })
                    .toArray();

                if (cartItems.length === 0) {
                    return res.status(400).send({
                        success: false,
                        message: "Cart is empty",
                    });
                }

                // Prepare ordered products
                const products = cartItems.map((item) => {
                    const price = Number(item.price);
                    const quantity = Number(item.quantity);

                    return {
                        productId: item.bookId,
                        title: item.title,
                        author: item.author,
                        image: item.image,
                        category: item.category,

                        price: price,
                        quantity: quantity,

                        itemTotal: Number(
                            (price * quantity).toFixed(2)
                        ),
                    };
                });

                // Calculate total price from database cart
                const totalPrice = products.reduce(
                    (total, item) => total + item.itemTotal,
                    0
                );

                const order = {
                    userId: userId,

                    user: {
                        name: user?.name || "",
                        email: user?.email || "",
                        image: user?.image || "",
                    },

                    products: products,

                    totalPrice: Number(totalPrice.toFixed(2)),

                    currency: "usd",

                    paymentStatus: "pending",

                    deliveryStatus: "pending",

                    stripeSessionId: null,

                    stripePaymentIntentId: null,

                    createdAt: new Date(),

                    updatedAt: new Date(),
                };

                const result = await ordersCollection.insertOne(order);

                res.send({
                    success: true,
                    message: "Order created successfully",

                    orderId: result.insertedId.toString(),

                    order: {
                        ...order,
                        _id: result.insertedId,
                    },
                });
            } catch (error) {
                console.error("Create order error:", error);

                res.status(500).send({
                    success: false,
                    message: "Failed to create order",
                    error: error.message,
                });
            }
        });


        // ..........................................................Get all user data api.......................................................................
        app.get("/user", async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result)
        })

        // ..........................................................Delete single user data api.......................................................................
        app.delete("/user/:id", async (req, res) => {
            const id = req.params.id;

            const result = await usersCollection.deleteOne({
                _id: new ObjectId(id),
            });

            res.send(result);
        });

        // .......................................................Update Order Stripe Session API.................................................................

        app.patch("/orders/:id/stripe", async (req, res) => {
            try {
                const { id } = req.params;
                const { userId, stripeSessionId } = req.body;

                if (!userId || !stripeSessionId) {
                    return res.status(400).send({
                        success: false,
                        message: "userId and stripeSessionId are required",
                    });
                }

                const result = await ordersCollection.updateOne(
                    {
                        _id: new ObjectId(id),
                        userId: userId,
                    },
                    {
                        $set: {
                            stripeSessionId: stripeSessionId,
                            updatedAt: new Date(),
                        },
                    }
                );

                res.send({
                    success: true,
                    message: "Stripe session ID saved",
                    result,
                });
            } catch (error) {
                console.error("Update Stripe session error:", error);

                res.status(500).send({
                    success: false,
                    message: "Failed to update order",
                    error: error.message,
                });
            }
        });

        // .......................................................Payment Complete API.................................................................

        app.patch("/orders/:id/payment", async (req, res) => {
            try {
                const { id } = req.params;

                const {
                    userId,
                    paymentStatus,
                    stripePaymentIntentId,
                } = req.body;

                if (!userId) {
                    return res.status(400).send({
                        success: false,
                        message: "userId is required",
                    });
                }

                const result = await ordersCollection.updateOne(
                    {
                        _id: new ObjectId(id),
                        userId: userId,
                    },
                    {
                        $set: {
                            paymentStatus:
                                paymentStatus || "paid",

                            deliveryStatus: "pending",

                            stripePaymentIntentId:
                                stripePaymentIntentId || null,

                            paidAt: new Date(),

                            updatedAt: new Date(),
                        },
                    }
                );

                res.send({
                    success: true,
                    message: "Payment status updated",
                    result,
                });
            } catch (error) {
                console.error("Payment update error:", error);

                res.status(500).send({
                    success: false,
                    message: "Failed to update payment",
                    error: error.message,
                });
            }
        });

        // ..........................................................Delete single book data by Admin api.......................................................................
        app.delete("/books/:id", async (req, res) => {
            const id = req.params.id;

            const result = await booksCollection.deleteOne({
                _id: new ObjectId(id),
            });

            res.send(result);
        });





        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('You server is running well with MongoDB!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})