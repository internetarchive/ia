import * as Search from "./search.js"
import * as Fields from "./fields.js"
import * as Query from "./query.js"

const any = new Query.QueryString("any", "dragon")
const media = new Query.QueryMediaType("etree")
const and = new Query.QueryAnd(any, media)

console.log(and.encode())

const fields = Fields.FieldTable

const client = new Search.Search(1, 500, 10000, and, fields)

let count = 1
let page = 1
client.renderCallback((result) => {
    console.log("Page: " + page++)
    result.forEach((value) => {
        console.log(value.identifier + "--" + count++)
    })
})
