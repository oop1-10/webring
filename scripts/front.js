const pageData = [];
let headingList = [];
let currentData = [];
let currentPage = 1;
let originalIndexMap = null;

document.addEventListener('DOMContentLoaded', () => {
  const countSpan = document.getElementById('member-count');
  headingList = document.querySelectorAll('.member-table th');

  // Populate the member list
  fetch('https://gist.githubusercontent.com/oop1-10/d5e6254545c342cc43f0a0ea4737085f/raw/e45acd62daeb4b236a16cccffc35720ad8f6edc9/data.csv')
    .then(response => response.text())
    .then(data => {
      const rows = data.split('\n').slice(1).filter(r => r.trim().length);
      rows.forEach(row => {
        pageData.push(row.split(','));
      });
      currentData = pageData.slice();
      originalIndexMap = new Map(pageData.map((row, i) => [row, i]));
      updateMemberList(currentPage, currentData);
      countSpan.textContent = rows.length;
    });

  const table = document.querySelector('.member-table');
  const theadRow = table.tHead ? table.tHead.rows[0] : table.querySelector('thead tr');
  const headers = Array.from(theadRow ? theadRow.cells : []);
  const keyMap = [null, 'website', 'name', 'program', 'year', 'degree'];

  headers.forEach((th, idx) => {
    const key = keyMap[idx];
    if (!key) return;
    th.dataset.key = key;
    if (!th.dataset.state) th.dataset.state = '0'; // 0=original, 1=desc, 2=asc
    th.style.cursor = 'pointer';
    th.dataset.label = th.dataset.label || th.textContent.trim();
    setHeaderIcon(th);
    th.addEventListener('click', () => sortByHeading(key, th));
  });

  setTimeout(() => table.style.opacity = 1, 100);

  const arrows = document.querySelectorAll('.arrow');
  arrows.forEach(arrow => {
    arrow.addEventListener('click', () => {
      const maxPage = Math.ceil((currentData.length || 0) / 10) || 1;
      if (arrow.classList.contains('left') && currentPage > 1) {
        table.style.opacity = 0;
        currentPage = currentPage - 1;
        setTimeout(() => updateMemberList(currentPage, currentData), 200);
        setTimeout(() => table.style.opacity = 1, 300);
      } else if (arrow.classList.contains('right') && currentPage < maxPage) {
        table.style.opacity = 0;
        currentPage = currentPage + 1;
        setTimeout(() => updateMemberList(currentPage, currentData), 200);
        setTimeout(() => table.style.opacity = 1, 300);
      }
    });
  });
  updateLastCommitDate();
});

// Add helpers to manage header icons
function setHeaderIcon(th) {
  if (!th.dataset.key) return;
  const label = th.dataset.label || th.textContent.trim();
  const state = th.dataset.state || '0';
  // 1 => desc ▼, 2 => asc ▲, 0 => no icon
  const icon = state === '1' ? ' ▼' : state === '2' ? ' ▲' : '';
  th.textContent = label + icon;
}

function refreshHeaderIcons() {
  document.querySelectorAll('.member-table thead th').forEach(h => setHeaderIcon(h));
}

