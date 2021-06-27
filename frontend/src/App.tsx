import React from 'react'
import config from './assets/config.json';
import { AbiItem } from 'web3-utils';
import { Config } from './types/config';
import { ContractComponent } from './pages/Contract';
import { useWallet, UseWalletProvider } from 'use-wallet'
function App() : React.ReactElement {
  const { account, connect, reset, status } = useWallet();
  return(
    <div>
      { status === 'connected' ? (
        <div>
          <div className="terminal-nav">
            <div className="terminal-logo">
              <div className="logo terminal-prompt">
                User : {account}
              </div>
            </div>
            <nav className="terminal-menu">
              <ul>
                <li>
                  <a href="#" className="menu-item" onClick={() => reset()}>disconnect</a>
                </li>
              </ul>
            </nav>
          </div>
        <ContractComponent config={config}/>
      </div>
    ) : (
      <div>
        <div className="terminal-nav">
          <div className="terminal-logo">
            <div className="logo terminal-prompt">
              User : Not connected
            </div>
          </div>
            <nav className="terminal-menu">
              <ul>
                <li>
                  <a href="#" className="menu-item" onClick={() =>connect('injected')}>MetaMask</a>
                </li>
              </ul>
            </nav>
        </div>
      </div>
      )}
    </div>
  );
}
// Wrap everything in <UseWalletProvider />
export default () => (
  <UseWalletProvider
    chainId={97}
    connectors={{
    }}
  >
    <App />
  </UseWalletProvider>
)
