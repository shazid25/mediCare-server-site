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

// //     // -------------------------
// //     // Authentication middleware
// //     // -------------------------
// //     const verifyToken = async (req, res, next) => {
// //       const authHeader = req.headers?.authorization;
// //       if (!authHeader) {
// //         return res
// //           .status(401)
// //           .send({ message: "Unauthorized access: missing Authorization header" });
// //       }

// //       const parts = authHeader.split(" ");
// //       if (parts.length !== 2 || parts[0] !== "Bearer") {
// //         return res
// //           .status(401)
// //           .send({ message: "Unauthorized access: malformed Authorization header" });
// //       }

// //       const idToken = parts[1];
// //       if (!idToken) {
// //         return res
// //           .status(401)
// //           .send({ message: "Unauthorized access: missing token" });
// //       }

// //       try {
// //         const decodedToken = await admin.auth().verifyIdToken(idToken);
// //         req.decoded = decodedToken; // contains uid, email, etc.
// //         next();
// //       } catch (err) {
// //         console.error("Token verification failed:", err?.message || err);
// //         return res
// //           .status(403)
// //           .send({ message: "Forbidden access: invalid or expired token" });
// //       }
// //     };

// //     // -------------------------
// //     // Authorization helpers
// //     // -------------------------
// //     const verifyAdmin = async (req, res, next) => {
// //       try {
// //         const requesterEmail = req.decoded?.email;
// //         if (!requesterEmail)
// //           return res.status(403).send({ message: "Forbidden access" });

// //         const requester = await usersCollection.findOne({ email: requesterEmail });
// //         if (!requester || requester.role !== "admin") {
// //           return res
// //             .status(403)
// //             .send({ message: "Forbidden: admin access required" });
// //         }
// //         next();
// //       } catch (err) {
// //         console.error("verifyAdmin error:", err);
// //         res.status(500).send({ message: "Server error" });
// //       }
// //     };

// //     const verifySellerOrAdmin = async (req, res, next) => {
// //       try {
// //         const requesterEmail = req.decoded?.email;
// //         if (!requesterEmail)
// //           return res.status(403).send({ message: "Forbidden access" });

// //         const requester = await usersCollection.findOne({ email: requesterEmail });
// //         if (!requester) return res.status(403).send({ message: "Forbidden access" });

// //         if (requester.role === "admin") return next();
// //         if (requester.role === "seller") return next();

// //         return res
// //           .status(403)
// //           .send({ message: "Forbidden: seller or admin required" });
// //       } catch (err) {
// //         console.error("verifySellerOrAdmin error:", err);
// //         res.status(500).send({ message: "Server error" });
// //       }
// //     };

// //     // -----------------
// //     // SELLER APPLICATIONS
// //     // -----------------
// //     // User: submit application
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
// //           return res.status(400).json({
// //             success: false,
// //             message: "You already have a pending seller application",
// //           });
// //         }

// //         const result = await applicationsCollection.insertOne(sellerApplication);

// //         await usersCollection.updateOne(
// //           { email: req.decoded.email },
// //           {
// //             $set: {
// //               hasPendingSellerApplication: true,
// //               lastApplicationDate: new Date(),
// //             },
// //           }
// //         );

// //         res.status(201).json({
// //           success: true,
// //           message: "Seller application submitted successfully",
// //           data: { applicationId: result.insertedId },
// //         });
// //       } catch (error) {
// //         console.error("Error submitting seller application:", error);
// //         res.status(500).json({
// //           success: false,
// //           message: "Failed to submit application",
// //         });
// //       }
// //     });



// //     // Admin: delete application
// //     app.delete("/admin/seller-applications/:id", verifyToken, verifyAdmin, async (req, res) => {
// //       try {
// //         const { id } = req.params;

// //         // Find the application first
// //         const application = await applicationsCollection.findOne({
// //           _id: new ObjectId(id)
// //         });

// //         if (!application) {
// //           return res.status(404).json({
// //             success: false,
// //             message: "Application not found"
// //           });
// //         }

// //         // If application is pending, update user's application status
// //         if (application.status === 'pending') {
// //           await usersCollection.updateOne(
// //             { email: application.userEmail },
// //             { $set: { hasPendingSellerApplication: false } }
// //           );
// //         }

// //         // Delete the application
// //         const result = await applicationsCollection.deleteOne({
// //           _id: new ObjectId(id)
// //         });

// //         if (result.deletedCount === 0) {
// //           return res.status(404).json({
// //             success: false,
// //             message: "Application not found"
// //           });
// //         }

// //         res.json({
// //           success: true,
// //           message: "Application deleted successfully"
// //         });
// //       } catch (error) {
// //         console.error("Error deleting application:", error);
// //         res.status(500).json({
// //           success: false,
// //           message: "Failed to delete application"
// //         });
// //       }
// //     });

// //     // User: get own application status
// //     app.get("/seller-applications/status", verifyToken, async (req, res) => {
// //       try {
// //         const application = await applicationsCollection.findOne(
// //           { userEmail: req.decoded.email },
// //           { sort: { appliedAt: -1 } }
// //         );

// //         res.json({
// //           success: true,
// //           data: application || null,
// //         });
// //       } catch (error) {
// //         res.status(500).json({
// //           success: false,
// //           message: "Failed to fetch application status",
// //         });
// //       }
// //     });

// //     // Admin: get all applications
// //     app.get("/admin/seller-applications", verifyToken, verifyAdmin, async (req, res) => {
// //       try {
// //         const applications = await applicationsCollection
// //           .find({})
// //           .sort({ appliedAt: -1 })
// //           .toArray();

// //         res.json({ success: true, data: applications });
// //       } catch (error) {
// //         console.error("Error fetching applications:", error);
// //         res
// //           .status(500)
// //           .json({ success: false, message: "Failed to fetch applications" });
// //       }
// //     });

// //     // Admin: approve or reject application
// //     app.patch(
// //       "/admin/seller-applications/:id",
// //       verifyToken,
// //       verifyAdmin,
// //       async (req, res) => {
// //         try {
// //           const { id } = req.params;
// //           const { action, notes, userEmail } = req.body; // action = "approve" | "reject"

// //           let statusUpdate = {};
// //           if (action === "approve") {
// //             statusUpdate = {
// //               status: "approved",
// //               reviewedAt: new Date(),
// //               reviewedBy: req.decoded.email,
// //               notes,
// //             };
// //             await usersCollection.updateOne(
// //               { email: userEmail },
// //               { $set: { role: "seller", hasPendingSellerApplication: false } }
// //             );
// //           } else if (action === "reject") {
// //             statusUpdate = {
// //               status: "rejected",
// //               reviewedAt: new Date(),
// //               reviewedBy: req.decoded.email,
// //               notes,
// //             };
// //             await usersCollection.updateOne(
// //               { email: userEmail },
// //               { $set: { hasPendingSellerApplication: false } }
// //             );
// //           }

