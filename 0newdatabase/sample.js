const sheetID = '1Ptteqt7BlKz_HGcxpBjHe7NxlTJPriHd-IPvtH4Vpvk';
const sheetName = 'TEACHER DATA';
const sheetURL = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
let students = [];
let headers = [];
let allStudents = [];
const defaultPassword = "11223";
let isDefaultPasswordUsed = false;

async function loadData() {
    try {
        showLoader(true);
        const response = await fetch(sheetURL, { cache: 'force-cache' }); // Enable caching for faster loading
        const csvData = await response.text();
        const rows = csvData.split('\n').filter(row => row.trim() !== '');
        
        headers = rows[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => h.replace(/(^"|"$)/g, '').trim());
        
        allStudents = rows.slice(1).map(row => {
            const values = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            return headers.reduce((obj, header, index) => {
                obj[header] = values[index] ? values[index].replace(/(^"|"$)/g, '').trim() : '';
                return obj;
            }, {});
        });

        // Load first 30 students
        students = allStudents.slice(0, 100);
        renderStudentList();
        // Add comment indicating 30 items are shown
        document.getElementById('studentList').insertAdjacentHTML('beforeend', '<div class="detail-item"> খুঁজে পেতে উপরে নাম লিখে খুজুন </div>');
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('studentList').innerHTML = '<div class="detail-item">Data Loading Error</div>';
    } finally {
        showLoader(false);
    }
}

function showLoader(show) {
    const loader = document.querySelector('.loader');
    loader.style.display = show ? 'block' : 'none';
}

function renderStudentList() {
    const listContainer = document.getElementById('studentList');
    listContainer.innerHTML = '';

    students.forEach(student => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
            <div>${student[headers[0]]}</div>
            <div>${student[headers[1]]}</div>
            <div>${student[headers[2]]}</div>
        `;
        div.onclick = () => showDetailPage(student);
        listContainer.appendChild(div);
    });
}

function filterList() {
    const searchTerm = document.getElementById('searchBox').value.toLowerCase();
    const filteredStudents = allStudents.filter(student => {
        return headers.slice(0, 3).some(header => {
            return student[header].toLowerCase().includes(searchTerm);
        });
    });
    renderFilteredStudentList(filteredStudents);
}

function renderFilteredStudentList(filteredStudents) {
    const listContainer = document.getElementById('studentList');
    listContainer.innerHTML = '';

    filteredStudents.forEach(student => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
            <div>${student[headers[0]]}</div>
            <div>${student[headers[1]]}</div>
            <div>${student[headers[2]]}</div>
        `;
        div.onclick = () => showDetailPage(student);
        listContainer.appendChild(div);
    });
}

function showDetailPage(student) {
    const password = prompt("Enter password to view details:");
    if (password !== student['Password'] && password !== defaultPassword) {
        alert("Incorrect password!");
        return;
    }

    if (password === defaultPassword) {
        isDefaultPasswordUsed = true;
    } else {
        isDefaultPasswordUsed = false;
    }

    document.getElementById('listPage').style.display = 'none';
    document.getElementById('detailPage').style.display = 'block';
    
    const detailContent = document.getElementById('detailContent');
    detailContent.innerHTML = '';

    headers.slice(0, 10).forEach(header => {
        if (student[header]) { // Only show if data exists
            const div = document.createElement('div');
            div.className = 'detail-item';

            if (header.toLowerCase().includes('photo')) {
                const photoContainer = document.createElement('div');
                photoContainer.className = 'photo-container';

                const label = document.createElement('div');
                label.textContent = `${header}:`;
                label.style.fontWeight = 'bold';

                const img = document.createElement('img');
                img.src = student[header];
                img.alt = 'Photo';
                img.className = 'photo';

                const downloadButton = document.createElement('button');
                downloadButton.className = 'download-button';
                downloadButton.textContent = 'Download Photo';
                downloadButton.onclick = () => downloadPhoto(student[header]);

                photoContainer.appendChild(label);
                photoContainer.appendChild(img);
                photoContainer.appendChild(downloadButton);
                div.appendChild(photoContainer);
            } else {
                div.innerHTML = `<strong>${header}:</strong> ${student[header]}`;
            }

            detailContent.appendChild(div);
        }
    });

    if (headers.length > 10) {
        const seeMoreButton = document.createElement('button');
        seeMoreButton.className = 'back-button';
        seeMoreButton.textContent = 'See more';
        seeMoreButton.style.display = 'block';
        seeMoreButton.style.margin = '0 auto';
        seeMoreButton.onclick = () => {
            headers.slice(10).forEach(header => {
                if (student[header]) { // Only show if data exists
                    const div = document.createElement('div');
                    div.className = 'detail-item';
                    if (header.toLowerCase().includes('photo')) {
                        const photoContainer = document.createElement('div');
                        photoContainer.className = 'photo-container';

                        const label = document.createElement('div');
                        label.textContent = `${header}:`;
                        label.style.fontWeight = 'bold';

                        const img = document.createElement('img');
                        img.src = student[header];
                        img.alt = 'Photo';
                        img.className = 'photo';

                        const downloadButton = document.createElement('button');
                        downloadButton.className = 'download-button';
                        downloadButton.textContent = 'Download Photo';
                        downloadButton.onclick = () => downloadPhoto(student[header]);

                        photoContainer.appendChild(label);
                        photoContainer.appendChild(img);
                        photoContainer.appendChild(downloadButton);
                        div.appendChild(photoContainer);
                    } else {
                        div.innerHTML = `<strong>${header}:</strong> ${student[header]}`;
                    }
                    detailContent.appendChild(div);
                }
            });
            seeMoreButton.style.display = 'none';
            document.getElementById('backButton').style.display = 'block';
        };
        detailContent.appendChild(seeMoreButton);
        document.getElementById('backButton').style.display = 'none';
    } else {
        document.getElementById('backButton').style.display = 'block';
    }
}

function downloadPhoto(url) {
    const link = document.createElement('a');
    link.href = url;
    link.download = 'photo.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function showListPage() {
    document.getElementById('listPage').style.display = 'block';
    document.getElementById('detailPage').style.display = 'none';
}

// Prevent screenshots on mobile devices
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
        document.body.style.display = 'none';
    } else {
        document.body.style.display = 'block';
    }
});

// Prevent screenshots on PC
document.addEventListener('keydown', function(event) {
    if (event.key === 'PrintScreen') {
        event.preventDefault();
        alert('Screenshots are disabled on this page.');
    }
});

// Prevent screenshots using third-party tools
document.addEventListener('keyup', function(event) {
    if (event.key === 'PrintScreen') {
        navigator.clipboard.writeText('');
        alert('Screenshots are disabled on this page.');
    }
});

// Prevent printing of the webpage
window.onbeforeprint = function() {
    if (!isDefaultPasswordUsed) {
        alert("Printing is not allowed!");
        document.body.style.display = 'none';
    } else {
        document.body.style.display = 'block';
    }
};

window.onafterprint = function() {
    document.body.style.display = 'block';
};

// Initialize
loadData();