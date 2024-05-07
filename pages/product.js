import axios from 'axios';
import Header from '../components/head';
import {SearchInput, SearchResult} from '@leafygreen-ui/search-input';
import { useEffect, useState, } from 'react';
import { H2, Subtitle, Description, } from '@leafygreen-ui/typography';
import Card from '@leafygreen-ui/card';
import Button from '@leafygreen-ui/button';
import { useRouter } from 'next/router';

// schema variables
const descriptionField = "title";
const titleField = "title";
const imageField = "imgUrl";
const vectorField = "embedding";
const facetField = "stars";

export default function Product(){
  const router = useRouter();
  const { product_id } = router.query;
  const [related, setRelated] = useState(null);
  const [product, setProduct] = useState(null);

  useEffect(() => {
    if(product_id){
      fetchProduct(product_id)
      .then(resp => setProduct(resp.data.results[0]))
      .catch(error => console.log(error));
    }
    
  },[product_id]);

  useEffect(() => {
    if(product){
      getRelatedProducts(product)
      .then(resp => setRelated(resp.data.results))
      .catch(error => console.log(error));
    }
  },[product]);
  
  return (
    <>
      <Header/>
      <div style={{paddingTop:"20px"}}>
        { product? 
        <Card>
          <Subtitle key={`${product_id}title`} style={{paddingBottom:"5px"}}>
            {product.title}
          </Subtitle>
          <div style={{display:"grid",gridTemplateColumns:"60px 90%",gap:"5px",alignItems:"start"}}>
            <img src={product.image} style={{maxHeight:"75px",maxWidth:"90px"}}/>
            <Description key={`${product_id}desc`} style={{paddingLeft:"50px"}}>
              {product.description}
            </Description>
          </div>
        </Card>
        : <></>
        } 
        
        {
          related && related.length > 0
          ?
          <div style={{maxWidth:"95%"}}>
            <H2 style={{paddingTop:"50px",paddingLeft:"10px"}}>Related products</H2>
            {related.map(r => (
              <SearchResult key={r._id}>
                <Card>
                    <Subtitle key={`${r._id}title`} style={{paddingBottom:"5px"}}>
                      {r.title}
                    </Subtitle>
                    <div style={{display:"grid",gridTemplateColumns:"60px 90%",gap:"5px",alignItems:"start"}}>
                      <img src={r.image} style={{maxHeight:"75px",maxWidth:"90px"}}/>
                      <Description key={`${r._id}desc`} style={{paddingLeft:"50px"}}>
                        {r.description}
                      </Description>
                    </div>
                </Card>
              </SearchResult>
            ))}
          </div>
          :
          <></>
        }
      </div>
    </>
  )
}


async function fetchProduct(id) {
  const pipeline = [
    {
      $match:{ $expr : { $eq: [ '$_id' , { $toObjectId: id } ] } }
    },
    {
      $project:{
          title:`$${titleField}`,
          image:`$${imageField}`,
          description:`$${descriptionField}`,
          embedding:`$${vectorField}`
      }
    }
  ]
  return new Promise((resolve) => {
    axios.post(`api/search`,
        { 
          collection:"products",
          pipeline : pipeline
        },
    ).then(response => resolve(response))
    .catch((error) => {
        console.log(error)
        resolve(error.response.data);
    })
  });
}

async function getRelatedProducts(product){
  const pipeline = [
    {
      $vectorSearch:{
        index: "vectorIndex",
        queryVector: product.embedding,
        path:`${vectorField}`,
        numCandidates:50,
        limit:6
      }
    },
    {
      $match:{
        $expr : { $ne: [ '$_id' , { $toObjectId: product._id } ] }
      }
    },
    {
      $project:{
        title:`$${titleField}`,
        image:`$${imageField}`,
        description:`$${descriptionField}`,
      }
    }
  ]

  return new Promise((resolve) => {
    axios.post(`api/search`,
        { 
          collection:"products",
          pipeline : pipeline
        },
    ).then(response => resolve(response))
    .catch((error) => {
      console.log(error)
      resolve(error.response.data);
  })
  });
}