# Atlas Search Reference App
This is a simple NextJS app that shows how to build out search queries using Atlas Search and Atlas Vector Search.

## Prerequisites
1. You will need access to an Atlas Cluster.
2. Node installed
3. Load sample data into Atlas (optional to make the default examples work)
4. Create search indexes

## Load Sample Data (optional)
To get the default setup to work you need to [load sample data](https://www.mongodb.com/docs/atlas/sample-data/) into your Atlas Cluster.

If you opt not to use the sample data you will need to modify the code in `pages/index.js` to work with your schema.

## Create search indexes
You must have created your `.env` by copying and renaming the `example.env` provided as the `create-search-indexes.mjs` script uses these values. If you are not using the `sample_mflix.embedded_movies` data then you must modify the search index definitions in the script to match your schema.

Run
```
node create-search-indexes.mjs
```

## Run the app
```
npm run
```


