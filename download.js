import $ from 'https://esm.archive.org/jquery'
import log from './util/log.js'

window.$ = $ // handy for dev tools debugging

const FINISHED_FADE_TIME = 2500 // 2.5s
const MAX_DOWNLOADS_IN_PARALLEL = 6
const FILE_MAX_SIZE_SINGLE_READ = 50 * 1024 // files smaller than this - read in 1 `fetch()` chunk

const FILEINFO = {}
class Download {
  constructor(DIRH) {
    this.NFILES = 0
    this.DIRH = DIRH
  }

  async download_items() {
    const IAIDS = document.getElementById('IAIDS').value.split(',')

    setTimeout(Download.progress_update, 250)

    this.progress_msg(`downloading: ${IAIDS.length} items`, '#progress_items')

    let done_num_ids = 0

    for (const IAIDin of IAIDS) {
      const IAID = IAIDin.trim()
      const mdapi = await (await fetch(`https://archive.org/metadata/${IAID}`)).json()
      log(mdapi)

      // as of today, this one has less CORS issues -- but ideally changes soon
      const prefix = `https://archive.org/download/${IAID}/`
      // const prefix = `https://${mdapi.d1}${mdapi.dir}/${IAID}/`

      // Build up multiple file downloads in parallel, via promises.
      // We use `Promise.any()` to 'race' and for first file to finish in list of active promises.
      // Each file gets a number, and its promise returns it, so we know how to delete its element
      // from `proms` array -- and `Object.values(proms)` is all the current active files/promises.
      const proms = []

      this.progress_msg(`downloading: ${mdapi.files.length} files from item ${IAID}`, '#progress_files')

      this.DIRS = {}

      let ndownloading = 0
      this.done_num_files = 0
      for (const fileobj of mdapi.files.sort()) {
        const dirH = await this.get_dir(`${IAID}/${fileobj.name}`)
        try {
          // be quickly resumable/rerunnable.  IF file exists and is desired size, skip re-download.
          const fh = await dirH.getFileHandle(Download.basename(fileobj.name))
          const filedata = await fh.getFile()
          const size_now = filedata.size
          if (fileobj.size === size_now) {
            this.done_num_files += 1
            // eslint-disable-next-line no-continue
            continue
          }
        } catch (error) { log(fileobj.name, { error }) }

        const prom_idx = proms.length

        const done_callback = () => {
          this.done_num_files += 1
          delete proms[prom_idx]
          $('#progress_files .progress-bar').css('width', `${100 * (this.done_num_files / mdapi.files.length)}%`)

          log(`PROMISES total: ${proms.length}, still running: ${Object.values(proms).length}`)
        }

        proms.push(this.download_file(IAID, dirH, prefix, fileobj, done_callback))

        ndownloading = Object.values(proms).length
        log(`PROMISES total: ${proms.length}, still running: ${ndownloading}`)

        while (ndownloading >= MAX_DOWNLOADS_IN_PARALLEL) {
          // eslint-disable-next-line no-promise-executor-return
          await new Promise((r) => setTimeout(r, 250)) // sleep 1/4s
          ndownloading = Object.values(proms).length
        }
      }

      // eslint-disable-next-line no-constant-condition
      while (ndownloading) {
        // eslint-disable-next-line no-promise-executor-return
        await new Promise((r) => setTimeout(r, 250)) // sleep 1/4s
        ndownloading = Object.values(proms).length
      }

      done_num_ids += 1
      $('#progress_items .progress-bar').css('width', `${100 * (done_num_ids / IAIDS.length)}%`)
    }

    // Done all items!
    $('#progress_files').fadeOut('slow')
    $('.progress-bar').removeClass('progress-bar-animated')
    $('#progress_items .card').toggleClass('bg-light').addClass('alert alert-success')
    const swapme = $('#progress_items .card').html()
    $('#progress_items .card').html(swapme.replace('downloading', 'downloaded'))
  }


