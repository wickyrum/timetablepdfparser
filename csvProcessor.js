const csv = require('csv-parser');
const fs  = require('fs');

function getLastDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function analyzeEntry(entry) {
  const d        = new Date(entry.timestamp);
  const hour     = d.getHours();
  const day      = d.getDay();
  const date     = d.getDate();
  const lastDay  = getLastDayOfMonth(d);

  return {
    id:         entry.entry_id,
    timestamp:  entry.timestamp,
    amount:     entry.amount,
    postedBy:   entry.posted_by,
    account:    entry.account,
    afterHours: hour < 8 || hour >= 20,
    weekend:    day === 0 || day === 6,
    periodEnd:  date >= lastDay - 2,  
  };
}

function processCsv(csvFile) {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(csvFile)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        const analyzed = results.map(analyzeEntry);
        resolve(analyzed);
      })
      .on('error', reject);
  });
}

module.exports = { processCsv };
