import React from "react";
import { Nav, Navbar} from "react-bootstrap";
import { Tab} from "react-tabs";
import { Tab as TabType} from "../types/config";
type Props = {
  tabs: TabType[];
  reset: () => void;
  collapsed: boolean;
  setCollapsed:any;
};
const Menu: React.FC<Props> = ({ tabs,reset,setCollapsed,collapsed }) => {
  return (
    <Navbar fixed="top" style={{backgroundColor:"#f3ba2f"}} expand="lg">
    <Navbar.Brand href="#home">
      MarginSwap</Navbar.Brand>
    <Navbar.Toggle aria-controls="basic-navbar-nav" onClick={()=>setCollapsed(!collapsed)} />
    <Navbar.Collapse id="basic-navbar-nav">
      <Nav className=" ms-auto">
        {/* {tabs.map((tab: any) => {
          return <Tab key={tab.name}>{tab.name}</Tab>;
        })} */}
        <Nav.Link className="ml-auto" onClick={() => reset()}>disconnect</Nav.Link>
      </Nav>
    </Navbar.Collapse>
</Navbar>
  );
};

export default Menu;
