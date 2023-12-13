import axios from 'axios';
import Header from '../components/head';
import {SearchInput, SearchResult} from '@leafygreen-ui/search-input';
import { useState, } from 'react';
import { Subtitle, Description, } from '@leafygreen-ui/typography';
import Card from '@leafygreen-ui/card';
import Button from '@leafygreen-ui/button';

// schema variables
const descriptionField = "plot";
const titleField = "title";
const imageField = "poster";
const vectorField = "plot_embedding";

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
    <div style={{display:"grid",gridTemplateColumns:"10% 80% 10%",gap:"0px",alignItems:"start"}}>
      <div></div>
      <div>
        <div style={{display:"grid",gridTemplateColumns:"75% 60px 60px",gap:"10px",alignItems:"start", paddingLeft:"16px"}}>
          <div><SearchInput onChange={handleQueryChange} aria-label="some label" style={{marginBottom:"20px"}}></SearchInput></div>
          <div><Button onClick={()=>handleSearch()} variant="primary">Search</Button></div>
          <div><Button onClick={()=>handleVectorSearch()} variant="primary">Vector</Button></div>
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
                    <div style={{display:"grid",gridTemplateColumns:"60px 90%",gap:"5px",alignItems:"start"}}>
                      <img src={r.image} style={{maxHeight:"75px"}}/>
                      <Description key={`${r._id}desc`}>
                        {/* {r.description} */}
                        {r.highlights?.length > 0
                          ?
                          <span dangerouslySetInnerHTML={createHighlighting(r.highlights,descriptionField,r.description)} />
                          : 
                          r.description
                        }
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
      // {
      //   $match:{ $expr : { $eq: [ '$_id' , { $toObjectId: query } ] } }
      // },
      // {
      //   $match: { `${titleField}` : query }
      // },
      {
        $search:{
          index:"searchIndex",
          // text:{
          //       query:query,
          //       path:{wildcard:"*"}
          //   }
          // }
          // autocomplete:{
          //       query:query,
          //       path:`${titleField}`
          //   }
          // }
          highlight:{
            path:`${descriptionField}`
          },
          compound:{
            should:[
              {
                text:{
                  query:query,
                  path:{wildcard:"*"},
                  // fuzzy:{
                  //   maxEdits:1,
                  //   maxExpansions:10
                  // }
                }
              },
              {
                autocomplete:{
                    query:query,
                    path:`${titleField}`
                }
              }
            ]
          }
        }
      },
      {
          $limit:10
      },
      {
          $project:{
            title:`$${titleField}`,
            image:`$${imageField}`,
            description:`$${descriptionField}`,
            highlights: { $meta: "searchHighlights" },
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
