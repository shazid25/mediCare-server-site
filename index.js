// // // index.js
// // const express = require("express");
// // const cors = require("cors");
// // const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// // const admin = require("firebase-admin");
// // require("dotenv").config();

// // const app = express();
// // const port = process.env.PORT || 3000;

// // // Middlewares
// // app.use(cors());
// // app.use(express.json());

// // // Firebase Admin SDK
// // const serviceAccount = require("./firebase-admin.key.json");
// // admin.initializeApp({
// //   credential: admin.credential.cert(serviceAccount),
// // });

// // // MongoDB setup
// // const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@omicronx.oj2lwua.mongodb.net/?retryWrites=true&w=majority`;
// // const client = new MongoClient(uri, {
// //   serverApi: {
// //     version: ServerApiVersion.v1,
// //     strict: true,
// //     deprecationErrors: true,
// //   },
// // });

// // async function run() {
// //   try {
// //     await client.connect();
// //     console.log("✅ MongoDB connected successfully!");

// //     const db = client.db("mediCare");
// //     const usersCollection = db.collection("users");
// //     const medicineCollection = db.collection("medicine");
// //     const parcelCollection = db.collection("parcels");
// //     const applicationsCollection = db.collection("sellerApplications");

// //     // Seed first admin if not exists
// //     const existingAdmin = await usersCollection.findOne({ email: "jorina@gmail.com" });
// //     if (!existingAdmin) {
// //       await usersCollection.insertOne({
// //         email: "jorina@gmail.com",
// //         name: "Jorina",
// //         role: "admin",
// //         createdAt: new Date(),
// //         lastLogin: new Date(),
// //         hasPendingSellerApplication: false,
// //       });
// //       console.log("🌟 Seeded admin: jorina@gmail.com");
// //     }

// //     // -------------------------
// //     // Authentication middleware
// //     // -------------------------
// //     const verifyToken = async (req, res, next) => {
// //       const authHeader = req.headers?.authorization;
// //       if (!authHeader) {
// //         return res.status(401).send({ success: false, message: "Unauthorized: missing Authorization header" });
// //       }

// //       const parts = authHeader.split(" ");
// //       if (parts.length !== 2 || parts[0] !== "Bearer") {
// //         return res.status(401).send({ success: false, message: "Unauthorized: malformed Authorization header" });
// //       }

// //       const idToken = parts[1];
// //       try {
// //         const decodedToken = await admin.auth().verifyIdToken(idToken);
// //         req.decoded = decodedToken;
// //         next();
// //       } catch (err) {
// //         console.error("Token verification failed:", err?.message || err);
// //         return res.status(403).send({ success: false, message: "Forbidden: invalid or expired token" });
// //       }
// //     };

// //     // -------------------------
// //     // Role-based middleware
// //     // -------------------------
// //     const checkRole = (allowedRoles) => {
// //       return async (req, res, next) => {
// //         const requesterEmail = req.decoded?.email;
// //         if (!requesterEmail) return res.status(403).send({ success: false, message: "Forbidden: missing email" });

// //         const requester = await usersCollection.findOne({ email: requesterEmail });
// //         if (!requester) return res.status(403).send({ success: false, message: "User not found" });

// //         if (allowedRoles.includes(requester.role)) {
// //           req.user = requester;
// //           return next();
// //         }

// //         return res.status(403).send({
// //           success: false,
// //           message: `Forbidden: ${allowedRoles.join(" or ")} required. Your role: ${requester.role}`,
// //         });
// //       };
// //     };

// //     // -----------------
// //     // SELLER APPLICATIONS
// //     // -----------------

// //     // POST seller application (user)
// //     app.post("/seller-applications", verifyToken, async (req, res) => {
// //       try {
// //         const sellerApplication = {
// //           ...req.body,
// //           userEmail: req.decoded.email,
// //           status: "pending",
// //           appliedAt: new Date(),
// //           reviewedAt: null,
// //           reviewedBy: null,
// //           notes: "",
// //         };

