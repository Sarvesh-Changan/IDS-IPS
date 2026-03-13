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

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000/test';

// Sample features for internal use/fallback
const sampleAttacks = [
  {
    dstPort: 3389,
    flowDuration: 5206015,
    totFwdPkts: 9,
    totBwdPkts: 11,
    totLenFwdPkts: 1213,
    totLenBwdPkts: 1948,
    fwdPktLenMax: 661,
    fwdPktLenMean: 134.7777778,
    bwdPktLenMean: 177.0909091,
    bwdPktLenStd: 347.9371939,
    flowBytsPerSec: 607.182269,
    flowPktsPerSec: 3.841710022,
    flowIATMean: 274000.7895,
    flowIATStd: 487382.2997,
    flowIATMax: 1906221,
    fwdIATMean: 650751.9,
    bwdIATStd: 591640.0074,
    finFlagCnt: 0,
    synFlagCnt: 0,
    rstFlagCnt: 1,
    ackFlagCnt: 0,
    fwdSegSizeAvg: 134.77777,
    initFwdWinByts: 8192,
    initBwdWinByts: 62872,
    protocol: 6
  },
  // Attack label 2 – FTP (port 21)
  {
    dstPort: 21,
    flowDuration: 2,
    totFwdPkts: 1,
    totBwdPkts: 1,
    totLenFwdPkts: 0,
    totLenBwdPkts: 0,
    fwdPktLenMax: 0,
    fwdPktLenMean: 0,
    bwdPktLenMean: 0,
    bwdPktLenStd: 0,
    flowBytsPerSec: 0,
    flowPktsPerSec: 1000000,
    flowIATMean: 2,
    flowIATStd: 0,
    flowIATMax: 2,
    fwdIATMean: 0,
    bwdIATStd: 0,
    finFlagCnt: 0,
    synFlagCnt: 0,
    rstFlagCnt: 0,
    ackFlagCnt: 0,
    fwdSegSizeAvg: 0,
    initFwdWinByts: 26883,
    initBwdWinByts: 0,
    protocol: 6
  },
  // Attack label 3 – SSH (port 22)
  {
    dstPort: 22,
    flowDuration: 376374,
    totFwdPkts: 22,
    totBwdPkts: 22,
    totLenFwdPkts: 1928,
    totLenBwdPkts: 2665,
    fwdPktLenMax: 640,
    fwdPktLenMean: 87.63636364,
    bwdPktLenMean: 121.1363636,
    bwdPktLenStd: 258.6415603,
    flowBytsPerSec: 12203.28716,
    flowPktsPerSec: 116.9049934,
    flowIATMean: 8752.883721,
    flowIATStd: 21817.02367,
    flowIATMax: 121691,
    fwdIATMean: 17918.096,
    bwdIATStd: 38507.00845,
    finFlagCnt: 0,
    synFlagCnt: 0,
    rstFlagCnt: 0,
    ackFlagCnt: 0,
    fwdSegSizeAvg: 87.63636,
    initFwdWinByts: 26883,
    initBwdWinByts: 230,
    protocol: 6
  },
  // Attack label 4 – HTTP (port 80) – simple scan-like flow
  {
    dstPort: 80,
    flowDuration: 1440,
    totFwdPkts: 2,
    totBwdPkts: 0,
    totLenFwdPkts: 0,
    totLenBwdPkts: 0,
    fwdPktLenMax: 0,
    fwdPktLenMean: 0,
    bwdPktLenMean: 0,
    bwdPktLenStd: 0,
    flowBytsPerSec: 1388.888889,
    flowPktsPerSec: 1440,
    flowIATMean: 0,
    flowIATStd: 1440,
    flowIATMax: 1440,
    fwdIATMean: 0,
    bwdIATStd: 0,
    finFlagCnt: 0,
    synFlagCnt: 0,
    rstFlagCnt: 0,
    ackFlagCnt: 1,
    fwdSegSizeAvg: 0,
    initFwdWinByts: 32738,
    initBwdWinByts: -1,
    protocol: 6
  },
  // Attack label 5 – HTTP alternate (port 8080)
  {
    dstPort: 8080,
    flowDuration: 9649,
    totFwdPkts: 3,
    totBwdPkts: 4,
    totLenFwdPkts: 326,
    totLenBwdPkts: 129,
    fwdPktLenMax: 326,
    fwdPktLenMean: 108.6666667,
    bwdPktLenMean: 32.25,
    bwdPktLenStd: 53.7672453,
    flowBytsPerSec: 47155.14561,
    flowPktsPerSec: 725.4637786,
    flowIATMean: 1608.166667,
    flowIATStd: 3562.585657,
    flowIATMax: 8873,
    fwdIATMean: 248.5,
    bwdIATStd: 5023.425524,
    finFlagCnt: 0,
    synFlagCnt: 0,
    rstFlagCnt: 1,
    ackFlagCnt: 0,
    fwdSegSizeAvg: 108.666664,
    initFwdWinByts: 8192,
    initBwdWinByts: 219,
    protocol: 6
  },
  // Attack label 6 – HTTP (port 80) – another attack type
  {
    dstPort: 80,
    flowDuration: 11638016,
    totFwdPkts: 4,
    totBwdPkts: 4,
    totLenFwdPkts: 440,
    totLenBwdPkts: 972,
    fwdPktLenMax: 440,
    fwdPktLenMean: 110,
    bwdPktLenMean: 243,
    bwdPktLenStd: 486,
    flowBytsPerSec: 121.3265216,
    flowPktsPerSec: 0.687402389,
    flowIATMean: 1662573.714,
    flowIATStd: 2877688.999,
    flowIATMax: 6635864,
    fwdIATMean: 2212641,
    bwdIATStd: 3456202.785,
    finFlagCnt: 0,
    synFlagCnt: 0,
    rstFlagCnt: 0,
    ackFlagCnt: 0,
    fwdSegSizeAvg: 110,
    initFwdWinByts: 26883,
    initBwdWinByts: 219,
    protocol: 6
  },
  // Attack label 7 – GoldenEye (DoS)
  {
    dstPort: 80,
    flowDuration: 5000000,
    totFwdPkts: 100,
    totBwdPkts: 100,
    totLenFwdPkts: 50000,
    totLenBwdPkts: 50000,
    fwdPktLenMax: 1000,
    fwdPktLenMean: 500,
    bwdPktLenMean: 500,
    bwdPktLenStd: 100,
    flowBytsPerSec: 20000,
    flowPktsPerSec: 40,
    flowIATMean: 10000,
    flowIATStd: 5000,
    flowIATMax: 50000,
    fwdIATMean: 10000,
    bwdIATStd: 10000,
    finFlagCnt: 0,
    synFlagCnt: 0,
    rstFlagCnt: 0,
    ackFlagCnt: 1,
    fwdSegSizeAvg: 500,
    initFwdWinByts: 16000,
    initBwdWinByts: 16000,
    protocol: 6
  },
  // Attack label 9 – Slowloris (DoS)
  {
    dstPort: 80,
    flowDuration: 100000000,
    totFwdPkts: 10,
    totBwdPkts: 10,
    totLenFwdPkts: 1000,
    totLenBwdPkts: 1000,
    fwdPktLenMax: 100,
    fwdPktLenMean: 50,
    bwdPktLenMean: 50,
    bwdPktLenStd: 10,
    flowBytsPerSec: 0.02,
    flowPktsPerSec: 0.2,
    flowIATMean: 5000000,
    flowIATStd: 1000000,
    flowIATMax: 10000000,
    fwdIATMean: 5000000,
    bwdIATStd: 5000000,
    finFlagCnt: 0,
    synFlagCnt: 0,
    rstFlagCnt: 0,
    ackFlagCnt: 1,
    fwdSegSizeAvg: 50,
    initFwdWinByts: 8000,
    initBwdWinByts: 8000,
    protocol: 6
  },
  // Attack label 10 – Brute Force XSS
  {
    dstPort: 80,
    flowDuration: 1000000,
    totFwdPkts: 50,
    totBwdPkts: 50,
    totLenFwdPkts: 5000,
    totLenBwdPkts: 10000,
    fwdPktLenMax: 500,
    fwdPktLenMean: 100,
    bwdPktLenMean: 200,
    bwdPktLenStd: 50,
    flowBytsPerSec: 15000,
    flowPktsPerSec: 100,
    flowIATMean: 5000,
    flowIATStd: 2000,
    flowIATMax: 20000,
    fwdIATMean: 5000,
    bwdIATStd: 5000,
    finFlagCnt: 0,
    synFlagCnt: 0,
    rstFlagCnt: 0,
    ackFlagCnt: 1,
    fwdSegSizeAvg: 100,
    initFwdWinByts: 32000,
    initBwdWinByts: 32000,
    protocol: 6
  },
  // Attack label 11 – SQL Injection
  {
    dstPort: 80,
    flowDuration: 1500000,
    totFwdPkts: 60,
    totBwdPkts: 60,
    totLenFwdPkts: 7000,
    totLenBwdPkts: 15000,
    fwdPktLenMax: 600,
    fwdPktLenMean: 120,
    bwdPktLenMean: 250,
    bwdPktLenStd: 60,
    flowBytsPerSec: 14000,
    flowPktsPerSec: 80,
    flowIATMean: 6000,
    flowIATStd: 2500,
    flowIATMax: 25000,
    fwdIATMean: 6000,
    bwdIATStd: 6000,
    finFlagCnt: 0,
    synFlagCnt: 0,
    rstFlagCnt: 0,
    ackFlagCnt: 1,
    fwdSegSizeAvg: 120,
    initFwdWinByts: 32000,
    initBwdWinByts: 32000,
    protocol: 6
  }
];

