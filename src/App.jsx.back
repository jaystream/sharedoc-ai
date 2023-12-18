import React from "react";
import { useState, useEffect } from '@wordpress/element';
import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider'
import './assets/index.scss'
import Upload from './artifacts/contracts/Upload.sol/Upload.json'
import Step1 from "./form-steps/Step1";
import Step2 from "./form-steps/Step2";
import Files from "./form-steps/Files";
const App = () => {
  const [step, setStep] = useState(1);
  const [shareDoc, setShareDoc] = useState({
    provider: false,
    wallet_balance: 0,
    doc_type: 'legal',
    step: 1,
    web3: null,
    contractData: null,
    transactionHash: null,
    wallet: {
      accounts: []
    },
    from: {
      document_type: 'legal',
      file: null
    }
  })

 
  const getAccounts = async () => {
    const web3 = new Web3(Web3.givenProvider || process.env.REACT_APP_ETH_PROVIDER_URL);
    let accounts = await web3.eth.getAccounts();
    return accounts;
  }

  const refreshAccounts = (accounts) => {                
    if (accounts.length > 0) {                                
      updateWallet(accounts)                                  
    } else {                                                  
      // if length 0, user is disconnected                    
      setShareDoc((prev) => { 
        return {
          ...prev,
          wallet: {
            accounts: []
          }
        }
      });
    }
  }

  const getProvider = async () => {
    let detectedProvider = await detectEthereumProvider();
    if (detectedProvider?.selectedAddress) {
      
      let web3 = new Web3(detectedProvider);
      
      let bal = await web3.eth.getBalance(detectedProvider?.selectedAddress);
      bal = web3.utils.fromWei(bal, 'ether');
      
      setShareDoc((prev) => { 
        return {
          ...prev,
          provider: detectedProvider,
          wallet_balance: bal,
          web3: web3
        }
      });
      const accounts = await window.ethereum.request(         
        { method: 'eth_accounts' }                            
      )                                                       
      refreshAccounts(accounts)                               
      window.ethereum.on('accountsChanged', refreshAccounts)
        /* const uploadContract = new web3.eth.Contract(Upload.abi,process.env.REACT_APP_CONTRACT_ADDRESS);
        
        let owner = await uploadContract.methods.owner.call();
        console.log(owner); */
    }
  }
  
  useEffect(() => {
    getProvider();
    //const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    //const web3 = new Web3(window.ethereum || "ws://localhost:8545");

    return () => {                                              
      window.ethereum?.removeListener('accountsChanged', refreshAccounts)
    }
    
  },[]);

  const updateWallet = async (accounts) => {
    
    setShareDoc((prev) => { 
      return {
        ...prev,
        wallet: {
          accounts:accounts
        }
      }
    });
    /* getProvider(); */
  }
  
  const handleConnect = async () => {
    let accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    updateWallet(accounts)
    getProvider();
  }
  return (
    <div>
      <div className="row">
        <div className="col-md-12">
          {shareDoc?.wallet?.accounts?.length > 0 && (
            <a className="btn btn-info float-end" onClick={(e)=>{
              e.preventDefault();
              setShareDoc((prev) => { 
                return {
                  ...prev,
                  step: 3
                }
              });
            }}>View Files</a>
          )}
        </div>
      </div>
      <div className="row" id="sharedoc-content">
        {shareDoc.step==1 && (<Step1 shareDoc={shareDoc} setShareDoc={setShareDoc} handleConnect={handleConnect} />)}
        {shareDoc.step==2 && (<Step2 shareDoc={shareDoc} setShareDoc={setShareDoc} handleConnect={handleConnect} />)}
        {shareDoc.step==3 && (<Files shareDoc={shareDoc} setShareDoc={setShareDoc} handleConnect={handleConnect} />)}

        
      </div>
    </div>
  );
};

export default App;