// //           await applicationsCollection.updateOne(
// //             { _id: new ObjectId(id) },
// //             { $set: statusUpdate }
// //           );

// //           res.json({
// //             success: true,
// //             message: `Application ${action}d successfully`,
// //           });
// //         } catch (error) {
// //           console.error("Error updating application:", error);
// //           res
// //             .status(500)
// //             .json({ success: false, message: "Failed to update application" });
// //         }
// //       }
// //     );

// //     // -----------------
// //     // USERS endpoints
// //     // -----------------
// //     app.post("/users", async (req, res) => {
// //       try {
// //         const { email, name, photoURL, role } = req.body;
// //         if (!email) return res.status(400).send({ error: "Email is required" });

// //         const existingUser = await usersCollection.findOne({ email });
// //         if (existingUser) {
// //           return res.send({ message: "User already exists", user: existingUser });
// //         }

// //         const newUser = {
// //           email,
// //           name: name || null,
// //           photoURL: photoURL || null,
// //           role: role || "user",
// //           createdAt: new Date(),
// //           lastLogin: new Date(),
// //         };

// //         const result = await usersCollection.insertOne(newUser);
// //         res.send({
// //           message: "User created",
// //           user: newUser,
// //           insertedId: result.insertedId,
// //         });
// //       } catch (err) {
// //         console.error("POST /users error:", err);
// //         res.status(500).send({ error: err.message });
// //       }
// //     });

// //     app.put("/users/admin/:email", verifyToken, verifyAdmin, async (req, res) => {
// //       try {
// //         const emailToPromote = req.params.email;
// //         const result = await usersCollection.updateOne(
// //           { email: emailToPromote },
// //           { $set: { role: "admin" } },
// //           { upsert: false }
// //         );
// //         if (result.matchedCount === 0)
// //           return res.status(404).send({ message: "User not found" });
// //         res.send({ message: "User promoted to admin" });
// //       } catch (err) {
// //         console.error("PUT /users/admin/:email error:", err);
// //         res.status(500).send({ error: err.message });
// //       }
// //     });

// //     app.get("/users/:email", verifyToken, async (req, res) => {
// //       try {
// //         const requesterEmail = req.decoded?.email;
// //         const targetEmail = req.params.email;

// //         const requester = await usersCollection.findOne({ email: requesterEmail });
// //         if (!requester) return res.status(403).send({ message: "Forbidden access" });

// //         if (requester.role !== "admin" && requesterEmail !== targetEmail) {
// //           return res
// //             .status(403)
// //             .send({ message: "Forbidden: cannot access other user's data" });
// //         }

// //         const user = await usersCollection.findOne({ email: targetEmail });
// //         if (!user) return res.status(404).send({ message: "User not found" });

// //         res.send(user);
// //       } catch (err) {
// //         console.error("GET /users/:email error:", err);
// //         res.status(500).send({ error: err.message });
// //       }
// //     });

// //     // -----------------
// //     // MEDICINE endpoints
// //     // -----------------
// //     app.get("/medicine", async (req, res) => {
// //       try {
// //         const { category, sellerEmail } = req.query;
// //         const query = {};
// //         if (category) query.category = category.toLowerCase();
// //         if (sellerEmail) query.sellerEmail = sellerEmail;
// //         const result = await medicineCollection.find(query).toArray();
// //         res.send(result);
// //       } catch (err) {
// //         console.error("GET /medicine error:", err);
// //         res.status(500).send({ error: err.message });
// //       }
// //     });

// //     app.get("/medicine/:id", async (req, res) => {
// //       try {
// //         const medicine = await medicineCollection.findOne({
// //           _id: new ObjectId(req.params.id),
// //         });
// //         if (!medicine) return res.status(404).send({ message: "Medicine not found" });
// //         res.send(medicine);
// //       } catch (err) {
// //         console.error("GET /medicine/:id error:", err);
// //         res.status(500).send({ message: "Server error", error: err.message });
// //       }
// //     });

// //     app.post("/medicine", verifyToken, verifySellerOrAdmin, async (req, res) => {
// //       try {
// //         const newMedicine = req.body;
// //         if (!newMedicine.sellerEmail) {
// //           return res.status(400).send({ message: "sellerEmail is required" });
// //         }

// //         const requester = await usersCollection.findOne({ email: req.decoded.email });
// //         if (
// //           requester.role === "seller" &&
// //           requester.email !== newMedicine.sellerEmail
// //         ) {
// //           return res
// //             .status(403)
// //             .send({ message: "Forbidden: sellers can only create their own medicines" });
// //         }

// //         newMedicine.createdAt = new Date();
// //         const result = await medicineCollection.insertOne(newMedicine);
// //         res.send({ message: "Medicine created", insertedId: result.insertedId });
// //       } catch (err) {
// //         console.error("POST /medicine error:", err);
// //         res.status(500).send({ error: err.message });
// //       }
// //     });

// //     app.put("/medicine/:id", verifyToken, verifySellerOrAdmin, async (req, res) => {
// //       try {
// //         const id = req.params.id;
// //         const updatedData = req.body;
// //         if (updatedData._id) delete updatedData._id;

// //         const existing = await medicineCollection.findOne({ _id: new ObjectId(id) });
// //         if (!existing)
// //           return res.status(404).send({ message: "Medicine not found" });

// //         const requester = await usersCollection.findOne({ email: req.decoded.email });
// //         if (requester.role === "seller" && requester.email !== existing.sellerEmail) {
// //           return res
// //             .status(403)
// //             .send({ message: "Forbidden: sellers can only update their own medicines" });
// //         }

// //         await medicineCollection.updateOne(
// //           { _id: new ObjectId(id) },
// //           { $set: updatedData }
// //         );
// //         res.send({ message: "Medicine updated successfully" });
// //       } catch (err) {
// //         console.error("PUT /medicine/:id error:", err);
// //         res.status(500).send({ message: "Failed to update medicine", error: err.message });
// //       }
// //     });

// //     app.delete("/medicine/:id", verifyToken, verifySellerOrAdmin, async (req, res) => {
// //       try {
// //         const id = req.params.id;
// //         const existing = await medicineCollection.findOne({ _id: new ObjectId(id) });
// //         if (!existing)
// //           return res.status(404).send({ message: "Medicine not found" });