// //         const existingApplication = await applicationsCollection.findOne({
// //           userEmail: req.decoded.email,
// //           status: "pending",
// //         });

// //         if (existingApplication) {
// //           return res.status(400).json({ success: false, message: "You already have a pending seller application" });
// //         }

// //         const result = await applicationsCollection.insertOne(sellerApplication);

// //         await usersCollection.updateOne(
// //           { email: req.decoded.email },
// //           { $set: { hasPendingSellerApplication: true, lastApplicationDate: new Date() } }
// //         );

// //         res.status(201).json({ success: true, message: "Seller application submitted", data: { applicationId: result.insertedId } });
// //       } catch (error) {
// //         console.error("Error submitting seller application:", error);
// //         res.status(500).json({ success: false, message: "Failed to submit application" });
// //       }
// //     });

// //     // GET all seller applications (admin)
// //     app.get("/admin/seller-applications", verifyToken, checkRole(["admin"]), async (req, res) => {
// //       try {
// //         const applications = await applicationsCollection.find().sort({ appliedAt: -1 }).toArray();
// //         res.send({ success: true, data: applications });
// //       } catch (err) {
// //         console.error("GET /admin/seller-applications error:", err);
// //         res.status(500).send({ success: false, message: "Failed to fetch applications" });
// //       }
// //     });

// //     // PATCH application (approve/reject) (admin)
// //     app.patch("/admin/seller-applications/:id", verifyToken, checkRole(["admin"]), async (req, res) => {
// //       try {
// //         const { id } = req.params;
// //         const { action, notes } = req.body;

// //         if (!["approve", "reject"].includes(action)) {
// //           return res.status(400).send({ success: false, message: "Invalid action" });
// //         }

// //         const application = await applicationsCollection.findOne({ _id: new ObjectId(id) });
// //         if (!application) return res.status(404).send({ success: false, message: "Application not found" });

// //         const updatedStatus = action === "approve" ? "approved" : "rejected";

// //         await applicationsCollection.updateOne(
// //           { _id: new ObjectId(id) },
// //           { $set: { status: updatedStatus, reviewedAt: new Date(), reviewedBy: req.decoded.email, notes: notes || "" } }
// //         );

// //         // Update user's pending application status and role if approved
// //         const userUpdate = { hasPendingSellerApplication: false };
// //         if (updatedStatus === "approved") {
// //           userUpdate.role = "seller"; // <-- promote to seller
// //         }

// //         await usersCollection.updateOne(
// //           { email: application.userEmail },
// //           { $set: userUpdate }
// //         );

// //         res.send({ success: true, message: `Application ${updatedStatus}` });
// //       } catch (err) {
// //         console.error("PATCH /admin/seller-applications/:id error:", err);
// //         res.status(500).send({ success: false, message: "Failed to update application" });
// //       }
// //     });

// //     // DELETE application (admin)
// //     app.delete("/admin/seller-applications/:id", verifyToken, checkRole(["admin"]), async (req, res) => {
// //       try {
// //         const { id } = req.params;
// //         const application = await applicationsCollection.findOne({ _id: new ObjectId(id) });
// //         if (!application) return res.status(404).send({ success: false, message: "Application not found" });

// //         await applicationsCollection.deleteOne({ _id: new ObjectId(id) });

// //         // Update user's pending application status
// //         await usersCollection.updateOne(
// //           { email: application.userEmail },
// //           { $set: { hasPendingSellerApplication: false } }
// //         );

// //         res.send({ success: true, message: "Application deleted" });
// //       } catch (err) {
// //         console.error("DELETE /admin/seller-applications/:id error:", err);
// //         res.status(500).send({ success: false, message: "Failed to delete application" });
// //       }
// //     });

// //     // -----------------
// //     // USERS endpoints
// //     // -----------------
// //     app.post("/users", async (req, res) => {
// //       try {
// //         const { email, name, photoURL, role } = req.body;
// //         if (!email) return res.status(400).send({ success: false, error: "Email is required" });

