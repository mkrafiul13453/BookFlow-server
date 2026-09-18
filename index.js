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