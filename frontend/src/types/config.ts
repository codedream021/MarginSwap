type ParameterDecimal = { [key:string] : number};
type ApproveParams = { address : string; amount: string};

type Decimal = { [key:string]: ParameterDecimal[] }
type Approve = { [key:string]: ApproveParams[] }
interface Tab {
  abi : string;
  address : string;
  name: string;
  functions: string[];
  decimals: Decimal[];
  approves: Approve[];
}

export interface Config {
  tabs : Tab[];
}
