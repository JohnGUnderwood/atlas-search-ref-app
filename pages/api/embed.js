import { createRouter } from 'next-connect';
import llm from '../../middleware/llm';

async function embed(llm,string){
    try{
        return llm.embeddings.create({
            model:"text-embedding-3-small",
            input:string,
            dimensions:256,
            encoding_format:"float"
          });
    }catch(error){
        console.log(`Failed to create embeddings ${error}`)
        throw error;
    }
}

const router = createRouter();

router.use(llm);

router.get(async (req, res) => {
    if(!req.query.terms){
        console.log(`Request missing 'terms' parameter`)
        res.status(400).send(`Request missing 'terms' parameter`);
    }else{
        const string = req.query.terms
        try{
            const response = await embed(req.llm,string);
            res.status(200).json(response.data[0].embedding);
        }catch(error){
            res.status(405).json(error);
        }
    }
});

export default router.handler();