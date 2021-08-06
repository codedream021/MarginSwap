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
  statsFunctions: any;
  tabName?: string;
}

export function TabComponent(props: TabProps): React.ReactElement {
  const { account, connect, reset, status } = useWallet();
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
              <legend>
                {props.tabName?.toLowerCase() === "admin"
                  ? "Update ratios"
                  : props.tabName?.toLowerCase() === "rebalance"
                  ? "Rebalance statistics"
                  : "Price"}
              </legend>
              <br />
              <ul style={{listStyle:"none"}}>
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
                        prefix={(props.tabName==="Swap" || props.tabName==="Rebalance") ? "$" : ""}
                        decimal={props.decimals[x.name!]}
                      />
                    );
                  })}
                {props.tabName?.toLowerCase() === "rebalance" && (
                  <>
                    <li>
                      <div>
                        <b>XVS fee share: </b>
                        50%
                      </div>
                    </li>
                  </>
                )}
              </ul>
            </fieldset>
            
           
            {props.tabName?.toLowerCase() === "swap" && (
              <fieldset className="rounded-3 shadow-lg">
                <legend>Fees</legend>
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
                          suffx="%"
                          decimal={props.decimals[x.name!]}
                        />
                      );
                    })}
                  <li>
                    <div>
                      <b>mBNB Sell Fee: </b>
                      1.0%
                    </div>
                  </li>
                </ul>
              </fieldset>
            )}
          </form>
        </div>

        {props.tabName?.toLowerCase() === "rebalance" &&
        <div className="col-sm-6">
        <fieldset className="rounded-3 shadow-lg">
              <legend>Pool statistics</legend>
              <ul>
                  {
  props.statsFunctions.map((x:any) => {
    return (
      <ViewFunction
      key={props.address + x.name + x.inputs!.length}
      address={props.address}
      numberOfRounds={5}
      abi={x}
      decimal={props.decimals[x.name!]}
    />
    )
  }
  )

}
</ul>
</fieldset>
        </div>
        }
      </div>
    </div>
  );
}
