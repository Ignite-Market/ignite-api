const axios = require('axios');

const API_URL = 'https://api-proxy-dev.ignitemarket.xyz/bloomberg/market/get-chart?id=SPX:ind&interval=d1';
const TOTAL_CALLS = 30;

function callApi() {
  const startTime = Date.now();
  return axios
    .get(API_URL, {
      headers: {
        'x-api-key': 'zeqjv3IoLeN0ZYdiIr5sFm01CvHRt4TBvSJG3T9Y2Mk'
      }
    })
    .then((response) => {
      const duration = Date.now() - startTime;
      return {
        success: true,
        status: response.status,
        dataLength: JSON.stringify(response.data).length,
        duration: duration,
        timestamp: new Date().toISOString()
      };
    })
    .catch((error) => {
      const duration = Date.now() - startTime;
      console.log(error);
      return {
        success: false,
        error: error.message,
        status: error.response?.status,
        duration: duration,
        timestamp: new Date().toISOString()
      };
    });
}

function makeCall(callNumber) {
  console.log(`Starting call ${callNumber}/${TOTAL_CALLS}...`);
  return callApi().then((result) => {
    const statusIcon = result.success ? '✓' : '✗';
    const durationStr = `${(result.duration / 1000).toFixed(2)}s`;
    console.log(`Call ${callNumber} ${statusIcon} [${durationStr}] - Status: ${result.status || 'N/A'}`);
    if (!result.success) {
      console.log(`  Error: ${result.error}`);
    }
    console.log('---\n');
    return { callNumber, ...result };
  });
}

console.log(`Starting ${TOTAL_CALLS} parallel API calls...\n`);

const promises = [];
for (let i = 1; i <= TOTAL_CALLS; i++) {
  promises.push(makeCall(i));
}

Promise.all(promises)
  .then((results) => {
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);
    const durations = results.map((r) => r.duration);

    const totalDuration = Math.max(...durations); // Total time is the longest call
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total calls: ${results.length}`);
    console.log(`Successful: ${successful.length} (${((successful.length / results.length) * 100).toFixed(1)}%)`);
    console.log(`Failed: ${failed.length} (${((failed.length / results.length) * 100).toFixed(1)}%)`);
    console.log('\nDuration Statistics:');
    console.log(`  Average: ${avgDuration.toFixed(2)}ms`);
    console.log(`  Min: ${minDuration}ms`);
    console.log(`  Max: ${maxDuration}ms`);
    console.log(`  Total time: ${totalDuration}ms`);

    if (failed.length > 0) {
      console.log('\nFailed calls:');
      failed.forEach((f) => {
        console.log(`  Call ${f.callNumber}: ${f.error} (Status: ${f.status || 'N/A'})`);
      });
    }

    console.log('='.repeat(60));
  })
  .catch(console.error);
