import * as IA from "./client.js"
import * as Reqs from "./req.js"

const query = new Reqs.QueryString("any", "jonathan", true)
const query2 = new Reqs.QueryMediaType("texts", true)
const req = new Reqs.Request(query)
const req2 = new Reqs.Request(query, query2)

const client = new IA.IA()

console.log(req.query())

const response = await client.search(req)
const data = await response.json()

console.log(data)

console.log(req2.query())

const response2 = await client.search(req2)
const data2 = await response2.json()

console.log(data2)