// //         const existingUser = await usersCollection.findOne({ email });
// //         if (existingUser) {
// //           await usersCollection.updateOne({ email }, { $set: { lastLogin: new Date() } });
// //           return res.send({ success: true, message: "User already exists", data: { user: existingUser } });
// //         }

// //         const newUser = {
// //           email,
// //           name: name || null,
// //           photoURL: photoURL || null,
// //           role: role || "user",
// //           createdAt: new Date(),
// //           lastLogin: new Date(),
// //           hasPendingSellerApplication: false,
// //         };

// //         const result = await usersCollection.insertOne(newUser);
// //         res.send({ success: true, message: "User created", data: { user: newUser, insertedId: result.insertedId } });
// //       } catch (err) {
// //         console.error("POST /users error:", err);
// //         res.status(500).send({ success: false, error: err.message });
// //       }
// //     });

// //     app.get("/users/me/role", verifyToken, async (req, res) => {
// //       try {
// //         const user = await usersCollection.findOne({ email: req.decoded.email });
// //         if (!user) return res.status(404).send({ success: false, message: "User not found" });

// //         res.send({
// //           success: true,
// //           data: {
// //             role: user.role,
// //             email: user.email,
// //             name: user.name,
// //             photoURL: user.photoURL,
// //             hasPendingSellerApplication: user.hasPendingSellerApplication || false,
// //           }
// //         });
// //       } catch (err) {
// //         console.error("GET /users/me/role error:", err);
// //         res.status(500).send({ success: false, error: err.message });
// //       }
// //     });


// //     // -----------------
// //     // MEDICINE endpoints
// //     // -----------------

// //     // GET all medicines
// //     app.get("/medicine", async (req, res) => {
// //       try {
// //         const medicines = await medicineCollection.find().toArray();
// //         res.send({ success: true, data: medicines });
// //       } catch (err) {
// //         console.error("GET /medicine error:", err);
// //         res.status(500).send({ success: false, error: "Failed to fetch medicines" });
// //       }
// //     });

// //     // GET medicine by ID
// //     app.get("/medicine/:id", async (req, res) => {
// //       try {
// //         const { id } = req.params;
// //         const medicine = await medicineCollection.findOne({ _id: new ObjectId(id) });
// //         if (!medicine) return res.status(404).send({ success: false, message: "Medicine not found" });
// //         res.send({ success: true, data: medicine });
// //       } catch (err) {
// //         console.error("GET /medicine/:id error:", err);
// //         res.status(500).send({ success: false, error: "Failed to fetch medicine" });
// //       }
// //     });

// //     // POST create medicine (seller/admin)
// //     app.post("/medicine", verifyToken, checkRole(["admin", "seller"]), async (req, res) => {
// //       try {
// //         const medicineData = req.body;
// //         const result = await medicineCollection.insertOne({ ...medicineData, createdAt: new Date() });
// //         res.status(201).send({ success: true, message: "Medicine added", data: { id: result.insertedId } });
// //       } catch (err) {
// //         console.error("POST /medicine error:", err);
// //         res.status(500).send({ success: false, error: "Failed to add medicine" });
// //       }
// //     });

// //     // PATCH update medicine
// //     app.patch("/medicine/:id", verifyToken, checkRole(["admin", "seller"]), async (req, res) => {
// //       try {
// //         const { id } = req.params;
// //         const updateData = req.body;
// //         const result = await medicineCollection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });
// //         if (result.matchedCount === 0) return res.status(404).send({ success: false, message: "Medicine not found" });
// //         res.send({ success: true, message: "Medicine updated" });
// //       } catch (err) {
// //         console.error("PATCH /medicine/:id error:", err);
// //         res.status(500).send({ success: false, error: "Failed to update medicine" });
// //       }
// //     });

