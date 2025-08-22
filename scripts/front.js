const pageData = [];
let headingList = [];
let currentData = [];
let currentPage = 1;
let originalIndexMap = null;
let searchInput = null;
let searchQuery = '';
let filteredData = null;

document.addEventListener('DOMContentLoaded', () => {
  const countSpan = document.getElementById('member-count');
  headingList = document.querySelectorAll('.member-table th');

  // Populate the member list
  fetch('https://gist.githubusercontent.com/oop1-10/d5e6254545c342cc43f0a0ea4737085f/raw/data.csv')
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
  const keyMap = [null, 'website', 'fname', 'lname', 'program', 'year', 'degree'];

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

  const body = document.querySelector('body');
  setTimeout(() => body.style.opacity = 1, 50);

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

  searchInput = document.querySelector('.searchBar');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = (searchInput.value || '').trim();
      if (!searchQuery) {
        filteredData = null;
      } else {
        filteredData = rankAndFilter(searchQuery, pageData);
      }
      recomputeDataAndRender({ resetPage: true });
    });
  }

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

function getActiveSort() {
  const active = Array.from(document.querySelectorAll('.member-table thead th'))
    .find(h => (h.dataset.state || '0') !== '0' && h.dataset.key);
  if (!active) return null;
  return { key: active.dataset.key, state: Number(active.dataset.state || '0') };
}

function sortArrayBy(base, key, state) {
  const dir = state === 1 ? -1 : 1;
  const arr = base.slice();

  if (key === 'website') {
    arr.sort((a, b) => {
      const ai = originalIndexMap.get(a);
      const bi = originalIndexMap.get(b);
      return dir * (ai - bi);
    });
    return arr;
  }

  if (key === 'fname' || key === 'lname') {
    const idx = key === 'fname' ? 1 : 2;
    arr.sort((a, b) =>
      dir * String(a[idx] || '').toLowerCase().localeCompare(String(b[idx] || '').toLowerCase())
    );
    return arr;
  }

  if (key === 'program') {
    const isEng = s => /\bengineering\b|\bengineer(ing)?\b|\beng\b/i.test(String(s || ''));
    arr.sort((a, b) => {
      const ae = isEng(a[3]) ? 0 : 1;
      const be = isEng(b[3]) ? 0 : 1;
      if (ae !== be) return dir * (ae - be);
      return dir * String(a[3] || '').toLowerCase().localeCompare(String(b[3] || '').toLowerCase());
    });
    return arr;
  }

  if (key === 'year') {
    arr.sort((a, b) => {
      const ay = parseInt(a[4], 10); const by = parseInt(b[4], 10);
      const av = Number.isNaN(ay) ? -Infinity : ay;
      const bv = Number.isNaN(by) ? -Infinity : by;
      return dir * (av - bv);
    });
    return arr;
  }

  if (key === 'degree') {
    const degreeRank = (s) => {
      const t = String(s || '').toLowerCase();
      if (/(ph\.?d|doctor|doctoral)/.test(t)) return 3;
      if (/(m\.?s|m\.?eng|master|mse|m\.?sc)/.test(t)) return 2;
      if (/(b\.?s|b\.?sc|bachelor|ba)/.test(t)) return 1;
      return 0;
    };
    arr.sort((a, b) => dir * (degreeRank(a[5]) - degreeRank(b[5])));
    return arr;
  }

  return arr;
}

