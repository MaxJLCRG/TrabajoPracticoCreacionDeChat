const express = require('express');
const app = express();
app.get('/__health', (req,res)=>res.json({ok:true,msg:'alive'}));
app.listen(4100, ()=>console.log('mini server 4100 listo'));
