export const hydroState = (doc: Document) =>
  JSON.parse(doc.querySelector('#state')!.textContent!);
