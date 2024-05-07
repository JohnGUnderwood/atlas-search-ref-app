import axios from 'axios';
import Header from '../components/head';
import {SearchInput, SearchResult} from '@leafygreen-ui/search-input';
import { useState, useEffect} from 'react';
import { H1, Subtitle, Description, } from '@leafygreen-ui/typography';
import Card from '@leafygreen-ui/card';
import Button from '@leafygreen-ui/button';
import Facets from '../components/search/facets';
import Filters from '../components/search/filters';

// schema variables
const descriptionField = "order_lines.title";
const titleField = "customer_email";
const imageField = "imgUrl";
const facetField = "payment_method";

export default function Orders(){
  const [query, setQuery] = useState({terms:'',filters:{}});
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

  const handleAddFilter = (filter,val) => {
    let copiedFilters = {...query.filters};
    copiedFilters[filter] = val;
    setQuery(prevQuery => ({...prevQuery, filters: copiedFilters}));
  };

  const handleRemoveFilter = (field) => {
    let copiedFilters = {...query.filters};
    delete copiedFilters[field]
    setQuery(prevQuery => ({...prevQuery, filters: copiedFilters}));
  }

  const handleQueryChange = (event) => {
    setInstantResults(null);
    // let copiedQuery = {...query};
    // copiedQuery.terms = event.target.value;
    // setQuery(copiedQuery);
    setQuery(prevQuery => ({...prevQuery,terms:event.target.value}));
  };

  useEffect(() => {
    getInstantResults(query)
        .then(resp => setInstantResults(resp.data.results))
        .catch(error => console.log(error));
  },[query.filters]);

  useEffect(() => {
    if(query.terms && query.terms != ''){
      getInstantResults(query)
        .then(resp => setInstantResults(resp.data.results))
        .catch(error => console.log(error));
    }else if(query.terms == ''){
      setInstantResults(null);
    }
  },[query.terms]);

  

  return (
    <>
    <Header/>
    <div style={{display:"grid",gridTemplateColumns:"15% 75% 10%",gap:"0px",alignItems:"start"}}>
      <div style={{paddingTop:"225px"}}>
      {instantResults && instantResults[0] && instantResults[0].facets && instantResults[0].facets.facet
        ? 
        // <Card>
        //   <Subtitle key={`${facetField}`}>{facetField}</Subtitle>
        //       {instantResults[0].facets.facet[`${facetField}`].buckets.map(bucket => (
        //           <Description key={bucket._id} style={{paddingLeft:"15px"}}><span key={`${bucket._id}_label`} style={{cursor:"pointer",paddingRight:"5px", color:"blue"}}>{bucket._id}</span><span key={`${bucket._id}_count`}>({bucket.count})</span></Description>
        //       ))}
        // </Card>
        <Facets facets={instantResults[0].facets.facet} onFilterChange={handleAddFilter}/>
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
            {query.filters? Object.keys(query.filters).length > 0 ? <Filters filters={query.filters} handleRemoveFilter={handleRemoveFilter}/> :<></>:<></>}
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
  console.log(query)
  const searchStage =
      {
        $search:{
          index:"searchIndex2",
          highlight:{
            path:`${descriptionField}`
          },
          facet:{
            operator:{
              compound:{
                must:[
                  {
                    compound:{
                      should:[
                        {
                          autocomplete:{
                              query:query.terms,
                              path:`${titleField}`
                          }
                        },
                        {
                          embeddedDocument: {
                            path:"order_lines",
                            operator:{
                              text:{
                                query:query.terms,
                                path:`${descriptionField}`,
                              }
                            }
                          }
                        }
                      ]
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
      }
  if(query.filters && Object.keys(query.filters).length > 0) {
    searchStage.$search.facet.operator.compound.filter = Object.entries(query.filters).map(([field,val]) => { 
      return {
        equals:{
          path:field,
          value:val.val
        }
      }
    });
  };
  const pipeline = [
      searchStage,
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
