import React, { useState } from "react";
import { useWallet } from "use-wallet";
import Web3 from "web3";
import { AbiItem } from "web3-utils";
import BigNumber from "bignumber.js";
import { execute } from "../utils/interaction";
import erc20 from "../assets/IERC20.json";
type AbiType = { [key: string]: AbiItem[] };
type DecimalInfo = { [key: string]: number };
type ApprovalInfo = {
  address: string;
  amount: string;
};
interface WriteFunctionProps {
  address: string;
  abi: AbiItem;
  decimals?: DecimalInfo;
  approve?: ApprovalInfo;
}

function findArg(abi: AbiItem, name: string): number {
  for (let i = 0; i < abi.inputs!.length; i++) {
    if (abi.inputs![i].name === name) {
      return i;
    }
  }
  return -1;
}
export function WriteFunction(props: WriteFunctionProps): React.ReactElement {
  const [inputs, setInputs] = useState(
    new Array(
      props.abi.stateMutability === "payable"
        ? props.abi.inputs!.length + 1
        : props.abi.inputs!.length
    ).fill("")
  );
  const { account, ethereum }: { account?: any; ethereum?: any } = useWallet();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const { name, value } = e.target;
    const from = name.indexOf(".");
    const to = name.indexOf("#");
    const idx = parseInt(name.substring(to + 1));
    const param = name.substring(from + 1, to);
    if (
      param === "payableAmount" ||
      (props.decimals != undefined && props.decimals![param] != undefined)
    ) {
      const decimal = param === "payableAmount" ? 18 : props.decimals![param];
      let fullvalue = new BigNumber(value).shiftedBy(decimal);
      let newInputs = inputs;
      newInputs[idx] = fullvalue;
      setInputs(newInputs);
    } else {
      let newInputs = inputs;
      newInputs[idx] = value;
      setInputs(newInputs);
    }
  };

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    let web3 = new Web3(ethereum);
    let encoded: string;
    let value = new BigNumber(0);
    if (inputs![props.abi.inputs!.length] === undefined) {
      encoded = web3.eth.abi.encodeFunctionCall(props.abi, inputs);
    } else {
      value = new BigNumber(inputs.pop());
      encoded = web3.eth.abi.encodeFunctionCall(props.abi, inputs);
    }
    if (props.approve !== undefined) {
      const approveAmount = inputs![findArg(props.abi, props.approve!.amount)];
      const token = new web3.eth.Contract(
        erc20 as AbiItem[],
        props.approve!.address
      );
      token.methods
        .allowance(account!, props.approve!.address)
        .call()
        .then((res: BigNumber) => {
          if (new BigNumber(res).gte(approveAmount)) {
            execute(ethereum, account!, props.address, encoded, value);
          } else {
            const approveEncoded = token.methods
              .approve(props.address, approveAmount)
              .encodeABI();
            execute(
              ethereum,
              account!,
              props.approve!.address,
              approveEncoded,
              new BigNumber(0)
            ).then((res: any) => {
              execute(ethereum, account!, props.address, encoded, value);
            });
          }
        });
    } else {
      execute(ethereum, account!, props.address, encoded, value);
    }
  };

  return (
    <section>
      <form>
        <fieldset className="rounded-3 shadow">
          {props.abi.name?.toLowerCase() !== "rebalance" && (
            <legend>{props.abi.showName || props.abi.name }</legend>
          )}
          {props.abi.inputs!.map((x, index) => {
            return (
              <div key={props.abi.name + x.name} className="form-group my-2">
                {x.name==="mBNBamount" ? "" : x.name}
                <input
                  className="form-control"
                  name={"input." + x.name + "#" + index}
                  onChange={handleChange}
                  type="text"
                  placeholder={props.abi.placeholder || x.type.toString() +
                    (props.decimals != undefined &&
                    props.decimals![x.name] != undefined
                      ? " - decimals : " + props.decimals![x.name]
                      : "")}
                />
              </div>
            );
          })}
          {props.abi.stateMutability === "payable" ? (
            <div
              key={props.abi.name + "submit_button"}
              className="form-group m-2"
            >
              {" "}
              <input
                className="form-control"
                name={"input.payableAmount#" + props.abi.inputs!.length}
                onChange={handleChange}
                type="text"
                placeholder={props.abi.placeholder}
              />{" "}
            </div>
          ) : (
            ""
          )}
          <button className="btn btn-primary" onClick={handleSubmit}>
            {props.abi.btnName || "exec"}
          </button>
        </fieldset>
      </form>
    </section>
  );
}
