const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
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
        console.log('connected');

        app.get('/tool', async (req, res) => {
            const query = {}
            const cursor = toolCollection.find(query);
            const tools = await cursor.toArray();
            res.send(tools);
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