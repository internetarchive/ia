class Search {
    searchURL = "https://archive.org/advancedsearch.php"
    end = 100000
    
    constructor(start = 1, interval = 1, end = 100000, query, fields) {
        if (end > this.end) {
            throw new Error("Search: cannot query for results over " + this.end)
        }
        this.end = end
        this.start = start
        this.interval = interval
        try {
            this.params = new URLSearchParams()
            this.params.append("q", query.encode())
            for (const [k, v] of Object.entries(fields)) {
                if (v) {
                    this.params.append("fl%5B%5D", k)
                }
            }
            this.params.append("output", "json")
        } catch (error) {
            throw new Error("Search: an error occured rendering query: " + error)
        }
    }

    async search(rows, page) {
        const params = new URLSearchParams(this.params)
        params.set("rows", rows)
        params.set("page", page)
        
        const URL = this.searchURL + '?' + params.toString()
        
        const response = await fetch(URL)
        if (!response.ok) {return}

        const data = await response.json()

        const status = data.responseHeader.status
        if (status != 0) {return}

        this.end = Math.min(data.response.numFound, this.end)

        return data.response.docs
    }

    [Symbol.iterator]() {
        let counter = 0
        let nextIndex = this.start
        return  {
            next: () => {
                if (nextIndex <= this.end) {
                    const result = { value: this.search(this.interval, nextIndex),  done: false }
                    nextIndex += this.interval
                    counter++
                    return result
                }
                return {value: this.search(this.interval, counter), done: true}
            },
            return: () => {
                return {value: undefined, done: true}
            }
        }
    }

    renderCallback(func = (result = []) => {return result}) {
        for (const result of this) {
            result.then(func).catch((reason) => {
                throw new Error("Search: an error occured while searching " + reason)
            })
        }
    }
}

export { Search }