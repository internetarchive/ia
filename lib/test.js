import * as Search from "./search.js"
import * as Fields from "./fields.js"
import * as Query from "./query.js"

const any = new Query.QueryString("any", "jonathan")
const title = new Query.QueryString("title", "hello")
const and = new Query.QueryAnd(any, title)

console.log(and.encode())

const fields = new Fields.Fields(1)

console.log(fields.encode())

const client = new Search.Search(1, 50, 50, and, fields)

for (const result of client) {
    result.then((result) => {
        console.log(result)
    })
}