// //         const requester = await usersCollection.findOne({ email: req.decoded.email });
// //         if (requester.role === "seller" && requester.email !== existing.sellerEmail) {
// //           return res
// //             .status(403)
// //             .send({ message: "Forbidden: sellers can only delete their own medicines" });
// //         }

// //         const result = await medicineCollection.deleteOne({ _id: new ObjectId(id) });
// //         if (result.deletedCount === 0)
// //           return res.status(404).send({ message: "Medicine not found" });
// //         res.send({ message: "Medicine deleted successfully" });
// //       } catch (err) {
// //         console.error("DELETE /medicine/:id error:", err);
// //         res.status(500).send({ error: err.message });
// //       }
// //     });

// //     // -----------------
// //     // PARCEL endpoints
// //     // -----------------
// //     app.get("/parcels", verifyToken, verifyAdmin, async (req, res) => {
// //       try {
// //         const result = await parcelCollection
// //           .find()
// //           .sort({ createdAt: -1 })
// //           .toArray();
// //         res.send(result);
// //       } catch (err) {
// //         console.error("GET /parcels error:", err);
// //         res.status(500).send({ error: err.message });
// //       }
// //     });

// //     app.post("/parcels", verifyToken, async (req, res) => {
// //       try {
// //         const parcel = {
// //           ...req.body,
// //           createdAt: new Date(),
// //           createdBy: req.decoded?.email || null,
// //         };
// //         const result = await parcelCollection.insertOne(parcel);
// //         res.send({ message: "Parcel created", insertedId: result.insertedId });
// //       } catch (err) {
// //         console.error("POST /parcels error:", err);
// //         res.status(500).send({ error: err.message });
// //       }
// //     });

// //     // Add this after your existing authorization helpers in index.js

// //     // Enhanced role checking middleware
// //     const checkRole = (allowedRoles) => {
// //       return async (req, res, next) => {
// //         try {
// //           const requesterEmail = req.decoded?.email;
// //           if (!requesterEmail) {
// //             return res.status(403).send({ message: "Forbidden access: missing email" });
// //           }

// //           const requester = await usersCollection.findOne({ email: requesterEmail });
// //           if (!requester) {
// //             return res.status(403).send({ message: "User not found in database" });
// //           }

// //           if (allowedRoles.includes(requester.role)) {
// //             req.user = requester; // Attach user info to request
// //             return next();
// //           }

// //           return res.status(403).send({
// //             message: `Forbidden: ${allowedRoles.join(" or ")} access required. Your role: ${requester.role}`
// //           });
// //         } catch (err) {
// //           console.error("checkRole error:", err);
// //           res.status(500).send({ message: "Server error during role verification" });
// //         }
// //       };
// //     };

// //     // Get current user's role and info
// //     app.get("/users/me/role", verifyToken, async (req, res) => {
// //       try {
// //         const user = await usersCollection.findOne({ email: req.decoded.email });
// //         if (!user) {
// //           return res.status(404).send({ message: "User not found" });
// //         }

// //         res.send({
// //           role: user.role,
// //           email: user.email,
// //           name: user.name,
// //           photoURL: user.photoURL,
// //           hasPendingSellerApplication: user.hasPendingSellerApplication || false
// //         });
// //       } catch (err) {
// //         console.error("GET /users/me/role error:", err);
// //         res.status(500).send({ error: err.message });
// //       }
// //     });

// //     // Admin: Get all users with roles (admin only)
// //     app.get("/admin/users", verifyToken, checkRole(['admin']), async (req, res) => {
// //       try {
// //         const users = await usersCollection.find({}, {
// //           projection: { email: 1, name: 1, role: 1, createdAt: 1, lastLogin: 1 }
// //         }).sort({ createdAt: -1 }).toArray();

// //         res.send(users);
// //       } catch (err) {
// //         console.error("GET /admin/users error:", err);
// //         res.status(500).send({ error: err.message });
// //       }
// //     });

// //     // Admin: Update user role
// //     app.patch("/admin/users/:email/role", verifyToken, checkRole(['admin']), async (req, res) => {
// //       try {
// //         const { email } = req.params;
// //         const { role } = req.body;

// //         const allowedRoles = ["user", "seller", "admin"];
// //         if (!allowedRoles.includes(role)) {
// //           return res.status(400).send({ message: "Invalid role. Allowed: user, seller, admin" });
// //         }

// //         // Prevent self-demotion from admin
// //         if (email === req.decoded.email && role !== 'admin') {
// //           return res.status(400).send({ message: "Cannot remove your own admin privileges" });
// //         }

// //         const result = await usersCollection.updateOne(
// //           { email },
// //           { $set: { role } }
// //         );

// //         if (result.matchedCount === 0) {
// //           return res.status(404).send({ message: "User not found" });
// //         }

// //         res.send({ message: `User role updated to ${role}` });
// //       } catch (err) {
// //         console.error("PATCH /admin/users/:email/role error:", err);
// //         res.status(500).send({ error: err.message });
// //       }
// //     });

// //     // Enhanced user creation endpoint
// //     app.post("/users", async (req, res) => {
// //       try {
// //         const { email, name, photoURL, role } = req.body;
// //         if (!email) return res.status(400).send({ error: "Email is required" });

// //         const existingUser = await usersCollection.findOne({ email });
// //         if (existingUser) {
// //           // Update last login time for existing users
// //           await usersCollection.updateOne(
// //             { email },
// //             { $set: { lastLogin: new Date() } }
// //           );
// //           return res.send({ message: "User already exists", user: existingUser });
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
// //         res.send({
// //           message: "User created",
// //           user: newUser,
// //           insertedId: result.insertedId,
// //         });
// //       } catch (err) {
// //         console.error("POST /users error:", err);
// //         res.status(500).send({ error: err.message });
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







// // index.js
// const express = require("express");
// const cors = require("cors");
// const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const admin = require("firebase-admin");
// require("dotenv").config();

// const app = express();
// const port = process.env.PORT || 3000;

// // Middlewares
// app.use(cors());
// app.use(express.json());

