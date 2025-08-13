// Secure cookies
document.cookie = "SameSite=Strict; Secure";

let sheetData = [];
let columnOrder = [];
let homeShowColumns = [4, 6, 5];
let sortableColumns = [];
let showColumns = [];
let sheetId = '1sXHffTidfkqje0fhZbt6mfT3OD2xl1LQO6XAZr0_zbE';
let sheetName = ''; // Initialize as empty
let csvUrl = '';
let filteredData = [];

// Fetch CSV data
async function fetchData() {
    try {
        const response = await fetch(csvUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const csv = await response.text();
        const results = Papa.parse(csv, { header: true });
        if (results.errors.length) {
            throw new Error('Error parsing CSV data');
        }
        sheetData = results.data;
        columnOrder = Object.keys(sheetData[0]);
        filteredData = sheetData.slice(0, 520); // Show first 20 items
        renderCards(filteredData);
        sortableColumns = JSON.parse(localStorage.getItem('sortableColumns')) || [];
        showColumns = JSON.parse(localStorage.getItem('showColumns')) || columnOrder.map((_, index) => index);
        renderSortOptions();
        renderShowColumns();
        updateDataCount(filteredData.length);
    } catch (error) {
        console.error('Error fetching data:', error);
         
    }
}

// Render initial cards
function renderCards(data) {
    const container = document.getElementById('cardContainer');
    container.innerHTML = data.map((item, index) => `
        <div class="card" onclick="showDetails(${index}, ${data === sheetData ? 'false' : 'true'})">
            ${homeShowColumns.map(colIndex => `
                <p>${item[columnOrder[colIndex]]}</p>
            `).join('')}
        </div>
    `).join('');
}

// Render sort options
function renderSortOptions() {
    const sortSelect = document.getElementById('sortSelect');
    sortSelect.innerHTML = sortableColumns.map(colIndex => `
        <option value="${colIndex}">Sort by ${columnOrder[colIndex]}</option>
    `).join('');
}

// Filter data based on search input
function filterData() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    filteredData = sheetData.filter(item => 
        homeShowColumns.some(colIndex => 
            item[columnOrder[colIndex]].toLowerCase().includes(query)
        )
    ).slice(0, 500); // Show first 20 items
    renderCards(filteredData);
    updateDataCount(filteredData.length);
}

// Show details page
function showDetails(index, isFiltered) {
    const item = isFiltered ? filteredData[index] : sheetData[index];
    const detailsPage = document.getElementById('details-page');
    const groupedData = {};

    // Group data by sections dynamically
    columnOrder.forEach(colName => {
        if (!colName.startsWith('hide_') && colName !== 'photo') {
            const group = colName.includes('_') ? colName.split('_')[0] : 'Other';
            if (!groupedData[group]) {
                groupedData[group] = [];
            }
            groupedData[group].push({ colName, value: item[colName] || '<span class="null-data">N/A</span>' });
        }
    });

    // Ensure "Other" group is at the bottom
    const sortedGroups = Object.keys(groupedData).sort((a, b) => {
        if (a === 'Other') return 1;
        if (b === 'Other') return -1;
        return 0;
    });

    // Render grouped data
    detailsPage.innerHTML = `
        ${item.photo ? `<img src="${item.photo}" alt="Photo">` : ''}
        ${sortedGroups.map(group => groupedData[group].length > 0 ? `
            <div class="group-card">
                <h3>${group}</h3>
                ${groupedData[group].map(data => `
                    <div class="detail-card" style="${data.value === '<span class="null-data">N/A</span>' ? 'background-color: rgba(255, 255, 0, 0.2);' : ''}">
                        <p><strong>${data.colName.includes('_') ? data.colName.split('_')[1] : data.colName}:</strong> ${data.value}</p>
                    </div>
                `).join('')}
            </div>
        ` : '').join('')}
        <button class="back-button" onclick="showPage('home')">Back</button>
        <div class="footer" id="footer"></div>
    `;
    showPage('details');
    updateFooter();
}

function updateFooter() {
    const footer = document.getElementById('footer');
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true };
    footer.innerHTML = `${now.toLocaleString('en-US', options)}<br>Office Room - 2025`;
}

// Page navigation
function showPage(page) {
    document.querySelectorAll('[id$="-page"]').forEach(el => {
        el.style.display = 'none';
    });
    document.getElementById(`${page}-page`).style.display = 'block';
}

// Update data count
function updateDataCount(count) {
    const dataCount = document.getElementById('dataCount');
    dataCount.textContent = `Showing ${count} items`;
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    const p3Element = document.querySelector('p3');
    if (p3Element) {
        sheetName = p3Element.textContent.trim();
        csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
        console.log(`sheetName: ${sheetName}, csvUrl: ${csvUrl}`); // For debugging
        fetchData();
    }
});