function rankAndFilter(query, rows) {
  const q = query.toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);
  const results = [];

  const normUrl = (u) => String(u || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
  const originalIdx = (row) => originalIndexMap.get(row);

  for (const row of rows) {
    const url = normUrl(row[0]);
    const fname = String(row[1] || '').toLowerCase();
    const lname = String(row[2] || '').toLowerCase();
    const fullName = (fname && lname) ? `${fname} ${lname}` : fname || lname;
    const revFull = (fname && lname) ? `${lname} ${fname}` : fullName;
    const program = String(row[3] || '').toLowerCase();
    const yearStr = String(row[4] || '').toLowerCase();
    const degree = String(row[5] || '').toLowerCase();

    let score = 0;

    // Exact / full matches
    if (q && fullName === q) score += 35;
    if (q && revFull === q) score += 30;
    if (q && fname === q) score += 22;
    if (q && lname === q) score += 22;
    if (q && program === q) score += 18;
    if (q && url.startsWith(q)) score += 14;

    if (q && fullName.startsWith(q)) score += 20;
    if (q && fname.startsWith(q)) score += 12;
    if (q && lname.startsWith(q)) score += 12;
    if (q && program.startsWith(q)) score += 12;
    if (q && degree.startsWith(q)) score += 8;

    for (const t of tokens) {
      const isNum = /^\d{1,4}$/.test(t);

      if (isNum) {
        if (yearStr === t) score += 20;
        else if (yearStr.startsWith(t)) score += 10;
      }

      // Name token scoring
      if (fname.startsWith(t)) score += 10;
      else if (fname.includes(t)) score += 6;

      if (lname.startsWith(t)) score += 10;
      else if (lname.includes(t)) score += 6;

      if (fullName.includes(t)) score += 4;

      // Program
      if (program.startsWith(t)) score += 9;
      else if (program.includes(t)) score += 6;

      // Degree
      if (degree.startsWith(t)) score += 5;
      else if (degree.includes(t)) score += 3;

      // URL
      if (url.startsWith(t)) score += 7;
      else if (url.includes(t)) score += 4;
    }

    if (score > 0) {
      results.push({ row, score, idx: originalIdx(row) });
    }
  }

  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.idx - b.idx;
  });

  return results.map(r => r.row);
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

  // Recompute using current search/filter and active sort state
  recomputeDataAndRender({ resetPage: false });
}

function recomputeDataAndRender({ resetPage }) {
  const table = document.querySelector('.member-table');
  const activeSort = getActiveSort();

  let base = searchQuery ? (filteredData || []) : pageData.slice();

  // If sorting is active, apply it to the chosen base; else keep rank order for search or original order.
  if (activeSort && activeSort.state !== 0) {
    base = sortArrayBy(base, activeSort.key, activeSort.state);
  }

  currentData = base;

  // Reset page when query changes or when requested
  const maxPage = Math.ceil((currentData.length || 0) / 10) || 1;
  if (resetPage) currentPage = 1;
  if (currentPage > maxPage) currentPage = maxPage;

  table.style.opacity = 0;
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

  const rowHeight = 50; const headerHeight = 40;
  const numRows = pageData.length;
  const newHeight = headerHeight + numRows * rowHeight;
  tbody.style.height = `${newHeight}px`;

  memberList.replaceChildren();
  setTimeout(() => {
    pageData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><a href="${row[0]}"><img src="${row[6]}"></a></td>
          <td><a href="${row[0]}" target="_blank" rel="noopener noreferrer">${row[0].replace('https://', '')}</a></td>
          <td>${row[2]}, ${row[1]}</td>
          <td>${row[3]}</td>
          <td>${row[4]}</td>
          <td>${row[5]}</td>
        `;
        memberList.appendChild(tr);
    }, 200);
  });

  const pageNumber = document.querySelector('.page-number');
  pageNumber.textContent = `${currentPage}`;
  leftArrow.style.opacity = 1; rightArrow.style.opacity = 1;

  const maxPage = Math.ceil((data.length || 0) / 10) || 1;
  if (currentPage <= 1) {
    leftArrow.style.opacity = 0;
  }
  if (currentPage >= maxPage) {
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

function updateTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const icon = document.querySelector('.theme-toggle img');
  icon.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  icon.style.opacity = '0';
  setTimeout(() => {
    icon.src = currentTheme === 'dark' ? '/images/light-theme-icon.svg' : '/images/dark-theme-icon.png';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    icon.style.opacity = '1';
  }, 200);
}