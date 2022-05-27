const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;


//use middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.t3wydbn.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const toolCollection = client.db('manufacturer-website').collection('tools');
        const orderCollection = client.db('manufacturer-website').collection('orders');
        const reviewCollection = client.db('manufacturer-website').collection('reviews');
        console.log('connected');

        app.post('/tool', async (req, res) => {
            const tool = req.body;
            const result = toolCollection.insertOne(tool);
            res.send({ success: true, result });

        });

        app.get('/tool', async (req, res) => {
            const query = {}
            const cursor = toolCollection.find(query);
            const tools = await cursor.toArray();
            res.send(tools);
        });
        app.get('/tool/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const tools = await toolCollection.findOne(query);
            res.send(tools);
        });


         // order
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = orderCollection.insertOne(order);
            res.send({ success: true, result });


        });
        app.get('/order', async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const orders = await orderCollection.find(query).toArray();
                return res.send(orders);
            } else {
                return res.status(403).send({ message: 'Forbidden Access' })
            }

        });

       

        app.get('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const order = await orderCollection.findOne(query);
            res.send(order);
        });

        app.delete('/order/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(filter);
            res.send(result);
        });

        app.patch('/order/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    status: 'paid',
                    transactionId: payment.transactionId
                }
            }
            const result = await paymentCollection.insertOne(payment);
            const updatedOrder = await orderCollection.updateOne(filter, updatedDoc)
            res.send(updatedDoc);

        });

        //review
        app.post('/reviews', async (req, res) => {
            const userReviews = req.body;
            const result = reviewCollection.insertOne(userReviews);
            res.send({ success: true, result });

        });
        app.get('/reviews', async (req, res) => {
            const query = {};
            const userReviews = await reviewCollection.find(query).toArray();
            res.send(userReviews);
        });
        
    }
    finally {

    }
}




run().catch(console.dir);


//db user1

app.get('/', (req, res) => {
    res.send('Running My server');
});

app.listen(port, () => {
    console.log('Listening to port', port);
})