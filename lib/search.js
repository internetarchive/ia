class Search {
    searchURL = "https://archive.org/advancedsearch.php"
    end = 10000
    
    constructor(page = 1, rows = 1, end = 10000, query, fields, retry = 5) {
        if (end > this.end) {
            throw new Error("Search: cannot query for results over " + this.end)
        }
        if (page < 1 || rows < 1 || end < 1 || retry < 1) {
            throw new Error("Search: cannot use negative integers for interval variables")
        }
        this.page = page
        this.rows = rows
        this.end = end
        try {
            this.params = new URLSearchParams()
            this.params.append("q", query.encode())
            for (const [k, v] of Object.entries(fields)) {
                if (v) {
                    this.params.append("fl[]", k)
                }
            }
            this.params.append("output", "json")
        } catch (error) {
            throw new Error("Search: an error occured rendering query: " + error)
        }
        this.retry = retry
    }

    async search(page = 1) {
        const params = new URLSearchParams(this.params)
        const remainRows = this.end - (page - 1) * this.rows
        params.set("rows", Math.min(remainRows, this.rows))
        params.set("page", page)
        
        const response = await fetch(this.searchURL + '?' + params.toString())

        let docs = []

        if (response.status == 507) {
            return docs
        } else if (!response.ok) {
            throw new Error("response was not ok: " + response.status)
        }
        
        try {
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

    searchRetry(page = 1, retry = 0) {
        const delay = (count) => {
            return new Promise(
                (resolve) => setTimeout(resolve, 10 ** count)
            )
        }
        return this.search(page).catch(
            (reason) => delay(retry).then(
                () => {
                    if (retry > this.retry) {
                        return new Promise.reject(reason)
                    }
                    return this.searchRetry(retry + 1)
                }
            )
        )
    }

    [Symbol.asyncIterator]() {
        let page = this.page
        return {
            next: async () => {
                if (page * this.rows <= this.end) {
                    const result = { value: await this.searchRetry(page),  done: false }
                    page++
                    return result
                }
                return {done: true}
            },
            return: () => {
                return {value: undefined, done: true}
            }
        }
    }

    async renderCallback(func = (result = []) => {return result}) {
        for await (const result of this) {
            func(result)
        }
    }
}

export { Search }