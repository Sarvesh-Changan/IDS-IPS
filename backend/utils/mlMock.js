// Mapping of label numbers to attack types (from your prompt)
const labelNames = {
  1: 'Benign',
  2: 'Brute Force Web',
  3: 'FTP Brute Force',
  4: 'DDoS',
  5: 'BAT',
  6: 'SSN brute force',
  7: 'GoldenEye',
  8: 'GoldenEye',
  9: 'Slowloris',
  10: 'Brute Force XSS',
  11: 'SQL Injection'
};

// Sample attack records from your Excel (first few rows)
const sampleAttacks = [
  // Copy the rows from your Excel snippet as objects
  // For brevity, only a few fields are shown; you would include all features.
  {
    dstPort: 3389, flowDuration: 5206015, totFwdPkts: 9, totBwdPkts: 11,
    totLenFwdPkts: 1213, totLenBwdPkts: 1948, fwdPktLenMax: 661,
    fwdPktLenMean: 134.7777778, bwdPktLenMean: 177.0909091, bwdPktLenStd: 347.9371939,
    flowBytsPerSec: 607.182269, flowPktsPerSec: 3.841710022, flowIATMean: 274000.7895,
    flowIATStd: 487382.2997, flowIATMax: 1906221, fwdIATMean: 650751.9,
    bwdIATStd: 591640.0074, finFlagCnt: 0, synFlagCnt: 0, rstFlagCnt: 1,
    ackFlagCnt: 0, fwdSegSizeAvg: 134.77777, initFwdWinByts: 8192, initBwdWinByts: 62872,
    protocol: 6, predictedLabel: 1  // benign
  },
  // ... add more rows as needed
];

// Simple mock classifier: returns a random attack from the sample set
// with slight variations to simulate real-time.
function classifyAttack(partialFeatures = {}) {
  // In reality you would send features to a Python model
  // Here we just pick a random sample and assign random confidence/risk.
  const base = sampleAttacks[Math.floor(Math.random() * sampleAttacks.length)];
  const confidence = 0.7 + Math.random() * 0.25;
  let risk = 'Low';
  if (base.predictedLabel !== 1) { // not benign
    if (confidence > 0.9) risk = 'High';
    else if (confidence > 0.7) risk = 'Medium';
  }
  return {
    ...base,
    confidence,
    riskLevel: risk,
    // override with any provided features (e.g., IPs)
    ...partialFeatures
  };
}

module.exports = { classifyAttack, labelNames };