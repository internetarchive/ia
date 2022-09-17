
// can uncomment if want to use jQuery:
// import $ from 'https://esm.archive.org/jquery'

import log from './util/log.js'

const tile = (hit) => {
  const e = document.createElement('div')
  e.classList = 'tile card card-body bg-light'
  e.innerHTML = `
<a href="https://archive.org/details/${hit.identifier}">
  <img src="https://archive.org/services/img/${hit.identifier}"/>
  <h3>${hit.title}</h3>
  <i>Date: ${hit.publicdate}</i><hr>
  ${hit.description}
</a>
`
  document.body.appendChild(e)
}


async function search() {
  const qv = document.getElementById('q').value.trim()
  const q = qv === '' ? 'cat videos' : qv

  const res = await (await fetch(`https://archive.org/advancedsearch.php?output=json&q=${q}`)).json()
  log(res)
  for (const hit of res.response.docs) {
    tile(hit)
  }
}


document.getElementById('js-search').addEventListener('click', search)
