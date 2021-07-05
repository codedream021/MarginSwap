import Web3 from 'web3';
import BigNumber from 'bignumber.js';
export async function execute(provider: any, address: string, to:string, data: string, value:BigNumber) :Promise<any>{
  let web3 = new Web3(provider);
  let estimate = 1000000;
  try {
    estimate = await web3.eth.estimateGas({
      from:address,
      to:to,
      data:data,
      value:value.toString()
    });
  } catch(e) {
    alert('this transaction will fail, check the code : '+ e.message);
  }
  return web3.eth.sendTransaction({
    from:address,
    to:to,
    data:data,
    value:value.toString(),
    gas:new BigNumber(estimate).times(2).toString()
  });
}
