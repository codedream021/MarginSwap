import React, { useState, useEffect } from "react";
import { useWallet } from "use-wallet";
import { AbiItem } from "web3-utils";
import BigNumber from "bignumber.js";
import Web3 from "web3";

interface ViewFunctionProps {
  address: string;
  abi: AbiItem;
  suffx?: string;
  prefix?: string;
  numberOfRounds?: number;
  decimal?: any;
}
export function ViewFunction(props: ViewFunctionProps): React.ReactElement {
  const { ethereum }: { ethereum: any } = useWallet();
  const priceBNBABI: AbiItem = {
    inputs: [],
    name: "priceBNB",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  };
  const web3 = new Web3(ethereum);
  const [value, setValue] = useState<any>("");
  const [bnbprice, setBnbprice] = useState<any>("");
  const contract = new web3.eth.Contract([props.abi], props.address);
  useEffect(() => {
    getValue();
    getBnbPrice();
  }, []);
  const getBnbPrice = () => {
    const contract = new web3.eth.Contract([priceBNBABI], props.address);
    contract.methods["priceBNB"]()
      .call()
      .then((data: any) => {
        if (priceBNBABI.outputs!.length > 1) {
          let concat = "";
          for (let i = 0; i < priceBNBABI.outputs!.length; i++) {
            concat +=
              priceBNBABI.outputs![i].name +
              " : " +
              data[priceBNBABI.outputs![i].name] +
              "\n";
            setBnbprice(concat);
          }
        } else {
          if (props.decimal != undefined) {
            let bn = new BigNumber(data);
            setBnbprice(bn.shiftedBy(-18).toString());
          } else {
            setBnbprice(data);
          }
        }
      });
  };
  const getValue = () => {
    contract.methods[props.abi.name!]()
      .call()
      .then((data: any) => {
        if (props.abi.outputs!.length > 1) {
          let concat = "";
          for (let i = 0; i < props.abi.outputs!.length; i++) {
            concat +=
              props.abi.outputs![i].name +
              " : " +
              data[props.abi.outputs![i].name] +
              "\n";
            setValue(concat);
          }
        } else {
          if (props.decimal != undefined) {
            let bn = new BigNumber(data);
            setValue(bn.shiftedBy(-props.decimal![props.abi.name!]).toString());
          } else {
            setValue(data?.length > 5 ? data : parseFloat(data).toFixed(1));
          }
        }
      });
  };
  return (
    <li>
      <div>
        <b>
          {props.abi.name === "mBNBtoBNB"
            ? "price mBNB"
            : (props.abi as any).showName || props.abi.name}
          :{" "}
        </b>
        <span style={{ fontSize: "20px" }}>
          {props.prefix && props.prefix}
          {props.abi.name === "mBNBtoBNB"
            ? (value * parseFloat(bnbprice)).toFixed(2)
            : (props.abi as any).round
            ? value.substr(
                0,
                value.lastIndexOf(".") +
                  (props.numberOfRounds ? props.numberOfRounds : 3)
              )
            : value}
          {props.suffx && props.suffx}
        </span>
      </div>
    </li>
  );
}
