const pageData = [];

document.addEventListener('DOMContentLoaded', () => {
  const countSpan = document.getElementById('member-count');
  const tbody = document.querySelector('.member-table tbody');
  var currentPage = 1;

  // Populate the member list
  fetch('data/data.csv')
  .then(response => response.text())
  .then(data => {
    const rows = data.split('\n').slice(1);
    rows.forEach(row => {
      pageData.push(row.split(','));
    });
    updateMemberList(currentPage, pageData);
    countSpan.textContent = rows.length;
  });

  setTimeout(() => tbody.style.opacity = 1, 100);
  const arrows = document.querySelectorAll('.arrow');
  arrows.forEach(arrow => {
    arrow.addEventListener('click', () => {
      if (arrow.classList.contains('left') && currentPage > 1) {
        tbody.style.opacity = 0;
        currentPage = currentPage - 1;
        updateMemberList(currentPage, pageData);
        setTimeout(() => tbody.style.opacity = 1, 400);
      } else if (arrow.classList.contains('right') && currentPage < Math.ceil(pageData.length / 10)) {
        tbody.style.opacity = 0;
        currentPage = currentPage + 1;
        updateMemberList(currentPage, pageData);
        setTimeout(() => tbody.style.opacity = 1, 400);
      }
    });
  });
  updateLastCommitDate();
});

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
  setTimeout (() => {
    pageData.forEach(row => {
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
    }, 400);
  });

  const pageNumber = document.querySelector('.page-number');
  pageNumber.textContent = `${currentPage}`;
  leftArrow.style.opacity = 1;
  rightArrow.style.opacity = 1;
  if (currentPage <= 1) {
    leftArrow.style.opacity = 0;
  } else if (currentPage >= Math.ceil(data.length / 10)) {
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
      
      // Format the date (e.g., "August 14, 2025, 10:47 PM")
      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      };
      const formattedDate = commitDate.toLocaleDateString('en-US', options);
      
      // Update the footer
      document.getElementById('last-updated').textContent = formattedDate;
    } catch (error) {
      console.error('Error fetching commit date:', error);
      document.getElementById('last-updated').textContent = 'Unable to fetch update time';
    }
  }