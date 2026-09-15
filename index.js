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



        app.post("/librarian/add-book", async (req, res) => {
            const data = req.body;
            const result = await booksCollection.insertOne({ ...data});
            res.send(result)
        })


        app.get("/librarian/add-book", async (req, res) => {
            const result = await booksCollection.find().toArray();
            res.send(result)
        })

        app.get("/librarian/add-book", async (req, res) => {
            const { userId } = req.query;
            const result = await booksCollection.find({userId: userId}).toArray();
            res.send(result)
        })

        app.delete("/librarian/delete-book", async (req, res) => {
            const { bookId, userId } = req.query;

            const result = await booksCollection.deleteOne({
                _id: new ObjectId(bookId),
                userId: userId,
            });

            res.send(result);
        });

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

        

        app.get("/librarian/add-book/:id", async (req, res) => {
            const { id } = req.params;

            const result = await booksCollection.findOne({_id: new ObjectId(id),
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