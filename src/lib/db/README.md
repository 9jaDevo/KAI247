# MongoDB persistence

client.ts uses the official MongoDB driver with a pooled cached connection and
idempotent required index initialization. Multi-document changes use transactions;
a replica set is mandatory. Local WiredTiger data is ignored under .local/mongodb.
Atlas verification remains blocked until credentials and a real round trip exist.
