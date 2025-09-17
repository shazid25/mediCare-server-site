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





const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@omicronx.oj2lwua.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const medicineCollection = client.db("mediCare").collection("medicine");

    // ✅ Get all medicines (optionally filter by category)
    app.get("/medicine", async (req, res) => {
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

    // ✅ Get all medicines by seller
    app.get("/medicine/seller/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const result = await medicineCollection
          .find({ sellerEmail: email })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // ✅ Get single medicine by ID
    app.get("/medicine/:id", async (req, res) => {
      try {
        const medicine = await medicineCollection.findOne({
          _id: new ObjectId(req.params.id),
        });
        if (!medicine)
          return res.status(404).send({ message: "Medicine not found" });
        res.send(medicine);
      } catch (error) {
        res.status(500).send({ message: "Server error", error });
      }
    });

    // ✅ Seller posts new medicine
    app.post("/medicine", async (req, res) => {
      try {
        const newMedicine = req.body;
        if (!newMedicine.sellerEmail) {
          return res
            .status(400)
            .send({ message: "sellerEmail is required to post medicine" });
        }
        const result = await medicineCollection.insertOne(newMedicine);
        res.send({ message: "Medicine added successfully", result });
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // ✅ Update medicine (seller can only update his own medicine)
    app.put("/medicine/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { sellerEmail, ...updateData } = req.body;

        if (!sellerEmail)
          return res.status(400).send({ message: "sellerEmail required" });

        const filter = { _id: new ObjectId(id), sellerEmail };
        const updateDoc = { $set: updateData };

        const result = await medicineCollection.updateOne(filter, updateDoc);

        if (result.matchedCount === 0) {
          return res
            .status(403)
            .send({ message: "Not authorized to update this medicine" });
        }

        res.send({ message: "Updated successfully", result });
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // ✅ Delete medicine (seller can only delete his own medicine)
    app.delete("/medicine/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const sellerEmail = req.query.email;

        if (!sellerEmail)
          return res.status(400).send({ message: "sellerEmail required" });

        const filter = { _id: new ObjectId(id), sellerEmail };
        const result = await medicineCollection.deleteOne(filter);

        if (result.deletedCount === 0) {
          return res
            .status(403)
            .send({ message: "Not authorized to delete this medicine" });
        }

        res.send({ message: "Deleted successfully", result });
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    console.log("✅ MongoDB connected successfully!");
  } finally {
    // client will stay connected
  }
}

run().catch(console.dir);

// Root endpoint
app.get("/", (req, res) => res.send("MediCare server is running ✅"));

// Start server
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));