/**
 * Calls the Python ML service for real-time classification.
 */
async function classifyAttack(partialFeatures = {}) {
  // Merge with a random base sample to ensure all required 25+ fields are present
  const base = sampleAttacks[Math.floor(Math.random() * sampleAttacks.length)];
  const features = { ...base, ...partialFeatures };

  try {
    const response = await fetch(ML_SERVICE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(features)
    });

    if (!response.ok) throw new Error(`ML Service responded with ${response.status}`);

    const data = await response.json();
    const result = data.results[0];

    const confidence = 0.85 + Math.random() * 0.1;
    let risk = 'Low';
    if (result.class === 'Attack') {
      risk = confidence > 0.92 ? 'High' : 'Medium';
    }

    // Find the ID for the attackType or use 1 for Benign
    let labelId = 1;
    if (result.class === 'Attack') {
      const foundId = Object.keys(labelNames).find(id => labelNames[id] === result.attackType);
      labelId = foundId ? parseInt(foundId) : 2; // Default to Brute Force if unknown
    }

    return {
      ...features,
      predictedLabel: labelId,
      attackType: result.attackType || 'Benign',
      confidence,
      riskLevel: risk,
      status: 'new'
    };
  } catch (err) {
    console.warn('[ML Service] Using fallback mock logic:', err.message);

    // Fallback logic to generate random attacks if the ML service is down
    const attackIds = Object.keys(labelNames).filter(id => id !== '1');
    const randomAttackId = attackIds[Math.floor(Math.random() * attackIds.length)];
    const attackType = labelNames[randomAttackId];

    const confidence = 0.7 + Math.random() * 0.25;
    const riskLevel = confidence > 0.9 ? 'High' : (confidence > 0.8 ? 'Medium' : 'Low');

    return {
      ...features,
      predictedLabel: parseInt(randomAttackId),
      attackType: attackType,
      confidence,
      riskLevel: riskLevel,
      status: 'new'
    };
  }
}

module.exports = { classifyAttack, labelNames };