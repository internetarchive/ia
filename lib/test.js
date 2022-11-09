import * as Search from "./search.js"
import * as Fields from "./fields.js"
import * as Query from "./query.js"

const any = new Query.QueryString("any", "jonathan")
const title = new Query.QueryString("title", "hello")
const and = new Query.QueryAnd(any, title)
const alt = new Query.QueryString("description", "jonathan")
const or = new Query.QueryOr(and, alt)

console.log(or.encode())

const fields = Fields.FieldTable

const client = new Search.Search(1, 50, 150, or, fields)

let count = 0
client.renderCallback((result) => {
    result.forEach((value) => {
        count++
        console.log(value.identifier + "--" + count)
    })
})
