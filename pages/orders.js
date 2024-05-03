import axios from 'axios';
import Header from '../components/head';
import {SearchInput, SearchResult} from '@leafygreen-ui/search-input';
import { useState, } from 'react';
import { H1, Subtitle, Description, } from '@leafygreen-ui/typography';
import Card from '@leafygreen-ui/card';
import Button from '@leafygreen-ui/button';

// schema variables
const descriptionField = "order_lines.title";
const titleField = "customer_email";
const imageField = "imgUrl";
const facetField = "payment_method";

export default function Home(){
  const [query, setQuery] = useState(null);
  const [instantResults, setInstantResults] = useState(null);

  const handleSearch = () => {
    if(query && query != ""){
      getInstantResults(query)
      .then(resp => setInstantResults(resp.data.results))
      .catch(error => console.log(error));
    }else{
      setQuery(null);
    }
  }

  const handleVectorSearch = () => {
    if(query && query != ""){
      vectorSearch(query)
      .then(resp => setInstantResults(resp.data.results))
      .catch(error => console.log(error));
    }else{
      setQuery(null);
    }
  }

  const handleQueryChange = (event) => {
    setInstantResults(null);
    setQuery(event.target.value);
    getInstantResults(event.target.value)
    .then(resp => setInstantResults(resp.data.results))
    .catch(error => console.log(error));
  };

  return (
    <>
    <Header/>
    <div style={{display:"grid",gridTemplateColumns:"15% 75% 10%",gap:"0px",alignItems:"start"}}>
      <div style={{paddingTop:"225px"}}>
      {instantResults && instantResults[0] && instantResults[0].facets && instantResults[0].facets.facet
        ? 
        <Card>
          <Subtitle key={`${facetField}`}>{facetField}</Subtitle>
              {instantResults[0].facets.facet[`${facetField}`].buckets.map(bucket => (
                  <Description key={bucket._id} style={{paddingLeft:"15px"}}><span key={`${bucket._id}_label`} style={{cursor:"pointer",paddingRight:"5px", color:"blue"}}>{bucket._id}</span><span key={`${bucket._id}_count`}>({bucket.count})</span></Description>
              ))}
        </Card>
        : <></>
      }
      </div>
      <div>
        <H1 style={{paddingLeft:"30%",paddingTop:"100px"}}>Orders Search</H1>
        <div style={{display:"grid",gridTemplateColumns:"75% 60px 60px",gap:"10px",alignItems:"start", paddingLeft:"16px"}}>
          <div><SearchInput onChange={handleQueryChange} aria-label="some label" style={{marginBottom:"20px"}}></SearchInput></div>
          <div><Button onClick={()=>handleSearch()} variant="primary">Search</Button></div>
          {/* <div><Button onClick={()=>handleVectorSearch()} variant="primary">Vector</Button></div> */}
        </div>
        {
          instantResults && instantResults.length > 0
          ?
          <div style={{maxWidth:"95%"}}>
            {instantResults.map(r => (
              <SearchResult key={r._id}>
                <Card>
                    <Subtitle key={`${r._id}title`} style={{paddingBottom:"5px"}}>
                      {r.title}
                    </Subtitle>
                    <Description key={`${r._id}desc`}>
                      {r.highlights?.length > 0
                        ?
                        r.description.map((v,i) => (
                          <span key={`desc_v_${i}`} dangerouslySetInnerHTML={createHighlighting(r.highlights,descriptionField,v)} />
                        ))
                        : 
                        r.description
                      }
                    </Description>
                </Card>
              </SearchResult>
            ))}
          </div>
          :
          <></>
        }
      </div>
      <div></div>
    </div>
    </>
  )
}

function createHighlighting(highlightsField,fieldName,fieldValue) {
  const highlightedStrings = highlightsField.map(h => {
    if(h.path === fieldName){
      return h.texts.map(t => {
        if(t.type === "hit"){
          return "<strong style='color:blue'>"+t.value+"</strong>"
        }else{
          return t.value
        }
        
      }).join('')
    }
  });

  const nonHighlightedStrings = highlightsField.map(h => {
    if(h.path === fieldName){
      return h.texts.map(t => t.value).join('')
    }
  });

  highlightedStrings.forEach((str,idx) => {
    fieldValue = fieldValue.replace(nonHighlightedStrings[idx],str);
  });

  return {__html: fieldValue};
}

async function vectorSearch(query) {

  const embeddingResp = await axios.get('api/embed?terms='+query);

  const pipeline = [
    {
      $vectorSearch:{
        index: "vectorIndex",
        queryVector: embeddingResp.data,
        path:`${vectorField}`,
        numCandidates:50,
        limit:10
      }
    },
    {
      $project:{
          title:`$${titleField}`,
          image:`$${imageField}`,
          description:`$${descriptionField}`,
          score:{$meta:"searchScore"},
      }
    }
  ]
  return new Promise((resolve) => {
    axios.post(`api/search`,
        { 
          pipeline : pipeline
        },
    ).then(response => resolve(response))
    .catch((error) => {
        console.log(error)
        resolve(error.response.data);
    })
  });
}

async function getInstantResults(query) {
  const pipeline = [
      {
        $search:{
          index:"searchIndex2",
          highlight:{
            path:`${descriptionField}`
          },
          facet:{
            operator:{
              compound:{
                should:[
                  {
                    autocomplete:{
                        query:query,
                        path:`${titleField}`
                    }
                  },
                  {
                    embeddedDocument: {
                      path:"order_lines",
                      operator:{
                        text:{
                          query:query,
                          path:`${descriptionField}`,
                          // fuzzy:{
                          //   maxEdits:1,
                          //   maxExpansions:10
                          // }
                        }
                      }
                    }
                  }
                ]
              }
            },
            facets:{
              payment_method:{
                type:"string",
                path:`${facetField}`
              }
            }
          }
        },
      },
      {
          $limit:10
      },
      {
          $project:{
            title:`$${titleField}`,
            image:`$${imageField}`,
            description:`$${descriptionField}`,
            score:{$meta:"searchScore"},
            facets:"$$SEARCH_META",
            highlights: { $meta: "searchHighlights" }
          }
      }
  ]
  return new Promise((resolve) => {
      axios.post(`api/search`,
          { 
            collection: "orders",
            pipeline : pipeline
          },
      ).then(response => resolve(response))
      .catch((error) => {
          console.log(error)
          resolve(error.response.data);
      })
  });
}
