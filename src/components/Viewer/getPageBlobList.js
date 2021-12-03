const getPageBlobList = async (pages, pdf) => {
  const container = getContainer()

  const promises = pages.map(pageNum => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      try {
        const page = await pdf.getPage(pageNum)

        renderPage(page, container).then(resolve)
      } catch (e) {
        reject(e)
      }
    })
  })
  const data = await Promise.all(promises)

  container.remove()

  return data
}

const renderPage = async (page, container) => {
  // This gives us the page's dimensions at full scale
  const viewport = page.getViewport({
    scale: 3,
  })

  // We'll create a canvas for each page to draw it on
  const canvas = document.createElement('canvas')
  canvas.style.display = 'block'
  container.appendChild(canvas)

  const context = canvas.getContext('2d')
  canvas.height = viewport.height
  canvas.width = viewport.width

  // Draw it on the canvas
  await page.render({ canvasContext: context, viewport }).promise

  return new Promise(resolve =>
    canvas.toBlob(result =>
      resolve({ blob: result, height: viewport.height, width: viewport.width })
    )
  )
}

const getContainer = () => {
  const container = document.createElement('div')
  container.style.visibility = 'hidden'
  container.style.display = 'none'
  document.body.appendChild(container)

  return container
}

export default getPageBlobList