// const serviceAccount = require("./firebase-admin.key.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// // MongoDB setup
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@omicronx.oj2lwua.mongodb.net/?retryWrites=true&w=majority`;
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   },
// });

// async function run() {
//   try {
//     await client.connect();
//     console.log("✅ MongoDB connected successfully!");

//     const db = client.db("mediCare");
//     const usersCollection = db.collection("users");
//     const medicineCollection = db.collection("medicine");
//     const parcelCollection = db.collection("parcels");
//     const applicationsCollection = db.collection("sellerApplications");

//     // -------------------------
//     // Seed first admin
//     // -------------------------
//     const existingAdmin = await usersCollection.findOne({ email: "jorina@gmail.com" });
//     if (!existingAdmin) {
//       await usersCollection.insertOne({
//         email: "jorina@gmail.com",
//         name: "Jorina",
//         role: "admin",
//         createdAt: new Date(),
//         lastLogin: new Date(),
//         hasPendingSellerApplication: false,
//       });
//       console.log("🌟 Seeded admin: jorina@gmail.com");
//     }

//     // -------------------------
//     // Authentication middleware
//     // -------------------------
//     const verifyToken = async (req, res, next) => {
//       const authHeader = req.headers?.authorization;
//       if (!authHeader) {
//         return res.status(401).send({ message: "Unauthorized: missing Authorization header" });
//       }

//       const parts = authHeader.split(" ");
//       if (parts.length !== 2 || parts[0] !== "Bearer") {
//         return res.status(401).send({ message: "Unauthorized: malformed Authorization header" });
//       }

//       const idToken = parts[1];
//       try {
//         const decodedToken = await admin.auth().verifyIdToken(idToken);
//         req.decoded = decodedToken; // contains uid, email, etc.
//         next();
//       } catch (err) {
//         console.error("Token verification failed:", err?.message || err);
//         return res.status(403).send({ message: "Forbidden: invalid or expired token" });
//       }
//     };

//     // -------------------------
//     // Authorization helpers
//     // -------------------------
//     const verifyAdmin = async (req, res, next) => {
//       const requesterEmail = req.decoded?.email;
//       if (!requesterEmail) return res.status(403).send({ message: "Forbidden" });

//       const requester = await usersCollection.findOne({ email: requesterEmail });
//       if (!requester || requester.role !== "admin") {
//         return res.status(403).send({ message: "Forbidden: admin access required" });
//       }
//       next();
//     };

//     const verifySellerOrAdmin = async (req, res, next) => {
//       const requesterEmail = req.decoded?.email;
//       if (!requesterEmail) return res.status(403).send({ message: "Forbidden" });

//       const requester = await usersCollection.findOne({ email: requesterEmail });
//       if (!requester) return res.status(403).send({ message: "Forbidden" });

//       if (requester.role === "admin" || requester.role === "seller") return next();

//       return res.status(403).send({ message: "Forbidden: seller or admin required" });
//     };

//     const checkRole = (allowedRoles) => {
//       return async (req, res, next) => {
//         const requesterEmail = req.decoded?.email;
//         if (!requesterEmail) {
//           return res.status(403).send({ message: "Forbidden: missing email" });
//         }

//         const requester = await usersCollection.findOne({ email: requesterEmail });
//         if (!requester) {
//           return res.status(403).send({ message: "User not found in database" });
//         }

//         if (allowedRoles.includes(requester.role)) {
//           req.user = requester;
//           return next();
//         }

//         return res.status(403).send({
//           message: `Forbidden: ${allowedRoles.join(" or ")} required. Your role: ${requester.role}`,
//         });
//       };
//     };

//     // -----------------
//     // SELLER APPLICATIONS
//     // -----------------
//     app.post("/seller-applications", verifyToken, async (req, res) => {
//       try {
//         const sellerApplication = {
//           ...req.body,
//           userEmail: req.decoded.email,
//           status: "pending",
//           appliedAt: new Date(),
//           reviewedAt: null,
//           reviewedBy: null,
//           notes: "",
//         };

//         const existingApplication = await applicationsCollection.findOne({
//           userEmail: req.decoded.email,
//           status: "pending",
//         });

//         if (existingApplication) {
//           return res.status(400).json({
//             success: false,
//             message: "You already have a pending seller application",
//           });
//         }

//         const result = await applicationsCollection.insertOne(sellerApplication);

//         await usersCollection.updateOne(
//           { email: req.decoded.email },
//           {
//             $set: {
//               hasPendingSellerApplication: true,
//               lastApplicationDate: new Date(),
//             },
//           }
//         );

//         res.status(201).json({
//           success: true,
//           message: "Seller application submitted successfully",
//           data: { applicationId: result.insertedId },
//         });
//       } catch (error) {
//         console.error("Error submitting seller application:", error);
//         res.status(500).json({ success: false, message: "Failed to submit application" });
//       }
//     });

//     // (other seller application routes remain unchanged from your version)

//     // -----------------
//     // USERS endpoints
//     // -----------------
//     app.post("/users", async (req, res) => {
//       try {
//         const { email, name, photoURL, role } = req.body;
//         if (!email) return res.status(400).send({ error: "Email is required" });

//         const existingUser = await usersCollection.findOne({ email });
//         if (existingUser) {
//           // Update last login time for existing users
//           await usersCollection.updateOne({ email }, { $set: { lastLogin: new Date() } });
//           return res.send({ message: "User already exists", user: existingUser });
//         }

//         const newUser = {
//           email,
//           name: name || null,
//           photoURL: photoURL || null,
//           role: role || "user",
//           createdAt: new Date(),
//           lastLogin: new Date(),
//           hasPendingSellerApplication: false,
//         };

//         const result = await usersCollection.insertOne(newUser);
//         res.send({ message: "User created", user: newUser, insertedId: result.insertedId });
//       } catch (err) {
//         console.error("POST /users error:", err);
//         res.status(500).send({ error: err.message });
//       }
//     });

//     app.get("/users/me/role", verifyToken, async (req, res) => {
//       try {
//         const user = await usersCollection.findOne({ email: req.decoded.email });
//         if (!user) return res.status(404).send({ message: "User not found" });

//         res.send({
//           role: user.role,
//           email: user.email,
//           name: user.name,
//           photoURL: user.photoURL,
//           hasPendingSellerApplication: user.hasPendingSellerApplication || false,
//         });
//       } catch (err) {
//         console.error("GET /users/me/role error:", err);
//         res.status(500).send({ error: err.message });
//       }
//     });

//     // Admin: Get all users
//     app.get("/admin/users", verifyToken, checkRole(["admin"]), async (req, res) => {
//       try {
//         const users = await usersCollection
//           .find({}, { projection: { email: 1, name: 1, role: 1, createdAt: 1, lastLogin: 1 } })
//           .sort({ createdAt: -1 })
//           .toArray();

//         res.send(users);
//       } catch (err) {
//         console.error("GET /admin/users error:", err);
//         res.status(500).send({ error: err.message });
//       }
//     });

//     // Admin: Update user role
//     app.patch("/admin/users/:email/role", verifyToken, checkRole(["admin"]), async (req, res) => {
//       try {
//         const { email } = req.params;
//         const { role } = req.body;

//         const allowedRoles = ["user", "seller", "admin"];
//         if (!allowedRoles.includes(role)) {
//           return res.status(400).send({ message: "Invalid role. Allowed: user, seller, admin" });
//         }

//         if (email === req.decoded.email && role !== "admin") {
//           return res.status(400).send({ message: "Cannot remove your own admin privileges" });
//         }

//         const result = await usersCollection.updateOne({ email }, { $set: { role } });

//         if (result.matchedCount === 0) {
//           return res.status(404).send({ message: "User not found" });
//         }

//         res.send({ message: `User role updated to ${role}` });
//       } catch (err) {
//         console.error("PATCH /admin/users/:email/role error:", err);
//         res.status(500).send({ error: err.message });
//       }
//     });

//     // -----------------
//     // MEDICINE + PARCEL routes (same as your version)
//     // -----------------

//     // Root
//     app.get("/", (req, res) => res.send("🚀 Medicare backend running with secure routes"));

//     // Start server
//     app.listen(port, () => {
//       console.log(`🚀 Server running on port ${port}`);
//     });
//   } catch (err) {
//     console.error("Run error:", err);
//   }
// }

// run().catch((err) => console.error("run().catch:", err));








// // index.js
// const express = require("express");
// const cors = require("cors");
// const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const admin = require("firebase-admin");
// require("dotenv").config();

// const app = express();
// const port = process.env.PORT || 3000;

// // Middlewares
// app.use(cors());
// app.use(express.json());

// const serviceAccount = require("./firebase-admin.key.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// // MongoDB setup
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@omicronx.oj2lwua.mongodb.net/?retryWrites=true&w=majority`;
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   },
// });

