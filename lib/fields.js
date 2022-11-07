const FieldTable = {
    "avg_rating": 1 << 0,
    "backup_location": 1 << 1,
    "btih": 1 << 2,
    "call_number": 1 << 3,
    "collection": 1 << 4,
    "contributor": 1 << 5,
    "coverage": 1 << 6,
    "creator": 1 << 7,
    "date": 1 << 8,
    "description": 1 << 9,
    "downloads": 1 << 10,
    "external-identifier": 1 << 11,
    "foldoutcount": 1 << 12,
    "format": 1 << 13,
    "genre": 1 << 14,
    "identifier": 1 << 15,
    "imagecount": 1 << 16,
    "indexflag": 1 << 17,
    "item_size": 1 << 18,
    "language": 1 << 19,
    "licenseurl": 1 << 20,
    "mediatype": 1 << 21,
    "members": 1 << 22,
    "month": 1 << 23,
    "name": 1 << 24,
    "noindex": 1 << 25,
    "num_reviews": 1 << 26,
    "oai_updatedate": 1 << 27,
    "publicdate": 1 << 28,
    "publisher": 1 << 29,
    "related-external-id": 1 << 30,
    "reviewdate": 1 << 31,
    "rights": 1 << 32,
    "scanningcentre": 1 << 33,
    "source": 1 << 34,
    "stripped_tags": 1 << 35,
    "subject": 1 << 36,
    "title": 1 << 37,
    "type": 1 << 38,
    "volume": 1 << 39,
    "week": 1 << 40,
    "year": 1 << 41
}

class Fields {
    fields = []
    constructor(op = 0) {
        for (const [k, v] of Object.entries(FieldTable)) {
            if ((op & v) === v || op == 0) {
                this.fields.push(k)
            }
        }
    }
    delimiter = "&fl%5B%5D="
    encode() {
        return this.delimiter + this.fields.join(this.delimiter)
    }
}

export { Fields }