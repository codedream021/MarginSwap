import React from "react";
import { useWallet } from "use-wallet";
import { WriteFunction } from "./WriteFunction";
import { ViewFunction } from "./ViewFunction";
import { AbiItem } from "web3-utils";
interface AbiWithSignature extends AbiItem {
  signature?: string;
}
type ContractType = { [key: string]: AbiItem[] };

interface TabProps {
  address: string;
  decimals: any;
  approves: any;
  writeFunctions: AbiItem[];
  viewFunctions: AbiItem[];
  feeFunctions: AbiItem[];
  tabName?: string;
}

export function TabComponent(props: TabProps): React.ReactElement {
  const { account, connect, reset, status } = useWallet();
console.log(props.tabName)
  return (
    <div className="container">
      <div className="row">
        <div className="col-sm-6 ">
          <form>
            <fieldset className="rounded-3 shadow-lg">
              {props.writeFunctions.map((x) => {
                return (
                  <WriteFunction
                    key={props.address + x.name + x.inputs!.length}
                    address={props.address}
                    abi={x}
                    decimals={props.decimals[x.name!]}
                    approve={props.approves[x.name!]}
                  />
                );
              })}
            </fieldset>
          </form>
        </div>
        <div className="col-sm-6">
          <form>
            <fieldset className="rounded-3 shadow-lg">
              <legend>{props.tabName?.toLowerCase() === "admin" ? "Update ratios" : (props.tabName?.toLowerCase() === "rebalance") ? "Rebalance statistics" : "Price and Supply" }</legend>
              <br />
              <ul>
                {props.viewFunctions
                  .filter(
                    (x) => x.inputs === undefined || x.inputs?.length == 0
                  )
                  .map((x) => {
                    return (
                      <ViewFunction
                        key={props.address + x.name + x.inputs!.length}
                        address={props.address}
                        abi={x}
                        decimal={props.decimals[x.name!]}
                      />
                    );
                  })}
                    {
                           props.tabName?.toLowerCase()==="swap" && 
                           <li>
                           <div>
                             <b>
                             price mBNB: {" "} 
                             </b>
                             0.000001
                           </div>
                         </li>
                      }
                       {
                           props.tabName?.toLowerCase()==="rebalance" && 
                           <>
                           <li>
                           <div>
                             <b>
                             BNB Gas (estimated): {" "} 
                             </b>
                             $500
                           </div>
                         </li>
                           <li>
                           <div>
                             <b>
                             XVS reward (estimated): {" "} 
                             </b>
                             500
                           </div>
                         </li>
                           <li>
                           <div>
                             <b>
                             Leverage Target: {" "} 
                             </b>
                             200
                           </div>
                         </li>
                           <li>
                           <div>
                             <b>
                             Rebalance amount: {" "} 
                             </b>
                             500$
                           </div>
                         </li>
                         <li>
                           <div>
                             <b>
                             XVS fee share: {" "} 
                             </b>
                             50%
                           </div>
                         </li>
                           </>
                      }
              </ul>
            </fieldset>

            {props.tabName?.toLowerCase() === "swap" && (
              <fieldset className="rounded-3 shadow-lg">
                <legend>Fee functions</legend>
                <ul>
                  {props.feeFunctions
                    .filter(
                      (x) => x.inputs === undefined || x.inputs?.length == 0
                    )
                    .map((x) => {
                      return (
                        <ViewFunction
                          key={props.address + x.name + x.inputs!.length}
                          address={props.address}
                          abi={x}
                          decimal={props.decimals[x.name!]}
                        />
                      );
                    })}
                  <li>
                    <div>
                      <b>trading: </b>
                      0%
                    </div>
                  </li>
                  <li>
                    <div>
                      <b>withdrawal: </b>
                      1%
                    </div>
                  </li>
                  <li>
                    <div>
                      <b>performance: </b>
                      0%
                    </div>
                  </li>
                </ul>
              </fieldset>
            )}


            
          </form>
        </div>
      </div>
    </div>
  );
}
