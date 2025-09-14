// const express = require('express')
// const cors = require('cors')
// const app = express();
// const port = process.env.PORT || 3000;
// const { MongoClient, ServerApiVersion } = require('mongodb');
//     const { ObjectId } = require('mongodb');

// require ('dotenv').config();

// //middleware

// app.use(cors());
// app.use(express.json());



// // const uri = "mongodb+srv://<db_username>:<db_password>@omicronx.oj2lwua.mongodb.net/?retryWrites=true&w=majority&appName=OmicronX";
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@omicronx.oj2lwua.mongodb.net/?retryWrites=true&w=majority&appName=OmicronX`;


// // Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   }
// });

// async function run() {
//   try {
//     // Connect the client to the server	(optional starting in v4.7)
//     await client.connect();
   
   
//     const medicineCollection = client.db('mediCare').collection('medicine');
//     //medicine api
//     app.get('/medicine', async(req, res) =>{
//         const cursor = medicineCollection.find();
//         const result = await cursor.toArray();
//         res.send(result);
//     })
    
  


//  //serch by category
//     app.get('/medicine', async (req, res) => {
//   try {
//     const category = req.query.category; // ?category=Cardiology
//     let query = {};

//     if (category) {
//       query = { category: category.toLowerCase() }; // store lowercase in DB
//     }

//     const result = await medicineCollection.find(query).toArray();
//     res.send(result);
//   } catch (error) {
//     res.status(500).send({ error: error.message });
//   }
// });


//     // Send a ping to confirm a successful connection
//     await client.db("admin").command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } finally {
//     // Ensures that the client will close when you finish/error
//     // await client.close();
//   }
// }
// run().catch(console.dir);





// app.get('/', (req, res) => {
//     res.send('medicare server is running')
// })

// app.listen(port, () => {
//     console.log(`medicare server is running on port: ${port}`);
// })






// server.js
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@omicronx.oj2lwua.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});

async function run() {
  try {
    await client.connect();
    const medicineCollection = client.db('mediCare').collection('medicine');

    // Get all medicines or filter by category
    app.get('/medicine', async (req, res) => {
      try {
        const category = req.query.category;
        let query = {};
        if (category) query = { category: category.toLowerCase() };
        const result = await medicineCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    // Get single medicine by MongoDB _id
    app.get('/medicine/:id', async (req, res) => {
      try {
        const medicine = await medicineCollection.findOne({ _id: new ObjectId(req.params.id) });
        if (!medicine) return res.status(404).send({ message: 'Medicine not found' });
        res.send(medicine);
      } catch (error) {
        res.status(500).send({ message: 'Server error', error });
      }
    });

    console.log('MongoDB connected successfully!');
  } finally {
    // client will stay connected
  }
}

run().catch(console.dir);

app.get('/', (req, res) => res.send('medicare server is running'));

app.listen(port, () => console.log(`Server running on port ${port}`));
