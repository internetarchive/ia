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

const client = new Search.Search(1, 50, 50, or, fields)

for (const result of client) {
    result.then((result) => {
        console.log(result)
    })
}