import React from 'react';
import { useWallet } from 'use-wallet';
import abis from '../assets/abi.json';
import { WriteFunction } from './WriteFunction';
import { ViewFunction } from './ViewFunction';
import { AbiItem } from 'web3-utils';
import style from '../style/FunctionView.scss';
interface AbiWithSignature extends AbiItem {
  signature?: string;
}
type ContractType = { [key:string]: AbiItem[] }

interface TabProps {
  address: string;
  decimals: any;
  approves: any;
  writeFunctions: AbiItem[];
  viewFunctions: AbiItem[];
}

export function TabComponent(props: TabProps) : React.ReactElement {
  const { account, connect, reset, status } = useWallet();
  return(
    <div className={style.splitScreen}>
        <div className={style.topPane}>
          <form>
            <fieldset>
              <legend>write functions</legend>
              {props.writeFunctions.map((x) =>{
                return <WriteFunction key={props.address + x.name + x.inputs!.length} address={props.address} abi={x} decimals={props.decimals[x.name!]} approve={props.approves[x.name!]} />
                })
              }
            </fieldset>
          </form>
        </div>
        <div className={style.bottomPane}>
          <form>
            <fieldset>
              <legend>view functions</legend>
              <ul>
                {props.viewFunctions.filter(x=> x.inputs === undefined || x.inputs?.length == 0).map((x) =>{
                  return <ViewFunction key={props.address + x.name + x.inputs!.length} address={props.address} abi={x} decimal={props.decimals[x.name!]} />
                  })
                }
              </ul>
            </fieldset>
          </form>
        </div>
      </div>
  );
}
