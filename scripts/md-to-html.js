import fs from 'node:fs';

function escapeHtml(str){
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function inline(text){
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/_(.+?)_/g,'<em>$1</em>')
    .replace(/`([^`]+)`/g,'<code>$1</code>');
}

function convert(md){
  const lines = md.split(/\r?\n/);
  let html='';
  let inList=false;
  let inCode=false;
  for(let line of lines){
    if(line.startsWith('```')){
      if(inCode){html+='</code></pre>\n';inCode=false;}else{html+='<pre><code>';inCode=true;} 
      continue;
    }
    if(inCode){html+=escapeHtml(line)+'\n';continue;}
    if(/^---+$/.test(line.trim())){if(inList){html+='</ul>\n';inList=false;}html+='<hr/>\n';continue;}
    const heading=line.match(/^(#{1,6})\s+(.*)$/);
    if(heading){if(inList){html+='</ul>\n';inList=false;}const level=heading[1].length;html+=`<h${level}>${inline(heading[2])}</h${level}>\n`;continue;}
    const list=line.match(/^\s*-\s+(.*)$/);
    if(list){if(!inList){html+='<ul>\n';inList=true;}html+=`<li>${inline(list[1])}</li>\n`;continue;}
    const quote=line.match(/^>\s?(.*)$/);
    if(quote){if(inList){html+='</ul>\n';inList=false;}html+=`<blockquote>${inline(quote[1])}</blockquote>\n`;continue;}
    if(line.trim()===''){if(inList){html+='</ul>\n';inList=false;}html+='\n';continue;}
    if(inList){html+='</ul>\n';inList=false;}
    html+=`<p>${inline(line.trim())}</p>\n`;
  }
  if(inList){html+='</ul>\n';}
  if(inCode){html+='</code></pre>\n';}
  return html;
}

const [,,src,dest,title=''] = process.argv;
const md=fs.readFileSync(src,'utf8');
const body=convert(md);
const full=`<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8" />\n<title>${title}</title>\n<style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Helvetica Neue,Arial,sans-serif;line-height:1.5;margin:20px;background:#f6f7f9;color:#0b0b0b;}main{max-width:980px;margin:0 auto;padding:0 16px;}code{background:#f3f4f6;padding:2px 4px;border-radius:4px;}pre{background:#f3f4f6;padding:12px;border-radius:8px;overflow:auto;}ul{padding-left:20px;}blockquote{border-left:4px solid #e5e7eb;padding-left:12px;color:#374151;}</style>\n</head>\n<body>\n<main>\n${body}\n</main>\n</body>\n</html>\n`;
fs.writeFileSync(dest,full);
