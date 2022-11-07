class Request {
    constructor() {
        this.parameters = []
        try {
            for (let i = 0; i < arguments.length; i++) {
                this.parameters.push(
                    encodeURIComponent(
                        arguments[i].encode()
                    ).replaceAll(
                        '(',
                        "%28"
                    ).replaceAll(
                        ')',
                        "%29"
                    ).replaceAll(
                        '~',
                        "%7e"
                    )
                )
            }
        } catch (error) {
            throw new Error("Request: building paramters failed: " + error)
        }
    }

    deliniator = "+AND+"
    query() {
        return this.parameters.join(
            this.deliniator            
        )
    }
}

function contains(yes) {
    if (yes) {
        return ""
    }
    return "-"
}

class QueryString {
    types = ["any", "title", "creator", "description", "collection", "field1", "field2", "field3"]
    constructor(type, string, contains) {
        if (!this.types.includes(type)) {
            throw new Error("String Type: " + type + " is not supported.")
        }
        this.prefix = ((type != this.types[0]) ? type + ':' : "")
        this.string = string
        this.contains = contains
    }
    encode() {
        return contains(this.contains) + this.prefix + '(' + this.string + ')'
    }
}

class QueryMediaType {
    types = ["", "account", "audio", "data", "image", "movies", "texts", "web"]
    constructor(mediaType, is) {
        if (!this.types.includes(mediaType)) {
            throw new Error("MediaType: " + mediaType + " is not supported.")
        }
        this.type = mediaType
        this.is = is
    }
    prefix = "mediaType:"
    encode() {
        return contains(this.is) + this.prefix + '(' + this.type + ')'
    }
}

class QueryDate {
    constructor(date, to) {
        try {
            d = new Date()
            d.setDate(Date.parse(date))
            this.date = d.toISOString().split('T')[0]
        } catch (error) {
            throw new Error("Date: from " + date + " is incorrectly formatted: " + error)
        }
        if (to !== nil) {
            try {
                t = new Date()
                t.setDate(Date.parse(to))
                this.to = t.toISOString().split('T')[0]
            } catch (error) {
                throw new Error("Date: to " + to + " is incorrectly formatted: " + error)
            }
        }
    }
    prefix = "date:"
    encode() {
        if (this.to !== nil) {
            return this.prefix + '[' + this.date + " TO " + this.to + ']'
        }
        return 'date:' + this.date
    }
}

export { Request, QueryString, QueryMediaType, QueryDate}