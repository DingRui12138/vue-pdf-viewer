import PDFViewer from './PDFViewer.vue'

if (typeof window !== 'undefined' && window.Vue) {
  window.PDFViewer = PDFViewer
}

export default PDFViewer
