import Card from '@leafygreen-ui/card';
import { Subtitle, Description } from '@leafygreen-ui/typography';

export default function Facets({facets,onFilterChange}){
    return (
        <Card>
            { Object.entries(facets).map(([facet,vals])=>(
                    <div key={facet}>
                        <Subtitle key={`${facet}_name`}>{facet}</Subtitle>
                        {vals.buckets.map(bucket => (
                            <div key={bucket._id} style={{paddingLeft:"15px"}}>
                                <span key={`${bucket._id}_label`} onClick={()=>onFilterChange(facet,{val:bucket._id,type:"equals"})} style={{cursor:"pointer",paddingRight:"5px", color:"blue"}}>{bucket._id}</span>
                                <span key={`${bucket._id}_count`}>({bucket.count})</span>
                            </div>
                        ))}
                    </div>
                ))
            }
        </Card>
    )
}

