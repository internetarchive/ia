import * as Request from "./req.js"

class Search {
    searchURL = "https://archive.org/advancedsearch.php"
    end = 100000
    
    constructor(start = 0, interval = 1, request = Request.Request) {
        this.start = start
        this.interval = interval
        this.request = request
    }

    async search(rows, page) {
        const URL = this.searchURL +
            "?output=json&q=" +
            this.request.query() +
            "&rows=" +
            rows +
            "&page=" +
            page
        
        const response = await fetch(URL)
        if (!response.ok) {return}

        const data = await response.json()

        const status = data.responseHeader.status
        if (!status) {return}

        const numFound = data.response.numFound
        if (numFound <= this.end) {this.end = numFound}

        return data.response.docs
    }

    [Symbol.iterator]() {
        let counter = 0
        let nextIndex = this.start
        return  {
            next: () => {
                if ( nextIndex <= this.end ) {
                    const result = { value: this.search(this.interval, nextIndex),  done: false }
                    nextIndex += this.interval
                    counter++
                    return result
                }
                return { value: this.search(this.interval, counter), done: true }
            },
            return: () => {
                return { value: undefined, done: true }
            }
        }
    }
}

export { Search }