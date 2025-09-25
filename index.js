
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
//     const parcelCollection = client.db('mediCare').collection('parcels');

//     // GET all medicines
//     app.get('/medicine', async (req, res) => {
//       try {
//         const { category, sellerEmail } = req.query;
//         let query = {};
//         if (category) query.category = category.toLowerCase();
//         if (sellerEmail) query.sellerEmail = sellerEmail;
//         const result = await medicineCollection.find(query).toArray();
//         res.send(result);
//       } catch (error) {
//         res.status(500).send({ error: error.message });
//       }
//     });

//     // GET single medicine by ID
//     app.get('/medicine/:id', async (req, res) => {
//       try {
//         const medicine = await medicineCollection.findOne({ _id: new ObjectId(req.params.id) });
//         if (!medicine) return res.status(404).send({ message: 'Medicine not found' });
//         res.send(medicine);
//       } catch (error) {
//         res.status(500).send({ message: 'Server error', error });
//       }
//     });

//     // POST new medicine
//     app.post('/medicine', async (req, res) => {
//       try {
//         const newMedicine = req.body;

//         if (!newMedicine.sellerEmail) {
//           return res.status(400).send({ message: "sellerEmail is required" });
//         }

//         newMedicine.createdAt = new Date().toISOString();
//         const result = await medicineCollection.insertOne(newMedicine);
//         res.send(result);
//       } catch (error) {
//         res.status(500).send({ error: error.message });
//       }
//     });

//     // UPDATE medicine
//     app.put('/medicine/:id', async (req, res) => {
//       try {
//         const id = req.params.id;
//         const updatedData = req.body;

//         if (updatedData._id) delete updatedData._id;

//         const result = await medicineCollection.updateOne(
//           { _id: new ObjectId(id) },
//           { $set: updatedData }
//         );

//         if (result.matchedCount === 0) {
//           return res.status(404).send({ message: "Medicine not found" });
//         }

//         res.send({ message: "Medicine updated successfully" });
//       } catch (error) {
//         console.error("PUT /medicine/:id error:", error);
//         res.status(500).send({ message: "Failed to update medicine", error: error.message });
//       }
//     });

//     // DELETE medicine
//     app.delete('/medicine/:id', async (req, res) => {
//       try {
//         const result = await medicineCollection.deleteOne({ _id: new ObjectId(req.params.id) });
//         if (result.deletedCount === 0) return res.status(404).send({ message: "Medicine not found" });
//         res.send({ message: "Medicine deleted successfully" });
//       } catch (error) {
//         res.status(500).send({ error: error.message });
//       }
//     });

//     // Parcels
//     app.get('/parcels', async (req, res) => {
//       try {
//         const result = await parcelCollection.find().sort({ createdAt: -1 }).toArray();
//         res.send(result);
//       } catch (error) {
//         res.status(500).send({ error: error.message });
//       }
//     });

//     app.post('/parcels', async (req, res) => {
//       try {
//         const parcel = { ...req.body, createdAt: new Date() };
//         const result = await parcelCollection.insertOne(parcel);
//         res.send(result);
//       } catch (error) {
//         res.status(500).send({ error: error.message });
//       }
//     });

//     console.log('✅ MongoDB connected successfully!');
//   } finally {
//     // keep client open
//   }
// }

// run().catch(console.dir);

// app.get('/', (req, res) => res.send('medicare server is running'));
// app.listen(port, () => console.log(`🚀 Server running on port ${port}`));






// index.js
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const admin = require("firebase-admin");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());


