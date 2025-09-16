// const express = require('express');
// const cors = require('cors');
// const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// require('dotenv').config();

// const app = express();
// const port = process.env.PORT || 3000;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // MongoDB connection
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@omicronx.oj2lwua.mongodb.net/?retryWrites=true&w=majority`;
// const client = new MongoClient(uri, {
//   serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
// });

// async function run() {
//   try {
//     await client.connect();
//     const medicineCollection = client.db('mediCare').collection('medicine');

//     // Get all medicines or filter by category
//     app.get('/medicine', async (req, res) => {
//       try {
//         const category = req.query.category;
//         let query = {};
//         if (category) query = { category: category.toLowerCase() };
//         const result = await medicineCollection.find(query).toArray();
//         res.send(result);
//       } catch (error) {
//         res.status(500).send({ error: error.message });
//       }
//     });


    


//     // Get single medicine by MongoDB _id
//     app.get('/medicine/:id', async (req, res) => {
//       try {
//         const medicine = await medicineCollection.findOne({ _id: new ObjectId(req.params.id) });
//         if (!medicine) return res.status(404).send({ message: 'Medicine not found' });
//         res.send(medicine);
//       } catch (error) {
//         res.status(500).send({ message: 'Server error', error });
//       }
//     });



//     //seller API


//     app.post('/medicine', async (req, res) => {
//   const newMedicine = req.body;
//   const result = await medicineCollection.insertOne(newMedicine);
//   res.send(result);
// });


//     console.log('MongoDB connected successfully!');
//   } finally {
//     // client will stay connected
//   }
// }

// run().catch(console.dir);

// app.get('/', (req, res) => res.send('medicare server is running'));

// app.listen(port, () => console.log(`Server running on port ${port}`));








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



    //seller API


    app.post('/medicine', async (req, res) => {
  const newMedicine = req.body;
  const result = await medicineCollection.insertOne(newMedicine);
  res.send(result);
});





    console.log('MongoDB connected successfully!');
  } finally {
    // client will stay connected
  }
}

run().catch(console.dir);

app.get('/', (req, res) => res.send('medicare server is running'));

app.listen(port, () => console.log(`Server running on port ${port}`));
