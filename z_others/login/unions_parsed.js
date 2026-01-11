(function(){
  // Parse legacy unions.csv lines into a JS array: {id, upazila_id, name, bn_name}
  window.__unionsReady = (async function(){
    try{
      const res = await fetch('unions.csv');
      if(!res.ok) throw new Error('Could not fetch unions.csv');
      const txt = await res.text();
      const lines = txt.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
      const unions = [];
      const re = /'?(\d+)'?\s*,?\s*'?upazila_id'?\s*=>\s*'?([^'",]+)'?\s*,?\s*'?name'?\s*=>\s*'([^']*)'\s*,?\s*'bn_name'?\s*=>\s*'([^']*)'/i;
      const altRe = /'?(\d+)'?\s*,\s*'?upazila_id'?\s*=>\s*'?(\d+)'?\s*,\s*'?name'?\s*=>\s*'([^']*)'\s*,\s*'?bn_name'?\s*=>\s*'([^']*)'/i;
      for(const raw of lines){
        // try primary regex
        let m = raw.match(re) || raw.match(altRe);
        if(m){
          const id = m[1].trim();
          const upazila_id = m[2].trim();
          const name = (m[3]||'').trim();
          const bn_name = (m[4]||'').trim();
          unions.push({id, upazila_id, name, bn_name});
          continue;
        }
        // fallback: try to extract named parts by searching tokens
        try{
          const idMatch = raw.match(/^\s*'?([0-9]+)'?/);
          const upMatch = raw.match(/upazila_id\s*=>\s*'?(\d+)'?/i);
          const nameMatch = raw.match(/name\s*=>\s*'([^']*)'/i);
          const bnMatch = raw.match(/bn_name\s*=>\s*'([^']*)'/i);
          if(idMatch && upMatch && nameMatch){
            unions.push({id:idMatch[1].trim(), upazila_id:upMatch[1].trim(), name:nameMatch[1].trim(), bn_name: (bnMatch?bnMatch[1].trim():'')});
          }
        }catch(e){/* ignore */}
      }
      window.unions = unions;
      console.log('unions_parsed: parsed', unions.length, 'entries');
      return unions;
    }catch(err){
      console.error('unions_parsed error', err);
      window.unions = [];
      return [];
    }
  })();
})();
