class QueryConjunction {
    constructor() {
        this.parameters = []
        try {
            for (let i = 0; i < arguments.length; i++) {
                this.parameters.push(
                    arguments[i].encode()
                )
            }
        } catch (error) {
            throw new Error("QueryConjunction: building paramters failed: " + error)
        }
    }
    encode() {
        return '(' + this.parameters.join(this.deliniator) + ')'
    }
}

class QueryAnd extends QueryConjunction {
    deliniator = " AND "
}

class QueryOr extends QueryConjunction {
    deliniator = " OR "
}   

class QueryNot {
    constructor (query) {
        this.query = query.encode()
    }
    encode() {
        return '(' + "NOT " + this.query + ')'
    }
}

class QueryRaw {
    constructor(string = "") {
        this.string = string
    }
    encode() {
        return '(' + this.string + ')'
    }
}

class QueryString {
    types = ["any", "title", "creator", "description", "collection", "field1", "field2", "field3"]
    constructor(type = "any", string = "", contains = true, fuzzy = false) {
        if (!this.types.includes(type)) {
            throw new Error("String Type: " + type + " is not supported.")
        }
        this.prefix = ((type != this.types[0]) ? type + ':' : "")
        this.string = ((fuzzy) ? string + '~' : string)
        this.contains = contains
    }
    encode() {
        return ((this.contains) ? '' : '-') + this.prefix + '(' + this.string + ')'
    }
}

class QueryMediaType {
    types = ["", "account", "audio", "data", "image", "movies", "texts", "web", "etree"]
    constructor(mediaType = "", is = true) {
        if (!this.types.includes(mediaType)) {
            throw new Error("MediaType: " + mediaType + " is not supported.")
        }
        this.type = mediaType
        this.is = is
    }
    prefix = "mediaType:"
    encode() {
        return ((this.is) ? "" : "-") + this.prefix + '(' + this.type + ')'
    }
}

class QueryDate {
    constructor(date = "", to = "") {
        try {
            this.date = this.#dateParse(date)
        } catch (error) {
            throw new Error("Date: from " + date + " is incorrectly formatted: " + error)
        }
        if (to !== nil) {
            try {
                this.to = this.#dateParse(to)
            } catch (error) {
                throw new Error("Date: to " + to + " is incorrectly formatted: " + error)
            }
        }
    }
    #dateParse(date = "") {
        d = new Date()
        d.setDate(Date.parse(date))
        return d.toISOString()
    }
    prefix = "date:"
    encode() {
        if (this.to !== nil) {
            return this.prefix + '[' + this.date + " TO " + this.to + ']'
        }
        return "date:" + this.date
    }
}

class QueryRange {
    types = ["downloads", "foldoutcount", "imagecount", "item_size", "month", "week", "year"]
    constructor(type = "", from = 0, to = 0, include = true) {
        if (!this.types.includes(type)) {
            throw new Error("Range: " + type + " is not supported.")
        }
        if (!Number.isInteger(from) && from !== undefined) {
            throw new Error("Range: from must be an integer or undefined.")
        }
        if (!Number.isInteger(to) && to !== undefined) {
            throw new Error("Range: to must be an integer or undefined.")
        }
        if (from === undefined) {this.from = "null"}
        if (to === undefined) {this.to = "null"}
        this.prefix = type + ":"
        this.include = include
    }
    encode() {
        return ((this.include) ? '' : '-') + this.prefix + '[' + this.from + " TO " + this.to + ']'
    }
}

export { QueryAnd, QueryOr, QueryRaw, QueryNot, QueryString, QueryMediaType, QueryDate, QueryRange}