function sortByHeading(key, th) {
  if (!originalIndexMap) return;

  // Cycle this header's state: 0 -> 1 (desc), 1 -> 2 (asc), 2 -> 0 (original)
  const current = Number(th.dataset.state || '0');
  const next = (current + 1) % 3;
  th.dataset.state = String(next);

  // Reset other headers to original state
  document.querySelectorAll('.member-table thead th').forEach(h => {
    if (h !== th) h.dataset.state = '0';
  });

  let sorted;

  if (next === 0) {
    sorted = pageData.slice();
  } else if (key === 'website') {
    sorted = pageData.slice().sort((a, b) => {
      const ai = originalIndexMap.get(a);
      const bi = originalIndexMap.get(b);
      return next === 1 ? bi - ai : ai - bi;
    });
  } else if (key === 'name') {
    sorted = pageData.slice().sort((a, b) => {
      const av = String(a[1] || '').toLowerCase();
      const bv = String(b[1] || '').toLowerCase();
      const cmp = av.localeCompare(bv);
      return next === 1 ? -cmp : cmp;
    });
  } else if (key === 'program') {
    sorted = pageData.slice().sort((a, b) => {
      const ap = String(a[2] || '');
      const bp = String(b[2] || '');
      const ae = /\bengineering\b|\bengineer(ing)?\b|\beng\b/i.test(ap) ? 0 : 1;
      const be = /\bengineering\b|\bengineer(ing)?\b|\beng\b/i.test(bp) ? 0 : 1;
      const groupCmp = next === 1 ? ae - be : be - ae;
      if (groupCmp !== 0) return groupCmp;
      const cmp = ap.toLowerCase().localeCompare(bp.toLowerCase());
      return next === 1 ? -cmp : cmp;
    });
  } else if (key === 'year') {
    sorted = pageData.slice().sort((a, b) => {
      const ay = parseInt(a[3], 10);
      const by = parseInt(b[3], 10);
      const av = Number.isNaN(ay) ? -Infinity : ay;
      const bv = Number.isNaN(by) ? -Infinity : by;
      return next === 1 ? bv - av : av - bv;
    });
  } else if (key === 'degree') {
    const degreeRank = (s) => {
      const t = String(s || '').toLowerCase();
      if (/(ph\.?d|doctor|doctoral)/.test(t)) return 3;
      if (/(m\.?s|m\.?eng|master|mse|m\.?sc)/.test(t)) return 2;
      if (/(b\.?s|b\.?sc|bachelor|ba)/.test(t)) return 1;
      return 0;
    };
    sorted = pageData.slice().sort((a, b) => {
      const ad = degreeRank(a[4]);
      const bd = degreeRank(b[4]);
      return next === 1 ? bd - ad : ad - bd;
    });
  } else {
    sorted = pageData.slice();
  }

  currentData = sorted;

  const table = document.querySelector('.member-table');
  const maxPage = Math.ceil((currentData.length || 0) / 10) || 1;
  if (currentPage > maxPage) currentPage = maxPage;

  table.style.opacity = 0;
  // Update icons based on new states
  setTimeout(() => {
    updateMemberList(currentPage, currentData);
    refreshHeaderIcons();
  }, 200);
  setTimeout(() => table.style.opacity = 1, 300);
}

function updateMemberList(currentPage, data) {
  const memberList = document.querySelector('.member-list');
  const tbody = document.querySelector('.member-table tbody');
  const start = (currentPage - 1) * 10;
  const end = start + 10;
  const pageData = data.slice(start, end);
  const leftArrow = document.getElementById('left');
  const rightArrow = document.getElementById('right');

  const rowHeight = 50;
  const headerHeight = 40;
  const numRows = pageData.length;
  const newHeight = headerHeight + numRows * rowHeight;
  tbody.style.height = `${newHeight}px`;

  memberList.replaceChildren();
  setTimeout(() => {
    pageData.forEach(row => {
      if (row[6] === "True") {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><a href="${row[0]}"><img src="${row[5]}"></a></td>
          <td><a href="${row[0]}" target="_blank" rel="noopener noreferrer">${row[0].replace('https://', '')}</a></td>
          <td>${row[1]}</td>
          <td>${row[2]}</td>
          <td>${row[3]}</td>
          <td>${row[4]}</td>
        `;
        memberList.appendChild(tr);
      }
    }, 200);
  });

  const pageNumber = document.querySelector('.page-number');
  pageNumber.textContent = `${currentPage}`;
  leftArrow.style.opacity = 1; rightArrow.style.opacity = 1;

  const maxPage = Math.ceil((data.length || 0) / 10) || 1;
  if (currentPage <= 1) {
    leftArrow.style.opacity = 0;
  } else if (currentPage >= maxPage) {
    rightArrow.style.opacity = 0;
  }
}

async function updateLastCommitDate() {
    try {
      const response = await fetch('https://api.github.com/repos/oop1-10/webring/commits');
      if (!response.ok) {
        throw new Error('Failed to fetch commits');
      }
      const commits = await response.json();
      const latestCommit = commits[0]; // Get the most recent commit
      const commitDate = new Date(latestCommit.commit.author.date);
      
      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      };
      const formattedDate = commitDate.toLocaleDateString('en-US', options);
      
      document.getElementById('last-updated').textContent = formattedDate;
    } catch (error) {
      console.error('Error fetching commit date:', error);
      document.getElementById('last-updated').textContent = 'Unable to fetch update time';
    }
  }