class Search {
    searchURL = "https://archive.org/advancedsearch.php"
    end = 100000
    
    constructor(start = 1, interval = 1, end = 100000, query, fields, retry = 5) {
        if (end > this.end) {
            throw new Error("Search: cannot query for results over " + this.end)
        }
        this.end = end
        this.start = start
        this.interval = interval
        this.retry = retry
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
        
        const response = await fetch(this.searchURL + '?' + params.toString())

        let docs = []
        
        try {
            if (!response.ok) {
                throw new Error("response was not ok: " + response.status)
            }
    
            const data = await response.json()
            
            const status = data.responseHeader.status
            if (status != 0) {
                throw new Error("IA search responded with bad status: " + responseHeader)
            }
    
            this.end = Math.min(data.response.numFound, this.end)

            docs = data.response.docs
        } catch (error) {
            throw new Error("Search: " + error)
        }

        return docs
    }

    #delay(count) {
        return new Promise(
            (resolve) => setTimeout(resolve, 100 ** count)
        )
    }

    searchRetry(rows, page, retry) {
        return this.search(
            rows, page).catch(
                () => this.#delay(retry).then(
                        () => this.searchRetry(retry + 1)
                    )
                )
    }

    [Symbol.iterator]() {
        let counter = 0
        let nextIndex = this.start
        return  {
            next: () => {
                if (nextIndex <= this.end) {
                    const result = { value: this.searchRetry(this.interval, nextIndex, this.retry),  done: false }
                    nextIndex += this.interval
                    counter++
                    return result
                }
                return {value: this.searchRetry(this.interval, counter, this.retry), done: true}
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