  async download_file(IAID, dirH, prefix, fileobj, done_callback) {
    const outfile = fileobj.name
    const url = `${prefix}${outfile}`
    const msgid = this.progress_msg(`downloading: ${outfile}`)
    const $msgdiv = $(`#${msgid}`)
    const filekey = `${IAID}/${outfile}`
    FILEINFO[filekey] = { msgid, size: parseInt(fileobj.size, 10), size_now: 0 }

    const done_file = (errored) => {
      $msgdiv.find('.progress-bar').css('width', '100%')
      $msgdiv.addClass('alert '.concat(errored ? 'alert-danger' : 'alert-success'))
        .fadeOut(FINISHED_FADE_TIME)
      delete FILEINFO[filekey]
      setTimeout(() => $msgdiv.remove(), FINISHED_FADE_TIME)
      done_callback()
    }

    try {
      // xxx if file exists and isnt expected size, *resume* via byte ranges, etc.
      const fh = await dirH.getFileHandle(
        Download.basename(fileobj.name),
        { create: true },
      ) // returns FileSystemFileHandle
      const writable = await fh.createWritable() // returns FileSystemWritableFileStream

      if (fileobj.size < FILE_MAX_SIZE_SINGLE_READ) {
        const data = await fetch(url)
        const blob = await data.blob()
        await writable.write(blob)
        await writable.close()
        done_file()
      } else {
        let NUM_RW = 0

        // https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream#fetch_stream
        fetch(url)
          .then((response) => response.body)
          .then((rb) => {
            const reader = rb.getReader()

            return new ReadableStream({
              type: 'bytes',
              async start(controller) {
                // eslint-disable-next-line no-constant-condition
                while (true) {
                  const { done, value } = await reader.read()
                  if (done)
                    break // no more data needs to be consumed, break the reading

                  NUM_RW += value.length
                  FILEINFO[filekey].size_now = NUM_RW
                  await writable.write(value)

                  // Optionally append the value if you need the full blob later.
                  // controller.enqueue(value)
                }

                done_file()
                // Close the streams
                await writable.close()
                controller.close()
                reader.releaseLock()
              },
            })
          })
          .catch((err) => {
            log('oh dear', err)
            done_file(true)
          })
      }
    } catch (error) {
      log({ error }) // xxx skip over CORS-restricted files for now
      done_file(true)
    }
  }


  async get_dir(filename) {
    let parent_dir = this.DIRH
    let dir
    const dirs = filename.replace(/\/\/+/g, '/').split('/').slice(0, -1)
    // log(dirs)
    for (dir of dirs) {
      // log({ filename, parent: parent_dir.name, dir })
      try {
        if (!(dir in this.DIRS))
          this.DIRS[dir] = await parent_dir.getDirectoryHandle(dir, { create: true })
        parent_dir = this.DIRS[dir]
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error({ error })
        throw error
      }
    }
    return this.DIRS[dir]
  }


  progress_msg(txt, dest = '#msgs') {
    const suffix = dest === '#msgs' ? this.NFILES : ''
    const msgid = `msg${suffix}`
    const e = document.createElement('div')
    if (dest === '#msgs')
      e.setAttribute('id', msgid)
    e.classList = 'card card-body bg-light'
    e.innerHTML = `
    ${txt}
    <div class="progress">
      <div class="progress-bar progress-bar-striped progress-bar-animated bg-info" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">&nbsp;</div>
    </div>`
    if (dest === '#msgs') {
      this.NFILES += 1
      $(dest).prepend(e)
    } else {
      $(dest).html('') // xxx make betterly
      $(dest).prepend(e)
    }
    return msgid
  }

  static progress_update() {
    for (const [filekey, info] of Object.entries(FILEINFO || {})) {
      const { msgid, size, size_now } = info
      log('progress_update()', filekey, info)

      const percent = Math.round(100 * (size_now / size))
      const width_new = `${percent}%`

      const width_now = $(`#${msgid} .progress-bar`).css('width')

      if (width_new !== width_now)
        $(`#${msgid} .progress-bar`).css('width', width_new)
    }
    setTimeout(Download.progress_update, 250)
  }

  static basename(filename) {
    return filename.replace(/.*\//, '')
  }
}


// eslint-disable-next-line prefer-arrow-callback
document.getElementById('download-item').addEventListener('click', async function downloader() {
  const download = new Download(await window.showDirectoryPicker({
    // startIn: 'desktop',
    mode: 'readwrite',
  }))
  await download.download_items()
})
