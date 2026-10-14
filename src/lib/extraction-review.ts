/** Validate extraction without fabricating textbook content or silently rejecting short answers. */
export function reviewExtractedNotes(value:{sourceText:string;warnings:string[]}):{text:string;warnings:string[]}{
 const text=value.sourceText.normalize('NFC').replace(/\u0000/g,'').trim();
 const warnings=value.warnings.map(w=>w.normalize('NFC').replace(/\u0000/g,'').trim()).filter(Boolean);
 return {text,warnings};
}