// async function run() {
//   try {
//     await client.connect();
//     console.log("✅ MongoDB connected successfully!");

//     const db = client.db("mediCare");
//     const usersCollection = db.collection("users");
//     const medicineCollection = db.collection("medicine");
//     const parcelCollection = db.collection("parcels");
//     const applicationsCollection = db.collection("sellerApplications");

//     // -------------------------
//     // Seed initial admin
//     // -------------------------
//     const existingAdmin = await usersCollection.findOne({ email: "jorina@gmail.com" });
//     if (!existingAdmin) {
//       await usersCollection.insertOne({
//         email: "jorina@gmail.com",
//         name: "Jorina",
//         role: "admin",
//         createdAt: new Date(),
//         lastLogin: new Date(),
//         hasPendingSellerApplication: false,
//       });
//       console.log("🌟 Seeded admin: jorina@gmail.com");
//     }

//     // -------------------------
//     // Authentication middleware
//     // -------------------------
//     const verifyToken = async (req, res, next) => {
//       const authHeader = req.headers?.authorization;
//       if (!authHeader) return res.status(401).send({ message: "Unauthorized: missing Authorization header" });

//       const parts = authHeader.split(" ");
//       if (parts.length !== 2 || parts[0] !== "Bearer") {
//         return res.status(401).send({ message: "Unauthorized: malformed Authorization header" });
//       }

//       try {
//         const decodedToken = await admin.auth().verifyIdToken(parts[1]);
//         req.decoded = decodedToken; // contains uid, email, etc.
//         next();
//       } catch (err) {
//         console.error("Token verification failed:", err?.message || err);
//         return res.status(403).send({ message: "Forbidden: invalid or expired token" });
//       }
//     };

//     // -------------------------
//     // Authorization helpers
//     // -------------------------
//     const verifyAdmin = async (req, res, next) => {
//       const requesterEmail = req.decoded?.email;
//       if (!requesterEmail) return res.status(403).send({ message: "Forbidden" });

//       const requester = await usersCollection.findOne({ email: requesterEmail });
//       if (!requester || requester.role !== "admin") {
//         return res.status(403).send({ message: "Forbidden: admin access required" });
//       }
//       next();
//     };

//     const verifySellerOrAdmin = async (req, res, next) => {
//       const requesterEmail = req.decoded?.email;
//       if (!requesterEmail) return res.status(403).send({ message: "Forbidden" });

//       const requester = await usersCollection.findOne({ email: requesterEmail });
//       if (!requester) return res.status(403).send({ message: "Forbidden" });

//       if (requester.role === "admin" || requester.role === "seller") return next();
//       return res.status(403).send({ message: "Forbidden: seller or admin required" });
//     };

//     const checkRole = (allowedRoles) => {
//       return async (req, res, next) => {
//         const requesterEmail = req.decoded?.email;
//         if (!requesterEmail) return res.status(403).send({ message: "Forbidden: missing email" });

//         const requester = await usersCollection.findOne({ email: requesterEmail });
//         if (!requester) return res.status(403).send({ message: "User not found in database" });

//         if (allowedRoles.includes(requester.role)) {
//           req.user = requester;
//           return next();
//         }

//         return res.status(403).send({
//           message: `Forbidden: ${allowedRoles.join(" or ")} required. Your role: ${requester.role}`,
//         });
//       };
//     };

//     // -----------------
//     // SELLER APPLICATIONS
//     // -----------------
//     app.post("/seller-applications", verifyToken, async (req, res) => {
//       try {
//         const sellerApplication = {
//           ...req.body,
//           userEmail: req.decoded.email,
//           status: "pending",
//           appliedAt: new Date(),
//           reviewedAt: null,
//           reviewedBy: null,
//           notes: "",
//         };

//         const existingApplication = await applicationsCollection.findOne({
//           userEmail: req.decoded.email,
//           status: "pending",
//         });

//         if (existingApplication) return res.status(400).json({ success: false, message: "You already have a pending seller application" });

//         const result = await applicationsCollection.insertOne(sellerApplication);

//         await usersCollection.updateOne(
//           { email: req.decoded.email },
//           { $set: { hasPendingSellerApplication: true, lastApplicationDate: new Date() } }
//         );

//         res.status(201).json({ success: true, message: "Seller application submitted successfully", data: { applicationId: result.insertedId } });
//       } catch (error) {
//         console.error("Error submitting seller application:", error);
//         res.status(500).json({ success: false, message: "Failed to submit application" });
//       }
//     });

//     // Admin: manage applications
//     app.get("/admin/seller-applications", verifyToken, verifyAdmin, async (req, res) => {
//       try {
//         const applications = await applicationsCollection.find({}).sort({ appliedAt: -1 }).toArray();
//         res.json({ success: true, data: applications });
//       } catch (error) {
//         console.error("Error fetching applications:", error);
//         res.status(500).json({ success: false, message: "Failed to fetch applications" });
//       }
//     });

//     app.patch("/admin/seller-applications/:id", verifyToken, verifyAdmin, async (req, res) => {
//       try {
//         const { id } = req.params;
//         const { action, notes, userEmail } = req.body;

