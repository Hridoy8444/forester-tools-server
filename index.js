const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
var jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;


//use middleware
const corsConfig = {
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}
app.use(cors(corsConfig))
app.options("*", cors(corsConfig))
app.use(express.json())
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept,authorization")
    next()
})



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.t3wydbn.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// verify jwt
function verifyJWT(req, res, next) {
    // console.log('abc');
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next();
    });
}

async function run() {
    try {
        await client.connect();
        const toolCollection = client.db('manufacturer-website').collection('tools');
        const userCollection = client.db('manufacturer-website').collection('users');
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
            // const decodedEmail = req.email;
            if (email) {
                const query = { email: email };
                const orders = await orderCollection.find(query).toArray();
                return res.send(orders);
            } else {
                return res.status(403).send({ message: 'Forbidden Access' })
            }

        });



        app.get('/order/:id', verifyJWT, async (req, res) => {
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

        
        app.post('/create-payment-intent', verifyJWT, async (req, res) => {
            const service = req.body;
            const price = service.amount;
            
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });
            res.send({ client: paymentIntent.client_secret })
        })

        //  users
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin });
        })


      

        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,

            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const accessToken = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
            res.send({ success: true, result, accessToken });


        });
        app.get('/user', verifyJWT, async (req, res) => {
            const user = await userCollection.find().toArray();
            res.send(user);
        });

        app.put('/user/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;

            const filter = { email: email };

            const updateDoc = {
                $set: { role: 'admin' },

            };
            const result = await userCollection.updateOne(filter, updateDoc);

            res.send(result);

        });

        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,

            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const accessToken = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
            res.send({ result, accessToken });

        });

        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            res.send(user);
        })
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