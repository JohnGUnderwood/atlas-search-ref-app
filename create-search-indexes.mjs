import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const searchIndex = {
  name:"searchIndex",
  definition: {
    "mappings": {
      "dynamic": false,
      "fields": {
        "title": [
          {
            "type": "string"
          },
          {
            "type": "autocomplete"
          }
        ],
        "stars":[
          {
            "type":"numberFacet"
          },
        ]
      }
    }
  }
  
}

const searchIndex2 = {
  name:"searchIndex2",
  definition: {
    "mappings": {
      "dynamic": false,
      "fields": {
        "customer_email": [
          {
            "type": "autocomplete"
          }
        ],
        "order_lines": [
          {
            "dynamic": false,
            "fields": {
              "title": [
                {
                  "type": "string"
                },
                {
                  "type": "autocomplete"
                }
              ]
            },
            "type": "embeddedDocuments"
          }
        ],
        "payment_method": [
          {
            "type": "stringFacet"
          }
        ]
      }
    }
  }
  
}

const vectorIndex = {
  name: "vectorIndex",
  type: "vectorSearch",
  definition: {
    "fields": [
      {
        "type": "vector",
        "path": "embedding",
        "numDimensions": 256,
        "similarity": "dotProduct"
      }
    ]
  }
}

console.log("Connection string: ", process.env.MDB_URI);
console.log("Database: ", process.env.MDB_DB);
console.log("Collection: ", process.env.MDB_COLL);

try{
  const client = new MongoClient(process.env.MDB_URI);
  await client.connect();
  try{
      try{
        const db = client.db(process.env.MDB_DB);
        const collection = db.collection(process.env.MDB_COLL);
        await collection.createSearchIndex(searchIndex);
        await collection.createSearchIndex(vectorIndex);

        const collection2 = db.collection(process.env.MDB_COLL2);
        await collection2.createSearchIndex(searchIndex2);

        console.log(collection.listSearchIndexes().toArray());
      }catch(error){
        console.log(`Creating indexes failed ${error}`);
        throw error;
      }finally{
        client.close();
      }
  }catch(error){
      throw error;
  }
}catch(error){
  console.log(`Connection failed ${error}`);
  throw error;
}
