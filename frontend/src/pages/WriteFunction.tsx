import React, {useState, useEffect} from 'react';
import { useWallet } from 'use-wallet';
import Web3 from 'web3';
import {AbiItem} from 'web3-utils';
import BigNumber from 'bignumber.js';
type DecimalInfo = { [key:string]: number };
interface WriteFunctionProps {
  address: string;
  abi: AbiItem;
  decimals?: DecimalInfo;
}

const exec = async (provider: any, address: string, to:string, data: string, value:BigNumber) => {
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
  web3.eth.sendTransaction({
    from:address,
    to:to,
    data:data,
    value:value.toString(),
    gas:new BigNumber(estimate).times(2).toString()
  });
}
export function WriteFunction(props: WriteFunctionProps) : React.ReactElement {
  const [inputs, setInputs] = useState(new Array(props.abi.stateMutability === "payable" ? props.abi.inputs!.length + 1 : props.abi.inputs!.length).fill(''));
  const { account, ethereum } = useWallet();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const {name, value} = e.target;
    const from = name.indexOf('.');
    const to = name.indexOf('#');
    const idx = parseInt(name.substring(to+1));
    const param = name.substring(from+1,to);
    if(param === "payableAmount" || (props.decimals != undefined && props.decimals![param] != undefined)) {
      const decimal = param === "payableAmount" ? 18 : props.decimals![param];
      let fullvalue = new BigNumber(value).shiftedBy(decimal);
      let newInputs = inputs;
      newInputs[idx] = fullvalue;
      setInputs(newInputs);
    }
    else{
      let newInputs = inputs;
      newInputs[idx] = value;
      setInputs(newInputs);
    }
  }

  const handleSubmit = (e:React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    let web3 = new Web3(ethereum);
    let encoded: string;
    let value = new BigNumber(0);
    if(inputs![props.abi.inputs!.length] === undefined){
      encoded = web3.eth.abi.encodeFunctionCall(props.abi,inputs);
    } else {
      console.log(inputs);
      value = new BigNumber(inputs.pop());
      console.log(inputs);
      console.log(value);
      encoded = web3.eth.abi.encodeFunctionCall(props.abi,inputs);
    }
    exec(ethereum, account!, props.address, encoded, value);
  }

  return(
      <section>
        <form>
          <fieldset>
            <legend>
              {props.abi.name}
            </legend>{
              props.abi.inputs!.map((x,index)=>{
                return (<div className="form-group">{x.name} : <input name={"input."+x.name+"#"+index} onChange={handleChange} type="text" placeholder={x.type.toString() + (props.decimals != undefined && props.decimals![x.name] !=undefined?" - decimals : " +props.decimals![x.name] :"")}/></div>);
              })
            }
            {props.abi.stateMutability === "payable" ? <div> <input name={"input.payableAmount#"+props.abi.inputs!.length} onChange={handleChange} type="text" placeholder={"value to send - decimals : 18"}/> </div> : ""}
            <button className="btn btn-default" onClick={handleSubmit}>
              exec
            </button>
          </fieldset>
        </form>
      </section>
  );
}
