import React from "react";
import { useState, useEffect, useRef } from '@wordpress/element';
import { Web3 } from 'web3';
const fs = require('fs');
const path = require('path');
import detectEthereumProvider from '@metamask/detect-provider'
import './assets/index.scss'
import Upload from './artifacts/contracts/Upload.sol/Upload.json'
import Step1 from "./form-steps/Step1";
import Step2 from "./form-steps/Step2";
import Files from "./form-steps/Files";
import { swal2 } from "./helper";
import axiosClient from "./axios";
const reactAppData = window.xwbVar || {}

const App = () => {
  const [step, setStep] = useState(1);
  const [shareDoc, setShareDoc] = useState({
    provider: false,
    account: null,
    wallet_balance: 0,
    doc_type: 'legal',
    email:null,
    step: 1,
    web3: null,
    contract: null,
    contractData: null,
    transactionHash: null,
    block_number: null,
    post_id: null,
    wallet: {
      accounts: []
    },
    from: {
      document_type: 'legal',
      file: null
    }
  })

  const emailRef = useRef(0);
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

    /* let response = await axiosClient.get(`${reactAppData.ajaxURL}`,{
      params: {
        action: 'getUser',
        
      }
    });
    let responseData = response.data;
    let currentUser = responseData.data; */
    
    const web3 = new Web3(new Web3.providers.HttpProvider(`https://sepolia.infura.io/v3/${process.env.REACT_APP_INFURA_API_KEY}`));
    
    const privateKeyString = `0x${process.env.REACT_APP_ACCOUNT_PRIVATE_KEY}`;

    const accountDetails = {
      privateKey: privateKeyString,
      address: process.env.REACT_APP_ACCOUNT_ADDRESS,
    };

    const account = web3.eth.accounts.wallet.add(privateKeyString).get(0);

    const uploadContract = new web3.eth.Contract(Upload.abi,process.env.REACT_APP_CONTRACT_ADDRESS);
    uploadContract.handleRevert = true;
    
    setShareDoc((prev) => { 
      return {
        ...prev,
        account: account,
        web3: web3,
        //email: currentUser.email,
        contract: uploadContract
      }
    });

    
    /* const addFile = await uploadContract.methods.add(accountDetails?.address, 'QmbLvM7ELAsZ2ohD3N2Whk5w8xQMF4ppU4ozhgciyVZc8d').send({from: accountDetails?.address});
    addFile.on('transactionHash', function(hash){
      console.log(hash);
    });
    addFile.on('receipt', function(receipt){
      console.log(receipt);
    });
    addFile.on('confirmation', function(confirmationNumber, receipt){
      console.log(confirmationNumber, receipt);
    });
    addFile.on('error', function(error, receipt) {
      console.log('error:',error);
      console.log('receipt:',receipt);
    });
    console.log(addFile); */

  }

  const viewMyFiles = e => {
    e.preventDefault();
    swal2({
      title: 'Input your email to view your files',
      preConfirm: data => {
        let email = emailRef.current.value;
        setShareDoc((prev) => { 
          return {
            ...prev,
            step: 3,
            email: email
          }
        });
      },
      showCancelButton: true,
      confirmButtonText: 'View Files',
      didClose: ()=>{

      },
      html: (
        <>
          
            <div className="mb-3 p-3">
              <input
                ref={emailRef}
                name="email"
                placeholder="Input your email"
                className={`form-control rounded-pill xwb-input`}
                type="email"
                id="email"
              />
          </div>
          
        </>
      )
    });
  }
  
  useEffect( () => {
    getProvider();
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
  
 
  return (
    <div>
      <div className="row">
        <div className="col-md-12">
          {shareDoc.step != 3 && <a className="btn btn-info float-end" onClick={viewMyFiles}>View Files</a>}
            
          {shareDoc.step == 3 && <a className="btn btn-info float-end" onClick={(e) => {
            e.preventDefault();
            setShareDoc((prev) => { 
              return {
                ...prev,
                step: 1
              }
            });
          }}>Home</a>}

        </div>
      </div>
      <div className="row" id="sharedoc-content">
        {shareDoc.step==1 && (<Step1 shareDoc={shareDoc} setShareDoc={setShareDoc} />)}
        {shareDoc.step==2 && (<Step2 shareDoc={shareDoc} setShareDoc={setShareDoc} />)}
        {shareDoc.step==3 && (<Files shareDoc={shareDoc} setShareDoc={setShareDoc} />)}

        
      </div>
    </div>
  );
};

export default App;
