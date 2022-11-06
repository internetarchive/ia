class IA {
    searchURL = "https://archive.org/advancedsearch.php"

    search(request) {
        return fetch(
            encodeURI(searchURL + "?output=json&query=" + request.query())
        )
    }

    * iterateSearch(request) {
        let count = 0;
        for (let i = 1; i <= 100; i += 1) {
            count++;
          yield fetch(
                encodeURI(searchURL + "?output=json&query=" + request.query() + "&rows=100&page=" + i)
            )
        }
        return count;
    }
}
