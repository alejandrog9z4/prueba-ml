const express = require("express")
const { readdirSync } = require("fs")
const { join } = require("path")
const cors = require('cors');

const app = express()

const PORT = process.env.PORT || 3000

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors())

readdirSync(join(__dirname, "router"))
  .filter((file) => {
    return file.indexOf(".") !== 0 && file.slice(-3) === ".js"
  })
  .forEach((file) => {
    const router = require(join(__dirname, "router", file)).router;
    app.use(router)
  })
app.get('/health-check',(req,res)=>{
    res.send("Hola Mundo");
});
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`)
})
