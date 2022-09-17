
// can uncomment if want to use jQuery:
// import $ from 'https://esm.archive.org/jquery'
import './demo.js'
import log from '../util/log.js'

const msg = (txt) => {
  const e = document.createElement('div')
  e.innerHTML = `<div class="card card-body bg-light">${txt}</div>`
  document.body.appendChild(e)
}


async function download_item() {
  const IAIDS = document.getElementById('IAID').value.split(',')

  const dir_handle = await window.showDirectoryPicker({
    startIn: 'desktop',
    mode: 'readwrite',
  })

  for (const IAIDin of IAIDS) {
    const IAID = IAIDin.trim()
    const mdapi = await (await fetch(`https://archive.org/metadata/${IAID}`)).json()
    const prefix = `https://archive.org/download/${IAID}/`
    log(mdapi)

    for (const fileobj of mdapi.files.sort()) {
      const file = fileobj.name
      msg(`downloading: [${IAID}] ${file}`)

      try {
        const data = await fetch(`${prefix}${file}`)
        const blob = await data.blob()
        const outfile = file.replace(/.*\//, '')
        log('WRITE TO', `${IAID}/${outfile}`)

        // create IDENTIFIER name subdirectory
        const subdir = await dir_handle.getDirectoryHandle(IAID, { create: true })

        // xxx if file exists and is expected size, skip
        const fh = await subdir.getFileHandle(outfile, { create: true })


        const writable = await fh.createWritable()
        await writable.write(blob)
        await writable.close()
      } catch (error) {
        log({ error }) // xxx skip over CORS-restricted files for now
      }
    }
  }
}


document.getElementById('download-item').addEventListener('click', download_item)
