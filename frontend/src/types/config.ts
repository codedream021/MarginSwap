type ParameterDecimal = { [key:string] : number};

type Decimal = { [key:string]: ParameterDecimal[] }

interface Tab {
  abi : string;
  address : string;
  name: string;
  functions: string[];
  decimals: Decimal[];
}

export interface Config {
  tabs : Tab[];
}
