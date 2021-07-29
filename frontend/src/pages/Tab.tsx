import React from 'react';
import { useWallet } from 'use-wallet';
import { WriteFunction } from './WriteFunction';
import { ViewFunction } from './ViewFunction';
import { AbiItem } from 'web3-utils';
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
    <div className="container">
    <div className="row">
        <div className="col-sm-6 ">
          <form>
            <fieldset className="rounded-3 shadow-lg">
              <legend>write functions</legend>
              {props.writeFunctions.map((x) =>{
                return <WriteFunction key={props.address + x.name + x.inputs!.length} address={props.address} abi={x} decimals={props.decimals[x.name!]} approve={props.approves[x.name!]} />
                })
              }
            </fieldset>
          </form>
        </div>
        <div className="col-sm-6">
          <form>
            <fieldset className="rounded-3 shadow-lg">
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
      </div>
  );
}
