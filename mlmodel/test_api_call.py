import httpx
import json

url = "http://localhost:8000/test"
data = {
    "dstPort": 3389, "flowDuration": 5206015, "totFwdPkts": 9, "totBwdPkts": 11,
    "totLenFwdPkts": 1213, "totLenBwdPkts": 1948, "fwdPktLenMax": 661,
    "fwdPktLenMean": 134.7777778, "bwdPktLenMean": 177.0909091, "bwdPktLenStd": 347.9371939,
    "flowBytsPerSec": 607.182269, "flowPktsPerSec": 3.841710022, "flowIATMean": 274000.7895,
    "flowIATStd": 487382.2997, "flowIATMax": 1906221, "fwdIATMean": 650751.9,
    "bwdIATStd": 591640.0074, "finFlagCnt": 0, "synFlagCnt": 0, "rstFlagCnt": 1,
    "ackFlagCnt": 0, "fwdSegSizeAvg": 134.77777, "initFwdWinByts": 8192, "initBwdWinByts": 62872,
    "protocol": 6
}

try:
    response = httpx.post(url, json=data, timeout=10)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