const serviceAccount = require("./firebase-admin.key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// MongoDB setup
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
    console.log("✅ MongoDB connected successfully!");

    const db = client.db("mediCare");
    const usersCollection = db.collection("users");
    const medicineCollection = db.collection("medicine");
    const parcelCollection = db.collection("parcels");

    // -------------------------
    // Authentication middleware
    // -------------------------
    // verifyToken: validates Firebase ID token from Authorization header "Bearer <idToken>"
    const verifyToken = async (req, res, next) => {
      const authHeader = req.headers?.authorization;
      if (!authHeader) {
        return res.status(401).send({ message: "Unauthorized access: missing Authorization header" });
      }

      const parts = authHeader.split(" ");
      if (parts.length !== 2 || parts[0] !== "Bearer") {
        return res.status(401).send({ message: "Unauthorized access: malformed Authorization header" });
      }

      const idToken = parts[1];
      if (!idToken) {
        return res.status(401).send({ message: "Unauthorized access: missing token" });
      }

      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        // decodedToken contains uid, email, etc.
        req.decoded = decodedToken;
        next();
      } catch (err) {
        console.error("Token verification failed:", err?.message || err);
        return res.status(403).send({ message: "Forbidden access: invalid or expired token" });
      }
    };

    // -------------------------
    // Authorization helpers (use inside route handlers)
    // -------------------------
    // verifyAdmin - checks the decoded token's email against usersCollection role
    const verifyAdmin = async (req, res, next) => {
      try {
        const requesterEmail = req.decoded?.email;
        if (!requesterEmail) return res.status(403).send({ message: "Forbidden access" });

        const requester = await usersCollection.findOne({ email: requesterEmail });
        if (!requester || requester.role !== "admin") {
          return res.status(403).send({ message: "Forbidden: admin access required" });
        }
        next();
      } catch (err) {
        console.error("verifyAdmin error:", err);
        res.status(500).send({ message: "Server error" });
      }
    };

    // verifySellerOrAdmin - ensures requester is either seller (and matches sellerEmail) or admin
    const verifySellerOrAdmin = async (req, res, next) => {
      try {
        const requesterEmail = req.decoded?.email;
        if (!requesterEmail) return res.status(403).send({ message: "Forbidden access" });

        const requester = await usersCollection.findOne({ email: requesterEmail });
        if (!requester) return res.status(403).send({ message: "Forbidden access" });

        // admin allowed
        if (requester.role === "admin") return next();

        // seller allowed if their email matches sellerEmail supplied in body/query/path
        // We'll attach requester to req for later usage
        req.requester = requester;
        if (requester.role === "seller") return next();

        return res.status(403).send({ message: "Forbidden: seller or admin required" });
      } catch (err) {
        console.error("verifySellerOrAdmin error:", err);
        res.status(500).send({ message: "Server error" });
      }
    };

    // -----------------
    // USERS endpoints
    // -----------------
    // Create user (open) - this is invoked after successful Firebase registration.
    // If you want to prevent duplicates here as well, we check existingUser.
    app.post("/users", async (req, res) => {
      try {
        const { email, name, photoURL, role } = req.body;
        if (!email) return res.status(400).send({ error: "Email is required" });

        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
          // Keep idempotent: if user exists, return it (do not overwrite role).
          return res.send({ message: "User already exists", user: existingUser });
        }

        const newUser = {
          email,
          name: name || null,
          photoURL: photoURL || null,
          role: role || "user",
          createdAt: new Date(),
          lastLogin: new Date(),
        };

        const result = await usersCollection.insertOne(newUser);
        res.send({ message: "User created", user: newUser, insertedId: result.insertedId });
      } catch (err) {
        console.error("POST /users error:", err);
        res.status(500).send({ error: err.message });
      }
    });

    // Promote user to admin (protected: only existing admin can promote)
    // Usage: PUT /users/admin/:email  (requires Authorization: Bearer <idToken> of an admin)
    app.put("/users/admin/:email", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const emailToPromote = req.params.email;
        const result = await usersCollection.updateOne(
          { email: emailToPromote },
          { $set: { role: "admin" } },
          { upsert: false }
        );
        if (result.matchedCount === 0) return res.status(404).send({ message: "User not found" });
        res.send({ message: "User promoted to admin" });
      } catch (err) {
        console.error("PUT /users/admin/:email error:", err);
        res.status(500).send({ error: err.message });
      }
    });

    // Get user by email (protected: user or admin can fetch)
    // Example usage: GET /users/:email  (if requester requests other user's data, admin allowed)
    app.get("/users/:email", verifyToken, async (req, res) => {
      try {
        const requesterEmail = req.decoded?.email;
        const targetEmail = req.params.email;

        // allow if requester is admin OR requester email === targetEmail
        const requester = await usersCollection.findOne({ email: requesterEmail });
        if (!requester) return res.status(403).send({ message: "Forbidden access" });

        if (requester.role !== "admin" && requesterEmail !== targetEmail) {
          return res.status(403).send({ message: "Forbidden: cannot access other user's data" });
        }

        const user = await usersCollection.findOne({ email: targetEmail });
        if (!user) return res.status(404).send({ message: "User not found" });

        res.send(user);
      } catch (err) {
        console.error("GET /users/:email error:", err);
        res.status(500).send({ error: err.message });
      }
    });

    // -----------------
    // MEDICINE endpoints
    // -----------------
    // Public: list medicines with optional filters
    app.get("/medicine", async (req, res) => {
      try {
        const { category, sellerEmail } = req.query;
        const query = {};
        if (category) query.category = category.toLowerCase();
        if (sellerEmail) query.sellerEmail = sellerEmail;
        const result = await medicineCollection.find(query).toArray();
        res.send(result);
      } catch (err) {
        console.error("GET /medicine error:", err);
        res.status(500).send({ error: err.message });
      }
    });

    // Public: get single medicine
    app.get("/medicine/:id", async (req, res) => {
      try {
        const medicine = await medicineCollection.findOne({ _id: new ObjectId(req.params.id) });
        if (!medicine) return res.status(404).send({ message: "Medicine not found" });
        res.send(medicine);
      } catch (err) {
        console.error("GET /medicine/:id error:", err);
        res.status(500).send({ message: "Server error", error: err.message });
      }
    });

    // Create new medicine (protected: seller or admin)
    // The seller should be authenticated and sellerEmail should match their email
    app.post("/medicine", verifyToken, verifySellerOrAdmin, async (req, res) => {
      try {
        const newMedicine = req.body;
        if (!newMedicine.sellerEmail) {
          return res.status(400).send({ message: "sellerEmail is required" });
        }

        // If requester is seller, ensure they are creating with their own sellerEmail
        const requester = await usersCollection.findOne({ email: req.decoded.email });
        if (requester.role === "seller" && requester.email !== newMedicine.sellerEmail) {
          return res.status(403).send({ message: "Forbidden: sellers can only create their own medicines" });
        }

        newMedicine.createdAt = new Date();
        const result = await medicineCollection.insertOne(newMedicine);
        res.send({ message: "Medicine created", insertedId: result.insertedId });
      } catch (err) {
        console.error("POST /medicine error:", err);
        res.status(500).send({ error: err.message });
      }
    });

    // Update medicine (protected: seller or admin)
    app.put("/medicine/:id", verifyToken, verifySellerOrAdmin, async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;
        if (updatedData._id) delete updatedData._id;

        // ensure seller permission if not admin
        const existing = await medicineCollection.findOne({ _id: new ObjectId(id) });
        if (!existing) return res.status(404).send({ message: "Medicine not found" });

        const requester = await usersCollection.findOne({ email: req.decoded.email });
        if (requester.role === "seller" && requester.email !== existing.sellerEmail) {
          return res.status(403).send({ message: "Forbidden: sellers can only update their own medicines" });
        }

        await medicineCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedData });
        res.send({ message: "Medicine updated successfully" });
      } catch (err) {
        console.error("PUT /medicine/:id error:", err);
        res.status(500).send({ message: "Failed to update medicine", error: err.message });
      }
    });

    // Delete medicine (protected: seller or admin)
    app.delete("/medicine/:id", verifyToken, verifySellerOrAdmin, async (req, res) => {
      try {
        const id = req.params.id;
        const existing = await medicineCollection.findOne({ _id: new ObjectId(id) });
        if (!existing) return res.status(404).send({ message: "Medicine not found" });

        const requester = await usersCollection.findOne({ email: req.decoded.email });
        if (requester.role === "seller" && requester.email !== existing.sellerEmail) {
          return res.status(403).send({ message: "Forbidden: sellers can only delete their own medicines" });
        }

        const result = await medicineCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) return res.status(404).send({ message: "Medicine not found" });
        res.send({ message: "Medicine deleted successfully" });
      } catch (err) {
        console.error("DELETE /medicine/:id error:", err);
        res.status(500).send({ error: err.message });
      }
    });

    // -----------------
    // PARCEL endpoints
    // -----------------
    // List parcels (protected: admin only)
    app.get("/parcels", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const result = await parcelCollection.find().sort({ createdAt: -1 }).toArray();
        res.send(result);
      } catch (err) {
        console.error("GET /parcels error:", err);
        res.status(500).send({ error: err.message });
      }
    });

    // Create parcel (open or protected if you want) - here we allow authenticated users
    app.post("/parcels", verifyToken, async (req, res) => {
      try {
        const parcel = { ...req.body, createdAt: new Date(), createdBy: req.decoded?.email || null };
        const result = await parcelCollection.insertOne(parcel);
        res.send({ message: "Parcel created", insertedId: result.insertedId });
      } catch (err) {
        console.error("POST /parcels error:", err);
        res.status(500).send({ error: err.message });
      }
    });

    // Root
    app.get("/", (req, res) => res.send("🚀 Medicare backend running with secure routes"));

    // Start server
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  } catch (err) {
    console.error("Run error:", err);
  }
}

run().catch((err) => console.error("run().catch:", err));
