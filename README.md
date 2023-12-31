# Atlas Search Reference App
This is a simple NextJS app that shows how to build out search queries using Atlas Search and Atlas Vector Search.

## Prerequisites
1. You will need access to an Atlas Cluster.
2. [Node installed](https://nodejs.org/en/learn/getting-started/how-to-install-nodejs)
3. Load sample data into Atlas (optional to make the default examples work)
4. Create search indexes

## Load Sample Data (optional)
To get the default setup to work you need to [load sample data](https://www.mongodb.com/docs/atlas/sample-data/) into your Atlas Cluster.

If you opt not to use the sample data you will need to modify the variables in [`pages/index.js`](pages/index.js#L9) to work with your schema.

## Create search indexes
You must have created your `.env` by copying and renaming the `example.env` provided as the `create-search-indexes.mjs` script uses these values. If you are not using the `sample_mflix.embedded_movies` data then you must modify the search index definitions in the script to match your schema.

Run
```
node create-search-indexes.mjs
```

## Run the app
```
npm run dev
```

## Modify Search Pipeline
Now you can play around with modifying the [aggregation pipeline](pages/index.js#L158) with different search options. If you run the app using the `dev` option then changes to the page source code will automatically cause the app to reload reflecting the new code.


