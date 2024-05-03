import { Chip } from "@leafygreen-ui/chip";

export default function Filters({filters,handleRemoveFilter}){
    return (
        <div>
            {Object.entries(filters).map(([field,filter]) => (
                <Chip key={`${field}:${filter.val}`} label={`${field}:${filter.val}`} variant="gray" onDismiss={()=>handleRemoveFilter(field)}></Chip>
            ))}
        </div>
    )
}