//         const statusUpdate = action === "approve"
//           ? { status: "approved", reviewedAt: new Date(), reviewedBy: req.decoded.email, notes }
//           : { status: "rejected", reviewedAt: new Date(), reviewedBy: req.decoded.email, notes };

//         if (action === "approve") {
//           await usersCollection.updateOne({ email: userEmail }, { $set: { role: "seller", hasPendingSellerApplication: false } });
//         } else if (action === "reject") {
//           await usersCollection.updateOne({ email: userEmail }, { $set: { hasPendingSellerApplication: false } });
//         }

//         await applicationsCollection.updateOne({ _id: new ObjectId(id) }, { $set: statusUpdate });

//         res.json({ success: true, message: `Application ${action}d successfully` });
//       } catch (error) {
//         console.error("Error updating application:", error);
//         res.status(500).json({ success: false, message: "Failed to update application" });
//       }
//     });

//     // -----------------
//     // USERS endpoints
//     // -----------------
//     app.post("/users", async (req, res) => {
//       try {
//         const { email, name, photoURL, role } = req.body;
//         if (!email) return res.status(400).send({ error: "Email is required" });

//         const existingUser = await usersCollection.findOne({ email });
//         if (existingUser) {
//           await usersCollection.updateOne({ email }, { $set: { lastLogin: new Date() } });
//           return res.send({ message: "User already exists", user: existingUser });
//         }

//         const newUser = {
//           email,
//           name: name || null,
//           photoURL: photoURL || null,
//           role: role || "user",
//           createdAt: new Date(),
//           lastLogin: new Date(),
//           hasPendingSellerApplication: false,
//         };

//         const result = await usersCollection.insertOne(newUser);
//         res.send({ message: "User created", user: newUser, insertedId: result.insertedId });
//       } catch (err) {
//         console.error("POST /users error:", err);
//         res.status(500).send({ error: err.message });
//       }
//     });

//     app.get("/users/me/role", verifyToken, async (req, res) => {
//       try {
//         const user = await usersCollection.findOne({ email: req.decoded.email });
//         if (!user) return res.status(404).send({ message: "User not found" });

//         res.send({
//           role: user.role,
//           email: user.email,
//           name: user.name,
//           photoURL: user.photoURL,
//           hasPendingSellerApplication: user.hasPendingSellerApplication || false,
//         });
//       } catch (err) {
//         console.error("GET /users/me/role error:", err);
//         res.status(500).send({ error: err.message });
//       }
//     });

//     app.get("/admin/users", verifyToken, checkRole(["admin"]), async (req, res) => {
//       try {
//         const users = await usersCollection.find({}, { projection: { email: 1, name: 1, role: 1, createdAt: 1, lastLogin: 1 } }).sort({ createdAt: -1 }).toArray();
//         res.send(users);
//       } catch (err) {
//         console.error("GET /admin/users error:", err);
//         res.status(500).send({ error: err.message });
//       }
//     });

//     app.patch("/admin/users/:email/role", verifyToken, checkRole(["admin"]), async (req, res) => {
//       try {
//         const { email } = req.params;
//         const { role } = req.body;
//         const allowedRoles = ["user", "seller", "admin"];
//         if (!allowedRoles.includes(role)) return res.status(400).send({ message: "Invalid role" });
//         if (email === req.decoded.email && role !== "admin") return res.status(400).send({ message: "Cannot remove your own admin privileges" });

//         const result = await usersCollection.updateOne({ email }, { $set: { role } });
//         if (result.matchedCount === 0) return res.status(404).send({ message: "User not found" });

//         res.send({ message: `User role updated to ${role}` });
//       } catch (err) {
//         console.error("PATCH /admin/users/:email/role error:", err);
//         res.status(500).send({ error: err.message });
//       }
//     });

//     // -----------------
//     // MEDICINE endpoints
//     // -----------------
//     app.get("/medicine", async (req, res) => {
//       try {
//         const { category, sellerEmail } = req.query;
//         const query = {};
//         if (category) query.category = category.toLowerCase();
//         if (sellerEmail) query.sellerEmail = sellerEmail;
//         const result = await medicineCollection.find(query).toArray();
//         res.send(result);
//       } catch (err) {
//         console.error("GET /medicine error:", err);
//         res.status(500).send({ error: err.message });
//       }
//     });

//     app.get("/medicine/:id", async (req, res) => {
//       try {
//         const medicine = await medicineCollection.findOne({ _id: new ObjectId(req.params.id) });
//         if (!medicine) return res.status(404).send({ message: "Medicine not found" });
//         res.send(medicine);
//       } catch (err) {
//         console.error("GET /medicine/:id error:", err);
//         res.status(500).send({ message: "Server error", error: err.message });
//       }
//     });

//     app.post("/medicine", verifyToken, verifySellerOrAdmin, async (req, res) => {
//       try {
//         const newMedicine = req.body;
//         if (!newMedicine.sellerEmail) return res.status(400).send({ message: "sellerEmail is required" });

//         const requester = await usersCollection.findOne({ email: req.decoded.email });
//         if (requester.role === "seller" && requester.email !== newMedicine.sellerEmail) {
//           return res.status(403).send({ message: "Forbidden: sellers can only create their own medicines" });
//         }

//         newMedicine.createdAt = new Date();
//         const result = await medicineCollection.insertOne(newMedicine);
//         res.send({ message: "Medicine created", insertedId: result.insertedId });
//       } catch (err) {
//         console.error("POST /medicine error:", err);
//         res.status(500).send({ error: err.message });
//       }
//     });

//     app.put("/medicine/:id", verifyToken, verifySellerOrAdmin, async (req, res) => {
//       try {
//         const id = req.params.id;
//         const updatedData = req.body;
//         if (updatedData._id) delete updatedData._id;

//         const existing = await medicineCollection.findOne({ _id: new ObjectId(id) });
//         if (!existing) return res.status(404).send({ message: "Medicine not found" });

//         const requester = await usersCollection.findOne({ email: req.decoded.email });
//         if (requester.role === "seller" && requester.email !== existing.sellerEmail) {
//           return res.status(403).send({ message: "Forbidden: sellers can only update their own medicines" });
//         }

//         await medicineCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedData });
//         res.send({ message: "Medicine updated successfully" });
//       } catch (err) {
//         console.error("PUT /medicine/:id error:", err);
//         res.status(500).send({ message: "Failed to update medicine", error: err.message });
//       }
//     });

//     app.delete("/medicine/:id", verifyToken, verifySellerOrAdmin, async (req, res) => {
//       try {
//         const id = req.params.id;
//         const existing = await medicineCollection.findOne({ _id: new ObjectId(id) });
//         if (!existing) return res.status(404).send({ message: "Medicine not found" });

