import{json,error} from '@sveltejs/kit';
export const GET=async({fetch})=>{
    const res=await fetch('https://jsonplaceholder.typicode.com/posts');
    if(!res.ok){
        throw error(res.status,'failed to fetch data');
    }
    const result=await res.json();
    return json(result);
}