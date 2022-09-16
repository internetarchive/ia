
// can uncomment if want to use jQuery:
// import $ from 'https://esm.archive.org/jquery'


// eslint-disable-next-line no-console
const log = console.log.bind(console)

const msg = (txt) => {
  const e = document.createElement('div')
  e.innerHTML = `<div class="card card-body bg-light">${txt}</div>`
  document.body.appendChild(e)
}


async function download_item() {
  const IAID = document.getElementById('IAID').value

  const dirHandle = await window.showDirectoryPicker()
  await dirHandle.requestPermission({ mode: 'readwrite' })

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
      log('WRITE TO', outfile)

      const fh = await dirHandle.getFileHandle(outfile, { create: true })

      const writable = await fh.createWritable()
      await writable.write(blob)
      await writable.close()
    } catch (e) {
      log('ERROR', e) // skip over CORS-restricted files for now
    }
  }
}


async function directory_selector() {
  const dir_ref = await self.showDirectoryPicker()
  if (dir_ref) {
    // read dir
    for await (const [name, entry] of dir_ref) {
      // entry is FileSystemFileHandle or FileSystemDirectoryHandle
      if (entry.kind === 'file') {
        msg(`file: ${name}`)
        log('file', { name, entry })

        const file = await entry.getFile()
        const fileData = await file.text()
        log({ fileData })
      } else {
        log('dir', { name, entry })
        msg(`dir: ${name}`)
      }
    }

    // Get a specific file
    const entry = await dir_ref.getFileHandle('index.html')
    log({ entry })
    const file = await entry.getFile()
    const fileData = await file.text()
    log({ fileData })

    // $('body').html(fileData)
  }
}


async function write_new_file() {
  const fh = await window.showSaveFilePicker({
    types: [{
      description: 'A JPEG',
      accept: {
        'image/jpeg': ['.jpg'],
      },
    }],
  })

  const data = await fetch('https://archive.org/download/stairs/stairs.jpg')
  const contents = await data.blob()
  // Create a FileSystemWritableFileStream to write to.
  const writable = await fh.createWritable()
  // Write the contents of the file to the stream.
  await writable.write(contents)
  // Close the file and write the contents to disk.
  await writable.close()
}


// Create a new file
let FH
async function get_new_file_handle() {
  const options = {
    types: [{
      description: 'A JPEG',
      accept: {
        'image/jpeg': ['.jpg'],
      },
    }],
  }
  FH = await window.showSaveFilePicker(options)
  return FH
}


document.getElementById('download-item').addEventListener('click', download_item)
document.getElementById('dir-sel').addEventListener('click', directory_selector)
document.getElementById('download-jpg').addEventListener('click', write_new_file)
document.getElementById('new-file').addEventListener('click', get_new_file_handle)
