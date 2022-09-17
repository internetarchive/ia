import $ from 'https://esm.archive.org/jquery'
import './download/demo.js'
import log from './util/log.js'

window.$ = $

let NFILES = 0
const FINISHED_FADE_TIME = 2500 // 2.5s
const FILEKEYS = {}
let DIRH

const msg = (IAID, file) => {
  const txt = `downloading: [${IAID}] ${file}`
  const msgid = `msg${NFILES}`
  const e = document.createElement('div')
  e.setAttribute('id', msgid)
  e.classList = 'card card-body bg-light'
  e.innerHTML = `
  ${txt}
  <div class="progress">
    <div class="progress-bar progress-bar-striped progress-bar-animated bg-info" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">&nbsp;</div>
  </div>`
  $('#msgs').prepend(e)
  NFILES += 1
  return msgid
}

async function progress_update() {
  for (const [filekey, info] of Object.entries(FILEKEYS)) {
    const { msgid, size, size_last } = info
    const parts = filekey.split('/')
    const IAID = parts[0]
    const outfile = parts.slice(1).join('/')
    const subdir = await DIRH.getDirectoryHandle(IAID)
    const fh = await subdir.getFileHandle(outfile)
    const filedata = await fh.getFile()
    const size_now = filedata.size

    if (size_last !== size_now) {
      FILEKEYS[filekey].size_last = size_now
      const percent = Math.round(100 * (size_now / size))
      $(`#${msgid} .progress-bar`).css('width', `${percent}%`)
    }
  }
  setTimeout(progress_update, 750)
}

async function download_items() {
  const IAIDS = document.getElementById('IAIDS').value.split(',')

  DIRH = await window.showDirectoryPicker({
    // startIn: 'desktop',
    mode: 'readwrite',
  })


  setTimeout(progress_update, 1000)

  for (const IAIDin of IAIDS) {
    const IAID = IAIDin.trim()
    const mdapi = await (await fetch(`https://archive.org/metadata/${IAID}`)).json()
    log(mdapi)

    // as of today, this one has less CORS issues -- but ideally changes soon
    const prefix = `https://archive.org/download/${IAID}/`
    // const prefix = `https://${mdapi.d1}${mdapi.dir}/${IAID}/`

    for (const fileobj of mdapi.files.sort()) {
      const file = fileobj.name
      const msgid = msg(IAID, file)
      const $msgdiv = $(`#${msgid}`)
      const outfile = file.replace(/.*\//, '') // like basename() xxx preserve optional item subdirs
      const filekey = `${IAID}/${outfile}`
      FILEKEYS[filekey] = { msgid, size: file.size, size_last: 0 }
      try {
        const data = await fetch(`${prefix}${file}`)

        // xxx obviously not great for very large files, eg: /detais/night_of_the_living_dead
        // but a demo start
        const blob = await data.blob()

        // create IDENTIFIER name subdirectory
        const subdir = await DIRH.getDirectoryHandle(IAID, { create: true })

        // xxx if file exists and is expected size, skip
        const fh = await subdir.getFileHandle(outfile, { create: true })


        const writable = await fh.createWritable()
        await writable.write(blob)
        await writable.close()
        $msgdiv.find('.progress-bar').css('width', '100%')
        $msgdiv.addClass('alert alert-success').fadeOut(FINISHED_FADE_TIME)
      } catch (error) {
        log({ error }) // xxx skip over CORS-restricted files for now
        $msgdiv.find('.progress-bar').css('width', '100%')
        $msgdiv.addClass('alert alert-danger').fadeOut(FINISHED_FADE_TIME)
      }
      delete FILEKEYS[filekey]
      setTimeout(() => $msgdiv.remove(), FINISHED_FADE_TIME)
    }
  }
}


document.getElementById('download-item').addEventListener('click', download_items)