//         const requester = await usersCollection.findOne({ email: req.decoded.email });
//         if (requester.role === "seller" && requester.email !== existing.sellerEmail) {
//           return res.status(403).send({ message: "Forbidden: sellers can only delete their own medicines" });
//         }

//         const result = await medicineCollection.deleteOne({ _id: new ObjectId(id) });
//         if (result.deletedCount === 0) return res.status(404).send({ message: "Medicine not found" });

//         res.send({ message: "Medicine deleted successfully" });
//       } catch (err) {
//         console.error("DELETE /medicine/:id error:", err);
//         res.status(500).send({ error: err.message });
//       }
//     });

//     // -----------------
//     // PARCEL endpoints
//     // -----------------
//     app.get("/parcels", verifyToken, verifyAdmin, async (req, res) => {
//       try {
//         const result = await parcelCollection.find().sort({ createdAt: -1 }).toArray();
//         res.send(result);
//       } catch (err) {
//         console.error("GET /parcels error:", err);
//         res.status(500).send({ error: err.message });
//       }
//     });

//     app.post("/parcels", verifyToken, async (req, res) => {
//       try {
//         const parcel = { ...req.body, createdAt: new Date(), createdBy: req.decoded?.email || null };
//         const result = await parcelCollection.insertOne(parcel);
//         res.send({ message: "Parcel created", insertedId: result.insertedId });
//       } catch (err) {
//         console.error("POST /parcels error:", err);
//         res.status(500).send({ error: err.message });
//       }
//     });

//     // -----------------
//     // Root
//     // -----------------
//     app.get("/", (req, res) => res.send("🚀 Medicare backend running with secure routes"));

//     // Start server
//     app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
//   } catch (err) {
//     console.error("Run error:", err);
//   }
// }

// run().catch((err) => console.error("run().catch:", err));





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

