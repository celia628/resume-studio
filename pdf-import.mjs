// PDF.js runs locally; document bytes are never sent to a server.
export async function importPDF(file) {
  if (location.protocol === 'file:') throw Error('PDF 识别请在已发布的网站中使用；双击 HTML 时仍可导入 JSON');
  const pdfjs = await import('./vendor/pdfjs/build/pdf.min.mjs');
  const base = new URL('./vendor/pdfjs/', import.meta.url);
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('build/pdf.worker.min.mjs', base).href;
  const task = pdfjs.getDocument({data: new Uint8Array(await file.arrayBuffer()),
    cMapUrl: new URL('cmaps/', base).href, cMapPacked: true,
    standardFontDataUrl: new URL('standard_fonts/', base).href,
    wasmUrl: new URL('wasm/', base).href, isEvalSupported: false});
  try {
    const pdf = await task.promise;
    if (pdf.numPages > 20) throw Error('请导入不超过 20 页的简历 PDF');
    const docs = [];
    for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex++) {
      const page = await pdf.getPage(pageIndex);
      const viewport = page.getViewport({scale: 1});
      const scale = Math.min(595 / viewport.width, 842 / viewport.height);
      const ox = (595 - viewport.width * scale) / 2;
      const oy = (842 - viewport.height * scale) / 2;
      const content = await page.getTextContent();
      await page.getOperatorList();
      const pieces = content.items.filter(i => i.str?.trim()).map(i => {
        const t = pdfjs.Util.transform(viewport.transform, i.transform);
        const size = Math.hypot(t[2], t[3]) * scale;
        const style = content.styles[i.fontName] || {};
        let font = '';
        try { font = page.commonObjs.get(i.fontName)?.name || ''; } catch {}
        return {text:i.str, x:ox+t[4]*scale, y:oy+t[5]*scale-size*(style.ascent ?? .85),
          baseline:oy+t[5]*scale, w:Math.abs(i.width)*scale, size,
          bold:/bold|semibold|black|heavy/i.test(font+' '+style.fontFamily),
          rotated:Math.abs(t[1]) > .1 || Math.abs(t[2]) > .1};
      });
      if (!pieces.length) throw Error(`第 ${pageIndex} 页没有可识别文字，可能是扫描件、图片或文字已转曲；暂不支持 OCR`);
      if (pieces.some(p => p.rotated)) throw Error(`第 ${pageIndex} 页含旋转文字，请先将 PDF 页面转正`);
      pieces.sort((a,b)=>a.baseline-b.baseline || a.x-b.x);
      const rows=[];
      for (const p of pieces) {
        let row=rows.find(r=>Math.abs(r.baseline-p.baseline)<Math.max(1,p.size*.18));
        if (!row) rows.push(row={baseline:p.baseline,pieces:[]});
        row.pieces.push(p);
      }
      const nodes=[];
      for (const row of rows) {
        row.pieces.sort((a,b)=>a.x-b.x);
        let segments=[];
        for (const p of row.pieces) {
          const last=segments.at(-1), gap=last ? p.x-last.right : Infinity;
          if (last && gap < Math.max(5,p.size*.8)) {
            last.text+=(gap>p.size*.18?' ':'')+p.text;
            last.right=Math.max(last.right,p.x+p.w);last.y=Math.min(last.y,p.y);
            last.size=Math.max(last.size,p.size);last.bold=last.bold&&p.bold;
          } else segments.push({...p,right:p.x+p.w});
        }
        for (const s of segments) {
          const bullet=/^[•·▪■●\u2022]\s*/.test(s.text);
          const text=s.text.replace(/^[•·▪■●\u2022]\s*/, '');
          if (!text.trim()) continue;
          const x=s.x+(bullet?7:0);
          nodes.push({id:'pdf'+nodes.length,kind:'text',parent:null,name:text.slice(0,36),text,
            x,y:s.y,w:Math.max(s.right-x+3,10),h:s.size*1.3,size:s.size,
            weight:s.bold?600:400,lineHeight:s.size*1.3,letterSpacing:0,
            color:s.size>=12?'#000000':'#595959',align:'left',bullet,
            boldPrefix:bullet&&text.includes('：'),noWrap:true});
        }
      }
      if (nodes.length>2000) throw Error(`第 ${pageIndex} 页文字块过多`);
      docs.push({version:2,id:'pdf-import',title:file.name.replace(/\.pdf$/i,'')+(pdf.numPages>1?' · 第 '+pageIndex+' 页':''),width:595,height:842,nodes});
    }
    return docs;
  } catch(e) {
    if(e.name==='PasswordException') throw Error('此 PDF 有密码，请先解锁后导入');
    throw e;
  } finally { await task.destroy(); }
}
