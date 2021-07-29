import React, {useState, useEffect} from 'react';
import { useWallet } from 'use-wallet';
import {AbiItem} from 'web3-utils';
import BigNumber from 'bignumber.js';
import Web3 from 'web3';

interface ViewFunctionProps {
  address: string;
  abi: AbiItem;
  decimal?: any;
}
export function ViewFunction(props: ViewFunctionProps) : React.ReactElement {
  const { ethereum }: {ethereum:any} = useWallet();
  const web3 = new Web3(ethereum);
  const [value, setValue] = useState('');
  const contract = new web3.eth.Contract([props.abi], props.address);
  useEffect(() => {
    // You need to restrict it at some point
    // This is just dummy code and should be replaced by actual
    getValue();
  }, []);

  const getValue = () => {
    contract.methods[props.abi.name!]().call().then((data: any) => {
      if(props.abi.outputs!.length > 1) {
        let concat = "";
        for(let i = 0; i<props.abi.outputs!.length; i++){
          concat += props.abi.outputs![i].name + " : " + data[props.abi.outputs![i].name] + "\n";
          setValue(concat);
        }
      }
      else {
        if(props.decimal != undefined){
          let bn = new BigNumber(data);
          setValue(bn.shiftedBy(-props.decimal![props.abi.name!]).toString());
        }
        else {
          setValue(data);
        }
      }
    });
  }
  console.log(props);

  return(
    <li>
      <div>
        <b>
          {props.abi.name}: {" "} 
        </b>
        {value}
      </div>
    </li>
  );
}
