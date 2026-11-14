// TKB Shop one-time/shared-db migration.
// Usage:
//   SOURCE_DB=protel_shop AUTH_DB=tkb_auth CATALOG_DB=tkb_catalog \
//   ORDERS_DB=tkb_orders BACKOFFICE_DB=tkb_backoffice \
//   mongosh "mongodb://localhost:27017" --file scripts/migrate_shared_mongo_to_service_dbs.js
//
// The migration is idempotent: documents are upserted by _id.

const sourceName = process.env.SOURCE_DB || "protel_shop";
const authName = process.env.AUTH_DB || "tkb_auth";
const catalogName = process.env.CATALOG_DB || "tkb_catalog";
const ordersName = process.env.ORDERS_DB || "tkb_orders";
const backofficeName = process.env.BACKOFFICE_DB || "tkb_backoffice";

const source = db.getSiblingDB(sourceName);

function copyCollection(collectionName, targetDbName) {
  const target = db.getSiblingDB(targetDbName);
  const sourceCollection = source.getCollection(collectionName);
  const targetCollection = target.getCollection(collectionName);

  let copied = 0;
  sourceCollection.find({}).forEach((document) => {
    const id = document._id;
    const replacement = Object.assign({}, document);
    delete replacement._id;

    targetCollection.updateOne(
      { _id: id },
      { $set: replacement },
      { upsert: true }
    );
    copied += 1;
  });

  print(
    JSON.stringify({
      collection: collectionName,
      source: sourceName,
      target: targetDbName,
      copied,
      targetCount: targetCollection.countDocuments({}),
    })
  );
}

print("TKB Shop shared Mongo migration starting");

[
  "users",
  "password_resets",
  "admin_invites",
].forEach((name) => copyCollection(name, authName));

[
  "products",
  "stock_commits",
].forEach((name) => copyCollection(name, catalogName));

[
  "orders",
].forEach((name) => copyCollection(name, ordersName));

[
  "settings",
  "newsletter",
].forEach((name) => copyCollection(name, backofficeName));

print("TKB Shop shared Mongo migration completed");
