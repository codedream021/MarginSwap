import React from "react";
import config from "./assets/config.json";
import { AbiItem } from "web3-utils";
import { useWallet, UseWalletProvider } from "use-wallet";
import { Tabs, TabPanel, Tab, TabList } from "react-tabs";
import abis from "./assets/abi.json";
import { TabComponent } from "./pages/Tab";
import Menu from "./pages/Menu";
// import "./assets/theme.scss";
import "./assets/theme.css";
import { Nav, Navbar } from "react-bootstrap";
type AbiType = { [key: string]: AbiItem[] };

function App(): React.ReactElement {
  const { account, connect, reset, status } = useWallet();
  let typedAbi = abis as AbiType;
  const [collapsed, setCollapsed] = React.useState(false);
  React.useEffect(() => {
    if(localStorage.getItem("status")==="connected"){
      connect("injected")
    }
  },[]);
  const resetCb = () => {
    reset();
    localStorage.setItem("status", "disconnected");
  };
  const connectCb = () => {
    connect("injected").then(() => {
      localStorage.setItem("status", "connected");
    })
  }
  return (
    <div>
      {status === "connected" ? (
        <Tabs>
          <main className="main" id="top">
            <div data-layout="container">
              {Menu({ tabs: config.tabs, resetCb, setCollapsed, collapsed })}
              <div
                className="content"
                style={collapsed ? { marginTop: "100px" } : {}}
              >
                <nav className="navbar navbar-light navbar-glass navbar-top navbar-expand">
                  <div className="logo terminal-prompt m-3">
                    User : {account}
                  </div>
                </nav>
                <TabList className="new-navigation">
                  {config.tabs.map((tab: any) => {
                    return <Tab key={tab.name}>{tab.name}</Tab>;
                  })}
                </TabList>
                <div className="row g-0">
                  {config.tabs.map((x) => {
                    return (
                      <TabPanel key={x.name}>
                        <TabComponent
                          address={x.address}
                          tabName={x.name}
                          decimals={x.decimals}
                          approves={x.approves}
                          writeFunctions={typedAbi[x.abi]
                            .filter((y) => y.type === "function")
                            .filter((y) => y.name !== undefined)
                            .filter(
                              (f) =>
                                x.functions.includes(String(f.name)) &&
                                f.stateMutability != "view" &&
                                f.stateMutability != "stats" &&
                                f.stateMutability != "fees"
                            )}
                          viewFunctions={typedAbi[x.abi]
                            .filter((y) => y.type === "function")
                            .filter((y) => y.name !== undefined)
                            .filter(
                              (f) =>
                                x.functions.includes(String(f.name)) &&
                                f.stateMutability == "view"
                            )}
                          statsFunctions={typedAbi[x.abi]
                            .filter((y) => y.type === "function")
                            .filter((y) => y.name !== undefined)
                            .filter((f) => {
                              return (
                                x.functions.includes(String(f.name)) &&
                                f.stateMutability === "stats"
                              );
                            })}
                          feeFunctions={typedAbi[x.abi]
                            .filter((y) => y.type === "function")
                            .filter((y) => y.name !== undefined)
                            .filter(
                              (f) =>
                                x.functions.includes(String(f.name)) &&
                                f.stateMutability == "fees"
                            )}
                        />
                      </TabPanel>
                    );
                  })}
                </div>
              </div>
            </div>
          </main>
        </Tabs>
      ) : (
        <Navbar style={{ backgroundColor: "#f3ba2f" }} expand="lg">
          <Navbar.Brand href="#home">MarginSwap</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className=" ms-auto">
              <Nav.Link
                className="ml-auto"
                onClick={connectCb}
              >
                Connect wallet
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
      )}
    </div>
  );
}
// Wrap everything in <UseWalletProvider />
export default () => (
  <UseWalletProvider chainId={97} connectors={{}}>
    <App />
  </UseWalletProvider>
);
