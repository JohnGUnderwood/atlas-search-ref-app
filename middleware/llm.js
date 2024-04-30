import OpenAI from 'openai';
import { createRouter } from 'next-connect';


async function openai(){
    try{
        const key = process.env.OPENAI_API_KEY;
        const openai = new OpenAI({apiKey:key});
        return openai;
    }catch(error){
        console.log(`Connection failed ${error}`)
        throw error;
    }
}


async function middleware(req, res, next) {
    req.llm = await openai();
    return next();
  }
  
  const llm = createRouter();
  llm.use(middleware);
  
  export default llm;