let allRows       = [];
let currentFilter = 'all';

const dropZone      = document.getElementById('drop-zone');
const fileInput     = document.getElementById('file-input');
const loadingEl     = document.getElementById('loading');
const statsEl       = document.getElementById('stats');
const resultsEl     = document.getElementById('results-section');
const tbody         = document.getElementById('tbody');


dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', function () {
  if (this.files[0]) handleFile(this.files[0]);
});

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

async function handleFile(file) {
  showLoading(true);

  const formData = new FormData();
  formData.append('csvfile', file);  

  try {
    const response = await fetch('/analyze', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Server error: ' + response.status);

    allRows = await response.json();
    render();

  } catch (err) {
    alert('Something went wrong: ' + err.message);

  } finally {
    showLoading(false);
  }
}

function render() {
  if (!allRows.length) return;

  updateStats();
  updateTable();

  statsEl.style.display   = 'grid';
  resultsEl.style.display = 'block';
}

function updateStats() {
  const total   = allRows.length;
  const ah      = allRows.filter(r => r.afterHours).length;
  const wk      = allRows.filter(r => r.weekend).length;
  const pe      = allRows.filter(r => r.periodEnd).length;
  const flagged = allRows.filter(r => r.afterHours || r.weekend || r.periodEnd).length;

  document.getElementById('s-total').textContent = total;
  document.getElementById('s-ah').textContent    = ah;
  document.getElementById('s-wk').textContent    = wk;
  document.getElementById('s-pe').textContent    = pe;
  document.getElementById('s-fl').textContent    = flagged;
  document.getElementById('s-ok').textContent    = total - flagged;
}

function updateTable() {
  const filtered = filterRows(allRows, currentFilter);

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">No entries match this filter</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(rowHtml).join('');
}

function rowHtml(r) {
  const isFlagged = r.afterHours || r.weekend || r.periodEnd;

  return `
    <tr class="${isFlagged ? 'flagged' : ''}">
      <td><code>${r.id}</code></td>
      <td>${r.timestamp ?? '—'}</td>
      <td>${r.amount != null ? '₹' + Number(r.amount).toLocaleString() : '—'}</td>
      <td>${r.postedBy ?? '—'}</td>
      <td>${r.account  ?? '—'}</td>
      <td>${pillsHtml(r)}</td>
    </tr>
  `;
}

function pillsHtml(r) {
  let html = '';
  if (r.afterHours) html += '<span class="pill pill-ah">after hours</span>';
  if (r.weekend)    html += '<span class="pill pill-wk">weekend</span>';
  if (r.periodEnd)  html += '<span class="pill pill-pe">period-end</span>';
  if (!html)         html  = '<span class="pill pill-ok">clear</span>';
  return html;
}

function filterRows(rows, filter) {
  if (filter === 'all')        return rows;
  if (filter === 'flagged')    return rows.filter(r => r.afterHours || r.weekend || r.periodEnd);
  if (filter === 'afterhours') return rows.filter(r => r.afterHours);
  if (filter === 'weekend')    return rows.filter(r => r.weekend);
  if (filter === 'periodend')  return rows.filter(r => r.periodEnd);
  return rows;
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateTable();
  });
});

document.getElementById('export-btn').addEventListener('click', () => {
  const flagged = allRows.filter(r => r.afterHours || r.weekend || r.periodEnd);

  if (!flagged.length) {
    alert('No flagged entries to export.');
    return;
  }

  const headers = ['entry_id', 'timestamp', 'amount', 'posted_by', 'account', 'after_hours', 'weekend', 'period_end'];

  const rows = flagged.map(r => [
    r.id, r.timestamp, r.amount, r.postedBy, r.account,
    r.afterHours, r.weekend, r.periodEnd
  ]);

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

  const a    = document.createElement('a');
  a.href     = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'flagged_entries.csv';
  a.click();
});

function showLoading(show) {
  loadingEl.style.display   = show ? 'block' : 'none';
  statsEl.style.display     = show ? 'none'  : statsEl.style.display;
  resultsEl.style.display   = show ? 'none'  : resultsEl.style.display;
}
