import React from "react";
import config from "./assets/config.json";
import { AbiItem } from "web3-utils";
import { useWallet, UseWalletProvider } from "use-wallet";
import { Tabs, TabPanel } from "react-tabs";
import abis from "./assets/abi.json";
import { TabComponent } from "./pages/Tab";
import Menu from "./pages/Menu";
import { Nav, Navbar } from "react-bootstrap";
type AbiType = { [key: string]: AbiItem[] };

function App(): React.ReactElement {
  const { account, connect, reset, status } = useWallet();
  let typedAbi = abis as AbiType;
  const [collapsed, setCollapsed] = React.useState(false);
  return (
    <div>
      {status === "connected" ? (
        <Tabs>
          <main className="main" id="top">
            <div data-layout="container">
              {Menu({ tabs: config.tabs, reset, setCollapsed, collapsed })}
              <div
                className="content"
                style={collapsed ? { marginTop: "240px" } : {}}
              >
                <nav className="navbar navbar-light navbar-glass navbar-top navbar-expand">
                  <div className="logo terminal-prompt">User : {account}</div>
                </nav>
                <div className="row g-0">
                  {config.tabs.map((x) => {
                    return (
                      <TabPanel key={x.name}>
                        <TabComponent
                          address={x.address}
                          decimals={x.decimals}
                          approves={x.approves}
                          writeFunctions={typedAbi[x.abi]
                            .filter((y) => y.type === "function")
                            .filter((y) => y.name !== undefined)
                            .filter(
                              (f) =>
                                x.functions.includes(String(f.name)) &&
                                f.stateMutability != "view"
                            )}
                          viewFunctions={typedAbi[x.abi]
                            .filter((y) => y.type === "function")
                            .filter((y) => y.name !== undefined)
                            .filter(
                              (f) =>
                                x.functions.includes(String(f.name)) &&
                                f.stateMutability == "view"
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
        <Navbar.Toggle
          aria-controls="basic-navbar-nav"/>
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className=" ms-auto">
            <Nav.Link className="ml-auto" onClick={() => connect("injected")}>
            Login now MetaMask
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
