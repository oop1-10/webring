document.addEventListener('DOMContentLoaded', () => {
  const memberList = document.querySelector('.member-list');
  const countSpan = document.getElementById('member-count');

  // Populate the member list
  fetch('data/data.csv')
  .then(response => response.text())
  .then(data => {
    const rows = data.split('\n').slice(1);
    rows.forEach(row => {
      const cols = row.split(',');
      if (cols.length === 5) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><a href="${cols[0]}"><img src="${cols[0]}/favicon.ico"></a></td>
          <td><a href="${cols[0]}" target="_blank" rel="noopener noreferrer">${cols[0].replace('https://', '')}</a></td>
          <td>${cols[1]}</td>
          <td>${cols[2]}</td>
          <td>${cols[3]}</td>
          <td>${cols[4]}</td>
        `;
        memberList.appendChild(tr);
        
      }
    });
    countSpan.textContent = rows.length;
  });
  
  
});