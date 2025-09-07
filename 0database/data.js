// CSV loader and UI functions for data.html
(function(){
    let studentData = [];

    async function loadStudentData(){
        try{
            const res = await fetch('0newdatabase/datalist.html');
            if(!res.ok) return;
            const txt = await res.text();
            studentData = parseCSV(txt);
            console.log('loaded rows', studentData.length);
            const dbg = document.getElementById('debug-banner');
            if(dbg) dbg.textContent = 'Ready — student data loaded';
        }catch(e){ console.warn('csv load failed', e); }
    }

    function parseCSV(txt){
        const lines = txt.split(/\r?\n/).filter(l=>l.trim());
        if(lines.length<2) return [];
        const hdr = lines[0].split(',').map(s=>s.replace(/"/g,'').trim());
        const rows = [];
        for(let i=1;i<lines.length;i++){
            const vals = lines[i].split(',').map(s=>s.replace(/"/g,'').trim());
            if(vals.length !== hdr.length) continue;
            const obj = {};
            hdr.forEach((h,idx)=> obj[h]=vals[idx]);
            rows.push(obj);
        }
        return rows;
    }

    window.showClassSection = function(classNum, section){
        const display = document.getElementById('data-display');
        const title = document.getElementById('display-title');
        const list = document.getElementById('student-list');
        title.textContent = `Class ${classNum} - ${section}`;
        display.style.display = 'block';
        list.innerHTML = 'Loading...';

        if(!studentData || studentData.length===0){ list.innerHTML = '<p>No data loaded</p>'; return; }

        const matches = studentData.filter(s=> String(s.Class)===String(classNum) && String(s.Section).toLowerCase()===String(section).toLowerCase());
        matches.sort((a,b)=> (Number(a.Roll)||0)-(Number(b.Roll)||0));

        if(matches.length===0){ list.innerHTML = '<p>No students found for this class and section.</p>'; return; }

        let html = '<table><thead><tr><th>IID</th><th>Class</th><th>Section</th><th>Roll</th><th>Name</th></tr></thead><tbody>';
        matches.forEach(m=> html += `<tr><td>${m.IID||''}</td><td>${m.Class||''}</td><td>${m.Section||''}</td><td>${m.Roll||''}</td><td>${m.Name||''}</td></tr>`);
        html += `</tbody></table><p style="margin-top:8px;font-weight:600">Total: ${matches.length} students</p>`;
        list.innerHTML = html;
    };

    document.addEventListener('DOMContentLoaded', loadStudentData);
})();