// Firebase Admin initialization (make sure firebase-admin.key.json exists)
try {
  const serviceAccount = require("./firebase-admin.key.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("✅ Firebase Admin initialized successfully");
} catch (error) {
  console.log("⚠️ Firebase Admin not initialized - make sure firebase-admin.key.json exists");
}

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
    const bannersCollection = db.collection("banners"); // Added banners collection

    // -------------------------
    // Seed initial admin and default banner
    // -------------------------
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

    // Seed default banner if none exists
    const existingBanner = await bannersCollection.findOne({});
    if (!existingBanner) {
      await bannersCollection.insertOne({
        imageUrl: "/assets/banner1.jpg",
        title: "Your Health is Our Priority",
        subtitle: "Get genuine medicines delivered to your doorstep from verified vendors",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log("🌟 Seeded default banner");
    }

    // -------------------------
    // Authentication middleware
    // -------------------------
    const verifyToken = async (req, res, next) => {
      const authHeader = req.headers?.authorization;
      if (!authHeader) return res.status(401).send({ message: "Unauthorized: missing Authorization header" });

      const parts = authHeader.split(" ");
      if (parts.length !== 2 || parts[0] !== "Bearer") {
        return res.status(401).send({ message: "Unauthorized: malformed Authorization header" });
      }

      try {
        const decodedToken = await admin.auth().verifyIdToken(parts[1]);
        req.decoded = decodedToken; // contains uid, email, etc.
        next();
      } catch (err) {
        console.error("Token verification failed:", err?.message || err);
        return res.status(403).send({ message: "Forbidden: invalid or expired token" });
      }
    };

    // -------------------------
    // Authorization helpers
    // -------------------------
    const verifyAdmin = async (req, res, next) => {
      const requesterEmail = req.decoded?.email;
      if (!requesterEmail) return res.status(403).send({ message: "Forbidden" });

      const requester = await usersCollection.findOne({ email: requesterEmail });
      if (!requester || requester.role !== "admin") {
        return res.status(403).send({ message: "Forbidden: admin access required" });
      }
      next();
    };

    const verifySellerOrAdmin = async (req, res, next) => {
      const requesterEmail = req.decoded?.email;
      if (!requesterEmail) return res.status(403).send({ message: "Forbidden" });

      const requester = await usersCollection.findOne({ email: requesterEmail });
      if (!requester) return res.status(403).send({ message: "Forbidden" });

      if (requester.role === "admin" || requester.role === "seller") return next();
      return res.status(403).send({ message: "Forbidden: seller or admin required" });
    };

    const checkRole = (allowedRoles) => {
      return async (req, res, next) => {
        const requesterEmail = req.decoded?.email;
        if (!requesterEmail) return res.status(403).send({ message: "Forbidden: missing email" });

        const requester = await usersCollection.findOne({ email: requesterEmail });
        if (!requester) return res.status(403).send({ message: "User not found in database" });

        if (allowedRoles.includes(requester.role)) {
          req.user = requester;
          return next();
        }

        return res.status(403).send({
          message: `Forbidden: ${allowedRoles.join(" or ")} required. Your role: ${requester.role}`,
        });
      };
    };

    // -----------------
    // BANNER MANAGEMENT ENDPOINTS
    // -----------------
    app.get("/api/banners", async (req, res) => {
      try {
        const banners = await bannersCollection.find({}).sort({ createdAt: -1 }).toArray();
        res.json({ success: true, data: banners });
      } catch (error) {
        console.error("Error fetching banners:", error);
        res.status(500).json({ success: false, message: "Failed to fetch banners" });
      }
    });

    app.post("/api/banners", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const { imageUrl, title, subtitle, isActive = true } = req.body;
        
        if (!imageUrl) {
          return res.status(400).json({ success: false, message: "Image URL is required" });
        }

        const newBanner = {
          imageUrl,
          title: title || "Your Health is Our Priority",
          subtitle: subtitle || "Get genuine medicines delivered to your doorstep from verified vendors",
          isActive,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await bannersCollection.insertOne(newBanner);
        const insertedBanner = { ...newBanner, _id: result.insertedId };
        
        res.status(201).json({ success: true, message: "Banner created successfully", data: insertedBanner });
      } catch (error) {
        console.error("Error creating banner:", error);
        res.status(500).json({ success: false, message: "Failed to create banner" });
      }
    });

    app.put("/api/banners/:id", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const { id } = req.params;
        const { imageUrl, title, subtitle, isActive } = req.body;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ success: false, message: "Invalid banner ID" });
        }

        const updateData = {
          updatedAt: new Date()
        };

        if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
        if (title !== undefined) updateData.title = title;
        if (subtitle !== undefined) updateData.subtitle = subtitle;
        if (isActive !== undefined) updateData.isActive = isActive;

        const result = await bannersCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ success: false, message: "Banner not found" });
        }

        res.json({ success: true, message: "Banner updated successfully" });
      } catch (error) {
        console.error("Error updating banner:", error);
        res.status(500).json({ success: false, message: "Failed to update banner" });
      }
    });

    app.delete("/api/banners/:id", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ success: false, message: "Invalid banner ID" });
        }

        const result = await bannersCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
          return res.status(404).json({ success: false, message: "Banner not found" });
        }

        res.json({ success: true, message: "Banner deleted successfully" });
      } catch (error) {
        console.error("Error deleting banner:", error);
        res.status(500).json({ success: false, message: "Failed to delete banner" });
      }
    });

    // -----------------
    // SELLER APPLICATIONS
    // -----------------
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

        if (existingApplication) return res.status(400).json({ success: false, message: "You already have a pending seller application" });

        const result = await applicationsCollection.insertOne(sellerApplication);

        await usersCollection.updateOne(
          { email: req.decoded.email },
          { $set: { hasPendingSellerApplication: true, lastApplicationDate: new Date() } }
        );

        res.status(201).json({ success: true, message: "Seller application submitted successfully", data: { applicationId: result.insertedId } });
      } catch (error) {
        console.error("Error submitting seller application:", error);
        res.status(500).json({ success: false, message: "Failed to submit application" });
      }
    });

    // Admin: manage applications
    app.get("/admin/seller-applications", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const applications = await applicationsCollection.find({}).sort({ appliedAt: -1 }).toArray();
        res.json({ success: true, data: applications });
      } catch (error) {
        console.error("Error fetching applications:", error);
        res.status(500).json({ success: false, message: "Failed to fetch applications" });
      }
    });

    app.patch("/admin/seller-applications/:id", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const { id } = req.params;
        const { action, notes, userEmail } = req.body;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ success: false, message: "Invalid application ID" });
        }

        const statusUpdate = action === "approve"
          ? { status: "approved", reviewedAt: new Date(), reviewedBy: req.decoded.email, notes }
          : { status: "rejected", reviewedAt: new Date(), reviewedBy: req.decoded.email, notes };

        if (action === "approve") {
          await usersCollection.updateOne({ email: userEmail }, { $set: { role: "seller", hasPendingSellerApplication: false } });
        } else if (action === "reject") {
          await usersCollection.updateOne({ email: userEmail }, { $set: { hasPendingSellerApplication: false } });
        }

        await applicationsCollection.updateOne({ _id: new ObjectId(id) }, { $set: statusUpdate });

        res.json({ success: true, message: `Application ${action}d successfully` });
      } catch (error) {
        console.error("Error updating application:", error);
        res.status(500).json({ success: false, message: "Failed to update application" });
      }
    });

    // -----------------
    // USERS endpoints
    // -----------------
    app.post("/users", async (req, res) => {
      try {
        const { email, name, photoURL, role } = req.body;
        if (!email) return res.status(400).send({ error: "Email is required" });

        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
          await usersCollection.updateOne({ email }, { $set: { lastLogin: new Date() } });
          return res.send({ message: "User already exists", user: existingUser });
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
        res.send({ message: "User created", user: newUser, insertedId: result.insertedId });
      } catch (err) {
        console.error("POST /users error:", err);
        res.status(500).send({ error: err.message });
      }
    });

    app.get("/users/me/role", verifyToken, async (req, res) => {
      try {
        const user = await usersCollection.findOne({ email: req.decoded.email });
        if (!user) return res.status(404).send({ message: "User not found" });

        res.send({
          role: user.role,
          email: user.email,
          name: user.name,
          photoURL: user.photoURL,
          hasPendingSellerApplication: user.hasPendingSellerApplication || false,
        });
      } catch (err) {
        console.error("GET /users/me/role error:", err);
        res.status(500).send({ error: err.message });
      }
    });

    app.get("/admin/users", verifyToken, checkRole(["admin"]), async (req, res) => {
      try {
        const users = await usersCollection.find({}, { projection: { email: 1, name: 1, role: 1, createdAt: 1, lastLogin: 1 } }).sort({ createdAt: -1 }).toArray();
        res.send(users);
      } catch (err) {
        console.error("GET /admin/users error:", err);
        res.status(500).send({ error: err.message });
      }
    });

    app.patch("/admin/users/:email/role", verifyToken, checkRole(["admin"]), async (req, res) => {
      try {
        const { email } = req.params;
        const { role } = req.body;
        const allowedRoles = ["user", "seller", "admin"];
        if (!allowedRoles.includes(role)) return res.status(400).send({ message: "Invalid role" });
        if (email === req.decoded.email && role !== "admin") return res.status(400).send({ message: "Cannot remove your own admin privileges" });

        const result = await usersCollection.updateOne({ email }, { $set: { role } });
        if (result.matchedCount === 0) return res.status(404).send({ message: "User not found" });

        res.send({ message: `User role updated to ${role}` });
      } catch (err) {
        console.error("PATCH /admin/users/:email/role error:", err);
        res.status(500).send({ error: err.message });
      }
    });

    // -----------------
    // MEDICINE endpoints
    // -----------------
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

    app.get("/medicine/:id", async (req, res) => {
      try {
        if (!ObjectId.isValid(req.params.id)) {
          return res.status(400).send({ message: "Invalid medicine ID" });
        }

        const medicine = await medicineCollection.findOne({ _id: new ObjectId(req.params.id) });
        if (!medicine) return res.status(404).send({ message: "Medicine not found" });
        res.send(medicine);
      } catch (err) {
        console.error("GET /medicine/:id error:", err);
        res.status(500).send({ message: "Server error", error: err.message });
      }
    });

    app.post("/medicine", verifyToken, verifySellerOrAdmin, async (req, res) => {
      try {
        const newMedicine = req.body;
        if (!newMedicine.sellerEmail) return res.status(400).send({ message: "sellerEmail is required" });

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

    app.put("/medicine/:id", verifyToken, verifySellerOrAdmin, async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: "Invalid medicine ID" });
        }

        const updatedData = req.body;
        if (updatedData._id) delete updatedData._id;

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

    app.delete("/medicine/:id", verifyToken, verifySellerOrAdmin, async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: "Invalid medicine ID" });
        }

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
    app.get("/parcels", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const result = await parcelCollection.find().sort({ createdAt: -1 }).toArray();
        res.send(result);
      } catch (err) {
        console.error("GET /parcels error:", err);
        res.status(500).send({ error: err.message });
      }
    });

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

    // -----------------
    // Root
    // -----------------
    app.get("/", (req, res) => res.send("🚀 Medicare backend running with secure routes and banner management"));

    // Start server
    app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
  } catch (err) {
    console.error("Run error:", err);
  }
}

run().catch((err) => console.error("run().catch:", err));