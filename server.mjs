import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join, normalize } from 'path';
const root = process.cwd();
const types = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.svg':'image/svg+xml','.mp4':'video/mp4','.map':'application/json','.png':'image/png'};
createServer(async (req,res)=>{
  try{
    let p = decodeURIComponent(req.url.split('?')[0]);
    if(p==='/') p='/index.html';
    const fp = join(root, normalize(p));
    const data = await readFile(fp);
    res.writeHead(200,{'Content-Type':types[extname(fp)]||'application/octet-stream'});
    res.end(data);
  }catch(e){ res.writeHead(404); res.end('404'); }
}).listen(5500, ()=>console.log('serving on http://localhost:5500'));
