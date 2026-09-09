const mongoose = require("mongoose");
require("dotenv").config();

const TARGET_URI = process.env.MONGODB_URI;

/*
 * The current .env points to:
 *
 * budget_monitoring
 *
 * The old Budget Monitor data is in:
 *
 * test
 *
 * We derive the old database connection from the
 * same MongoDB URI without exposing the password again.
 */

const SOURCE_URI =
  TARGET_URI.replace(
    /(\.mongodb\.net:27017)(\/[^?]*)?(\?)/,
    "$1/test$3"
  );


const collectionsToCopy = [
  "departments",
  "budgets",
  "expenditures",
  "alerts",
];


const copyCollection = async (
  sourceDb,
  targetDb,
  collectionName
) => {

  const sourceCollection =
    sourceDb.collection(
      collectionName
    );

  const targetCollection =
    targetDb.collection(
      collectionName
    );


  const documents =
    await sourceCollection
      .find({})
      .toArray();


  if (documents.length === 0) {

    console.log(
      `SKIPPED: ${collectionName} is empty`
    );

    return;

  }


  /*
   * Safety check:
   *
   * We don't overwrite existing documents
   * with the same _id.
   */

  const existingIds =
    await targetCollection
      .find(
        {
          _id: {
            $in: documents.map(
              (document) =>
                document._id
            ),
          },
        },
        {
          projection: {
            _id: 1,
          },
        }
      )
      .toArray();


  const existingIdSet =
    new Set(
      existingIds.map(
        (document) =>
          document._id.toString()
      )
    );


  const documentsToInsert =
    documents.filter(
      (document) =>
        !existingIdSet.has(
          document._id.toString()
        )
    );


  if (
    documentsToInsert.length === 0
  ) {

    console.log(
      `OK: ${collectionName} already contains all source documents`
    );

    return;

  }


  await targetCollection.insertMany(
    documentsToInsert,
    {
      ordered: false,
    }
  );


  console.log(
    `COPIED: ${documentsToInsert.length} ${collectionName} document(s)`
  );

};


const migrateAuditLogs = async (
  sourceDb,
  targetDb
) => {

  const sourceUsers =
    sourceDb.collection("users");

  const targetUsers =
    targetDb.collection("users");


  const sourceAdmin =
    await sourceUsers.findOne({
      email:
        "admin@budgetmonitor.com",
    });


  const targetAdmin =
    await targetUsers.findOne({
      email:
        "admin@budgetmonitor.com",
    });


  if (!sourceAdmin) {

    console.log(
      "WARNING: Source admin@budgetmonitor.com was not found."
    );

    return;

  }


  if (!targetAdmin) {

    console.log(
      "WARNING: Target admin@budgetmonitor.com was not found."
    );

    return;

  }


  const sourceAuditLogs =
    sourceDb.collection("auditlogs");

  const targetAuditLogs =
    targetDb.collection("auditlogs");


  /*
   * Only copy audit records performed by
   * the Budget Monitor Admin account.
   *
   * We intentionally do not copy audit records
   * belonging to the other old user accounts.
   */

  const auditLogs =
    await sourceAuditLogs
      .find({
        userId:
          sourceAdmin._id,
      })
      .toArray();


  if (auditLogs.length === 0) {

    console.log(
      "SKIPPED: No Admin audit logs found."
    );

    return;

  }


  /*
   * Point the audit logs to the Admin account
   * that already exists in budget_monitoring.
   */

  const migratedLogs =
    auditLogs.map(
      (log) => {

        const migratedLog = {
          ...log,
          userId:
            targetAdmin._id,
        };


        return migratedLog;

      }
    );


  const existingIds =
    await targetAuditLogs
      .find(
        {
          _id: {
            $in: migratedLogs.map(
              (log) =>
                log._id
            ),
          },
        },
        {
          projection: {
            _id: 1,
          },
        }
      )
      .toArray();


  const existingIdSet =
    new Set(
      existingIds.map(
        (log) =>
          log._id.toString()
      )
    );


  const logsToInsert =
    migratedLogs.filter(
      (log) =>
        !existingIdSet.has(
          log._id.toString()
        )
    );


  if (
    logsToInsert.length === 0
  ) {

    console.log(
      "OK: Admin audit logs already migrated."
    );

    return;

  }


  await targetAuditLogs.insertMany(
    logsToInsert,
    {
      ordered: false,
    }
  );


  console.log(
    `COPIED: ${logsToInsert.length} Admin audit log(s)`
  );

};


const migrate = async () => {

  let sourceConnection;
  let targetConnection;


  try {

    if (!TARGET_URI) {

      throw new Error(
        "MONGODB_URI is missing from backend/.env"
      );

    }


    console.log(
      "\nStarting Budget Monitor data migration...\n"
    );


    console.log(
      "Connecting to old database: test"
    );


    sourceConnection =
      await mongoose.createConnection(
        SOURCE_URI
      ).asPromise();


    console.log(
      "Old database connected."
    );


    console.log(
      "Connecting to new database: budget_monitoring"
    );


    targetConnection =
      await mongoose.createConnection(
        TARGET_URI
      ).asPromise();


    console.log(
      "New database connected.\n"
    );


    const sourceDb =
      sourceConnection.db;

    const targetDb =
      targetConnection.db;


    /*
     * Copy only Budget Monitor collections.
     */

    for (
      const collectionName
      of collectionsToCopy
    ) {

      await copyCollection(
        sourceDb,
        targetDb,
        collectionName
      );

    }


    /*
     * Copy only audit logs belonging
     * to admin@budgetmonitor.com.
     */

    await migrateAuditLogs(
      sourceDb,
      targetDb
    );


    /*
     * Verify final data counts.
     */

    console.log(
      "\nMigration verification:"
    );


    const verificationCollections = [
      "users",
      "departments",
      "budgets",
      "expenditures",
      "alerts",
      "auditlogs",
    ];


    for (
      const collectionName
      of verificationCollections
    ) {

      const count =
        await targetDb
          .collection(
            collectionName
          )
          .countDocuments();


      console.log(
        `${collectionName}: ${count}`
      );

    }


    const targetUsers =
      await targetDb
        .collection("users")
        .find(
          {},
          {
            projection: {
              name: 1,
              email: 1,
              role: 1,
            },
          }
        )
        .toArray();


    console.log(
      "\nUsers in budget_monitoring:"
    );


    targetUsers.forEach(
      (user) => {

        console.log(
          `- ${user.name} | ${user.email} | ${user.role}`
        );

      }
    );


    console.log(
      "\n========================================"
    );

    console.log(
      "MIGRATION COMPLETED SUCCESSFULLY"
    );

    console.log(
      "========================================\n"
    );


  } catch (error) {

    console.error(
      "\nMIGRATION FAILED:"
    );

    console.error(
      error.message
    );


    process.exitCode = 1;


  } finally {

    if (sourceConnection) {

      await sourceConnection.close();

    }


    if (targetConnection) {

      await targetConnection.close();

    }

  }

};


migrate();