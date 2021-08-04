import React, { Children } from 'react';
import { useWallet } from 'use-wallet';
import { Config } from '../types/config';
import abis from '../assets/abi.json';
import { WriteFunction } from './WriteFunction';
import { ViewFunction } from './ViewFunction';
import { TabComponent } from './Tab';
import { AbiItem } from 'web3-utils';

//Tab related imports
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import '../style/Tab.less';

interface ContractProps {
  config : Config;
  children: any;
}
type AbiType = { [key:string]: AbiItem[] }

const getKeyValue = (key: string) => (obj: Record<string, any>) => obj[key];

export function ContractComponent(props: ContractProps) : React.ReactElement {
  const { account, connect, reset, status } = useWallet();
  let typedAbi = abis as AbiType;
  return(
    <Tabs>
    {props.children}
      {props.config.tabs.map((x) => {
        return <TabPanel key={x.name}>
          <TabComponent
            address={x.address}
            decimals={x.decimals}
            approves={x.approves}
            writeFunctions={typedAbi[x.abi].filter(y=>y.type === "function").filter(y=>y.name!== undefined).filter(f=> x.functions.includes(String(f.name)) && f.stateMutability != "view")}
            viewFunctions={typedAbi[x.abi].filter(y=>y.type === "function").filter(y=>y.name!== undefined).filter(f=> x.functions.includes(String(f.name)) && f.stateMutability == "view")}
            feeFunctions={typedAbi[x.abi].filter(y=>y.type === "function" && y.name?.includes('fee'))?.filter(y=>y.name!== undefined).filter(f=> x.functions.includes(String(f.name)) && f.stateMutability == "view")}
            statsFunctions={typedAbi[x.abi].filter(y=>y.type === "function" && y.name?.includes('fee'))?.filter(y=>y.name!== undefined).filter(f=> x.functions.includes(String(f.name)) && f.stateMutability == "view")}
          />
        </TabPanel>
        })
      }
    </Tabs>
  );
}
