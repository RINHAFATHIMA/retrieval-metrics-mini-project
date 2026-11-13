
import fs from 'node:fs';

// 1. Load test set
function loadTestSet(path) {
  const lines = fs.readFileSync(path, 'utf8').trim().split('\n').slice(1);

  return lines.map(line => {
    const [query, ids] = line.split(',');
    return {
      query,
      correctIds: ids.split(';').map(Number)
    };
  });
}

const testSet = loadTestSet('test-set.csv');

// Load search results
const results = JSON.parse(
  fs.readFileSync('search-results.json', 'utf8')
);

// 2. Reciprocal Rank
function reciprocalRank(rankedIds, correctIds) {
  const rank = rankOf(rankedIds, correctIds);

  return rank === null ? 0 : 1 / rank;
}

// Find first correct answer rank
function rankOf(rankedIds, correctIds) {
  const index = rankedIds.findIndex(id =>
    correctIds.includes(Number(id))
  );

  return index === -1 ? null : index + 1;
}

// 3. Evaluation loop
const keywordRRs = [];
const semanticRRs = [];

let keywordHits = 0;
let semanticHits = 0;

for (const { query, correctIds } of testSet) {
  const keywordIds = results[query].keyword;
  const semanticIds = results[query].semantic;

  const keywordRR = reciprocalRank(keywordIds, correctIds);
  const semanticRR = reciprocalRank(semanticIds, correctIds);

  keywordRRs.push(keywordRR);
  semanticRRs.push(semanticRR);

  if (keywordRR > 0) keywordHits++;
  if (semanticRR > 0) semanticHits++;
}

// Calculate averages
const mean = values =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

const keywordMRR = mean(keywordRRs);
const semanticMRR = mean(semanticRRs);

const keywordRecall = keywordHits / testSet.length;
const semanticRecall = semanticHits / testSet.length;

// 4. Print comparison table
console.log('| Query | Keyword rank | Semantic rank |');
console.log('|---|---|---|');

for (const { query, correctIds } of testSet) {
  const keywordRank = rankOf(results[query].keyword, correctIds);
  const semanticRank = rankOf(results[query].semantic, correctIds);

  console.log(
    `| ${query} | ${keywordRank ?? 'miss'} | ${semanticRank ?? 'miss'} |`
  );
}

// Print summary
console.log(
  `| **Summary** | **MRR ${keywordMRR.toFixed(2)} · Recall@10 ${keywordRecall.toFixed(2)}** | **MRR ${semanticMRR.toFixed(2)} · Recall@10 ${semanticRecall.toFixed(2)}** |`
);