// //     // DELETE medicine
// //     app.delete("/medicine/:id", verifyToken, checkRole(["admin", "seller"]), async (req, res) => {
// //       try {
// //         const { id } = req.params;
// //         const result = await medicineCollection.deleteOne({ _id: new ObjectId(id) });
// //         if (result.deletedCount === 0) return res.status(404).send({ success: false, message: "Medicine not found" });
// //         res.send({ success: true, message: "Medicine deleted" });
// //       } catch (err) {
// //         console.error("DELETE /medicine/:id error:", err);
// //         res.status(500).send({ success: false, error: "Failed to delete medicine" });
// //       }
// //     });


// //     // Root
// //     app.get("/", (req, res) => res.send("🚀 Medicare backend running with secure routes"));

// //     // Start server
// //     app.listen(port, () => {
// //       console.log(`🚀 Server running on port ${port}`);
// //     });

// //   } catch (err) {
// //     console.error("Run error:", err);
// //   }
// // }

// // run().catch((err) => console.error("run().catch:", err));











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

// Firebase Admin SDK
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
    const applicationsCollection = db.collection("sellerApplications");

    // Seed first admin if not exists
    const existingAdmin = await usersCollection.findOne({ email: "jorina@gmail.com" });
    if (!existingAdmin) {
      await usersCollection.insertOne({
        email: "jorina@gmail.com",
        name: "Jorina",
        role: "admin",
        createdAt: new Date(),
        lastLogin: new Date(),
        hasPendingSellerApplication: false,
      });
      console.log("🌟 Seeded admin: jorina@gmail.com");
    }

    // -------------------------
    // Authentication middleware
    // -------------------------
    const verifyToken = async (req, res, next) => {
      const authHeader = req.headers?.authorization;
      if (!authHeader) {
        return res.status(401).send({ success: false, message: "Unauthorized: missing Authorization header" });
      }

      const parts = authHeader.split(" ");
      if (parts.length !== 2 || parts[0] !== "Bearer") {
        return res.status(401).send({ success: false, message: "Unauthorized: malformed Authorization header" });
      }

      const idToken = parts[1];
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.decoded = decodedToken;
        next();
      } catch (err) {
        console.error("Token verification failed:", err?.message || err);
        return res.status(403).send({ success: false, message: "Forbidden: invalid or expired token" });
      }
    };

    // -------------------------
    // Role-based middleware
    // -------------------------
    const checkRole = (allowedRoles) => {
      return async (req, res, next) => {
        const requesterEmail = req.decoded?.email;
        if (!requesterEmail) return res.status(403).send({ success: false, message: "Forbidden: missing email" });

        const requester = await usersCollection.findOne({ email: requesterEmail });
        if (!requester) return res.status(403).send({ success: false, message: "User not found" });

        if (allowedRoles.includes(requester.role)) {
          req.user = requester;
          return next();
        }

        return res.status(403).send({
          success: false,
          message: `Forbidden: ${allowedRoles.join(" or ")} required. Your role: ${requester.role}`,
        });
      };
    };

    // -------------------------
    // Medicine ownership middleware
    // -------------------------
    const checkMedicineOwnership = async (req, res, next) => {
      try {
        const { id } = req.params;
        const userEmail = req.decoded.email;
        const user = req.user;

        // Admins can modify any medicine
        if (user.role === "admin") {
          return next();
        }

        // Validate ObjectId
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ success: false, message: "Invalid medicine ID" });
        }

        const medicine = await medicineCollection.findOne({ 
          _id: new ObjectId(id) 
        });

        if (!medicine) {
          return res.status(404).send({ success: false, message: "Medicine not found" });
        }

        // Check if seller owns this medicine
        if (medicine.sellerEmail !== userEmail) {
          return res.status(403).send({ 
            success: false, 
            message: "Forbidden: You can only edit your own medicines" 
          });
        }

        req.medicine = medicine;
        next();
      } catch (err) {
        console.error("Medicine ownership check error:", err);
        return res.status(500).send({ success: false, message: "Server error during ownership verification" });
      }
    };

    // -----------------
    // SELLER APPLICATIONS
    // -----------------

    // POST seller application (user)
    app.post("/seller-applications", verifyToken, async (req, res) => {
      try {
        const sellerApplication = {
          ...req.body,
          userEmail: req.decoded.email,
          status: "pending",
          appliedAt: new Date(),
          reviewedAt: null,
          reviewedBy: null,
          notes: "",
        };

        const existingApplication = await applicationsCollection.findOne({
          userEmail: req.decoded.email,
          status: "pending",
        });

        if (existingApplication) {
          return res.status(400).json({ success: false, message: "You already have a pending seller application" });
        }

        const result = await applicationsCollection.insertOne(sellerApplication);

        await usersCollection.updateOne(
          { email: req.decoded.email },
          { $set: { hasPendingSellerApplication: true, lastApplicationDate: new Date() } }
        );

        res.status(201).json({ success: true, message: "Seller application submitted", data: { applicationId: result.insertedId } });
      } catch (error) {
        console.error("Error submitting seller application:", error);
        res.status(500).json({ success: false, message: "Failed to submit application" });
      }
    });

    // GET all seller applications (admin)
    app.get("/admin/seller-applications", verifyToken, checkRole(["admin"]), async (req, res) => {
      try {
        const applications = await applicationsCollection.find().sort({ appliedAt: -1 }).toArray();
        res.send({ success: true, data: applications });
      } catch (err) {
        console.error("GET /admin/seller-applications error:", err);
        res.status(500).send({ success: false, message: "Failed to fetch applications" });
      }
    });

    // PATCH application (approve/reject) (admin)
    app.patch("/admin/seller-applications/:id", verifyToken, checkRole(["admin"]), async (req, res) => {
      try {
        const { id } = req.params;
        const { action, notes } = req.body;

        if (!["approve", "reject"].includes(action)) {
          return res.status(400).send({ success: false, message: "Invalid action" });
        }

        const application = await applicationsCollection.findOne({ _id: new ObjectId(id) });
        if (!application) return res.status(404).send({ success: false, message: "Application not found" });

        const updatedStatus = action === "approve" ? "approved" : "rejected";

        await applicationsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status: updatedStatus, reviewedAt: new Date(), reviewedBy: req.decoded.email, notes: notes || "" } }
        );

        // Update user's pending application status and role if approved
        const userUpdate = { hasPendingSellerApplication: false };
        if (updatedStatus === "approved") {
          userUpdate.role = "seller"; // <-- promote to seller
        }

        await usersCollection.updateOne(
          { email: application.userEmail },
          { $set: userUpdate }
        );

        res.send({ success: true, message: `Application ${updatedStatus}` });
      } catch (err) {
        console.error("PATCH /admin/seller-applications/:id error:", err);
        res.status(500).send({ success: false, message: "Failed to update application" });
      }
    });

    // DELETE application (admin)
    app.delete("/admin/seller-applications/:id", verifyToken, checkRole(["admin"]), async (req, res) => {
      try {
        const { id } = req.params;
        const application = await applicationsCollection.findOne({ _id: new ObjectId(id) });
        if (!application) return res.status(404).send({ success: false, message: "Application not found" });

        await applicationsCollection.deleteOne({ _id: new ObjectId(id) });

        // Update user's pending application status
        await usersCollection.updateOne(
          { email: application.userEmail },
          { $set: { hasPendingSellerApplication: false } }
        );

        res.send({ success: true, message: "Application deleted" });
      } catch (err) {
        console.error("DELETE /admin/seller-applications/:id error:", err);
        res.status(500).send({ success: false, message: "Failed to delete application" });
      }
    });

    // -----------------
    // USERS endpoints
    // -----------------
    app.post("/users", async (req, res) => {
      try {
        const { email, name, photoURL, role } = req.body;
        if (!email) return res.status(400).send({ success: false, error: "Email is required" });

        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
          await usersCollection.updateOne({ email }, { $set: { lastLogin: new Date() } });
          return res.send({ success: true, message: "User already exists", data: { user: existingUser } });
        }

        const newUser = {
          email,
          name: name || null,
          photoURL: photoURL || null,
          role: role || "user",
          createdAt: new Date(),
          lastLogin: new Date(),
          hasPendingSellerApplication: false,
        };

        const result = await usersCollection.insertOne(newUser);
        res.send({ success: true, message: "User created", data: { user: newUser, insertedId: result.insertedId } });
      } catch (err) {
        console.error("POST /users error:", err);
        res.status(500).send({ success: false, error: err.message });
      }
    });

    app.get("/users/me/role", verifyToken, async (req, res) => {
      try {
        const user = await usersCollection.findOne({ email: req.decoded.email });
        if (!user) return res.status(404).send({ success: false, message: "User not found" });

        res.send({
          success: true,
          data: {
            role: user.role,
            email: user.email,
            name: user.name,
            photoURL: user.photoURL,
            hasPendingSellerApplication: user.hasPendingSellerApplication || false,
          }
        });
      } catch (err) {
        console.error("GET /users/me/role error:", err);
        res.status(500).send({ success: false, error: err.message });
      }
    });

    // -----------------
    // MEDICINE endpoints
    // -----------------

    // GET all medicines - SORTED BY LATEST FIRST
    app.get("/medicine", async (req, res) => {
      try {
        // Sort by createdAt in descending order (-1) to show newest first
        const medicines = await medicineCollection.find().sort({ createdAt: -1 }).toArray();
        res.send({ success: true, data: medicines });
      } catch (err) {
        console.error("GET /medicine error:", err);
        res.status(500).send({ success: false, error: "Failed to fetch medicines" });
      }
    });

    // GET medicine by ID
    app.get("/medicine/:id", async (req, res) => {
      try {
        const { id } = req.params;
        
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ success: false, message: "Invalid medicine ID" });
        }

        const medicine = await medicineCollection.findOne({ _id: new ObjectId(id) });
        if (!medicine) {
          return res.status(404).send({ success: false, message: "Medicine not found" });
        }

        res.send({ success: true, data: medicine });
      } catch (err) {
        console.error("GET /medicine/:id error:", err);
        res.status(500).send({ success: false, error: "Failed to fetch medicine" });
      }
    });

    // GET seller's medicines - SORTED BY LATEST FIRST
    app.get("/medicine/seller/my-medicines", verifyToken, checkRole(["seller"]), async (req, res) => {
      try {
        const sellerEmail = req.decoded.email;
        // Sort by createdAt in descending order (-1) to show newest first
        const medicines = await medicineCollection.find({ sellerEmail }).sort({ createdAt: -1 }).toArray();
        res.send({ success: true, data: medicines });
      } catch (err) {
        console.error("GET /medicine/seller/my-medicines error:", err);
        res.status(500).send({ success: false, error: "Failed to fetch your medicines" });
      }
    });

    // POST create medicine (seller/admin) - WITH TIMESTAMP
    app.post("/medicine", verifyToken, checkRole(["admin", "seller"]), async (req, res) => {
      try {
        const currentTime = new Date();
        const medicineData = {
          ...req.body,
          sellerEmail: req.decoded.email, // Track which seller created this medicine
          createdAt: currentTime, // Current timestamp
          updatedAt: currentTime // Current timestamp
        };

        // Convert numeric fields
        if (medicineData.price) medicineData.price = Number(medicineData.price);
        if (medicineData.originalPrice) medicineData.originalPrice = Number(medicineData.originalPrice);
        if (medicineData.discount) medicineData.discount = Number(medicineData.discount);
        if (medicineData.stock) medicineData.stock = Number(medicineData.stock);

        const result = await medicineCollection.insertOne(medicineData);
        
        console.log(`🆕 New medicine posted by ${req.decoded.email} at ${currentTime}`);
        
        res.status(201).send({ 
          success: true, 
          message: "Medicine added successfully", 
          data: { 
            id: result.insertedId,
            createdAt: currentTime
          } 
        });
      } catch (err) {
        console.error("POST /medicine error:", err);
        res.status(500).send({ success: false, error: "Failed to add medicine" });
      }
    });

    // PUT update medicine (with ownership check)
    app.put("/medicine/:id", verifyToken, checkRole(["admin", "seller"]), checkMedicineOwnership, async (req, res) => {
      try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Remove fields that shouldn't be updated
        delete updateData._id;
        delete updateData.sellerEmail;
        delete updateData.createdAt;

        // Convert numeric fields
        if (updateData.price) updateData.price = Number(updateData.price);
        if (updateData.originalPrice) updateData.originalPrice = Number(updateData.originalPrice);
        if (updateData.discount) updateData.discount = Number(updateData.discount);
        if (updateData.stock) updateData.stock = Number(updateData.stock);

        // Add update timestamp
        updateData.updatedAt = new Date();

        const result = await medicineCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({ success: false, message: "Medicine not found" });
        }

        res.send({ 
          success: true, 
          message: "Medicine updated successfully",
          data: { modifiedCount: result.modifiedCount }
        });
      } catch (err) {
        console.error("PUT /medicine/:id error:", err);
        res.status(500).send({ success: false, error: "Failed to update medicine" });
      }
    });

    // PATCH update medicine (alternative endpoint with ownership check)
    app.patch("/medicine/:id", verifyToken, checkRole(["admin", "seller"]), checkMedicineOwnership, async (req, res) => {
      try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Remove protected fields
        delete updateData._id;
        delete updateData.sellerEmail;
        delete updateData.createdAt;

        // Convert numeric fields
        if (updateData.price) updateData.price = Number(updateData.price);
        if (updateData.originalPrice) updateData.originalPrice = Number(updateData.originalPrice);
        if (updateData.discount) updateData.discount = Number(updateData.discount);
        if (updateData.stock) updateData.stock = Number(updateData.stock);

        // Add update timestamp
        updateData.updatedAt = new Date();

        const result = await medicineCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({ success: false, message: "Medicine not found" });
        }

        res.send({ 
          success: true, 
          message: "Medicine updated successfully",
          data: { modifiedCount: result.modifiedCount }
        });
      } catch (err) {
        console.error("PATCH /medicine/:id error:", err);
        res.status(500).send({ success: false, error: "Failed to update medicine" });
      }
    });

    // DELETE medicine (with ownership check)
    app.delete("/medicine/:id", verifyToken, checkRole(["admin", "seller"]), checkMedicineOwnership, async (req, res) => {
      try {
        const { id } = req.params;

        const result = await medicineCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
          return res.status(404).send({ success: false, message: "Medicine not found" });
        }

        res.send({ 
          success: true, 
          message: "Medicine deleted successfully",
          data: { deletedCount: result.deletedCount }
        });
      } catch (err) {
        console.error("DELETE /medicine/:id error:", err);
        res.status(500).send({ success: false, error: "Failed to delete medicine" });
      }
    });

    // GET medicines with pagination and sorting options
    app.get("/medicine/sorted/:order", async (req, res) => {
      try {
        const { order } = req.params;
        let sortOption = { createdAt: -1 }; // Default: newest first

        if (order === 'oldest') {
          sortOption = { createdAt: 1 };
        } else if (order === 'price-low') {
          sortOption = { price: 1 };
        } else if (order === 'price-high') {
          sortOption = { price: -1 };
        } else if (order === 'name') {
          sortOption = { name: 1 };
        }

        const medicines = await medicineCollection.find().sort(sortOption).toArray();
        res.send({ success: true, data: medicines });
      } catch (err) {
        console.error("GET /medicine/sorted/:order error:", err);
        res.status(500).send({ success: false, error: "Failed to fetch sorted medicines" });
      }
    });

    // Root
    app.get("/", (req, res) => res.send("🚀 Medicare backend running with secure routes - Medicines sorted by latest first!"));

    // Start server
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`📋 Medicines are now sorted by creation date (newest first)`);
    });

  } catch (err) {
    console.error("Run error:", err);
  }
}

run().catch((err) => console.error("run().catch:", err));