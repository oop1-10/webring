const pageData = [];

document.addEventListener('DOMContentLoaded', () => {
  const countSpan = document.getElementById('member-count');
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
  
  const arrows = document.querySelectorAll('.arrow');
  arrows.forEach(arrow => {
    arrow.addEventListener('click', () => {
      if (arrow.classList.contains('left') && currentPage > 1) {
        currentPage = currentPage - 1;
      } else if (arrow.classList.contains('right') && currentPage < Math.ceil(pageData.length / 10)) {
        currentPage = currentPage + 1;
      }
      updateMemberList(currentPage, pageData);
    });
  });
});

function updateMemberList(currentPage, data) {
  const memberList = document.querySelector('.member-list');
  memberList.replaceChildren();
  const start = (currentPage - 1) * 10;
  const end = start + 10;
  const pageData = data.slice(start, end);
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
  });
  const pageNumber = document.querySelector('.page-number');
  pageNumber.textContent = `${currentPage}`;
}