type ParameterDecimal = { [key:string] : number};
type ApproveParams = { address : string; amount: string};

type Decimal = { [key:string]: ParameterDecimal[] }
type Approve = { [key:string]: ApproveParams[] }
export interface Tab {
  abi : string;
  address : string;
  name: string;
  functions: string[];
  decimals: any;
  approves: any;
}

export interface Config {
  tabs : Tab[];
}
