const objFromTextContent = (doc: Document, selector: string) =>
  JSON.parse(doc.querySelector(selector)!.textContent!)

export const hydroState = (doc: Document) =>
  objFromTextContent(doc, '#hydration-state')

export const hydroParams = (doc: Document) =>
  objFromTextContent(doc, '#hydration-params')
