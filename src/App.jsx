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
import { BrowserRouter, Link, NavLink, Route, RouterProvider, Routes, useMatch } from "react-router-dom";
import Home from "./Home";
import EditFile from "./EditFile";
import ReviewFile from "./ReviewFile";
import Routing from "./components/Routing";
/* import router from "./router"; */
const reactAppData = window.xwbVar || {}

const App = () => {
  const [step, setStep] = useState(1);
  const [shareDoc, setShareDoc] = useState({
    provider: false,
    loading: true,
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
    },
    showSideMenu: true
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

    let response = await axiosClient.get(`${reactAppData.ajaxURL}`,{
      params: {
        action: 'getUser',
        
      }
    });
    let responseData = response.data;
    let currentUser = responseData.data;
    
    /* const web3 = new Web3(new Web3.providers.HttpProvider(`https://sepolia.infura.io/v3/${process.env.REACT_APP_INFURA_API_KEY}`));
    
    
    
    const privateKeyString = `0x${process.env.REACT_APP_ACCOUNT_PRIVATE_KEY}`;

    const accountDetails = {
      privateKey: privateKeyString,
      address: process.env.REACT_APP_ACCOUNT_ADDRESS,
    };

    const account = web3.eth.accounts.wallet.add(privateKeyString).get(0);

    const uploadContract = new web3.eth.Contract(Upload.abi,process.env.REACT_APP_CONTRACT_ADDRESS);
    uploadContract.handleRevert = true; */
    
    setShareDoc((prev) => { 
      return {
        ...prev,
        //account: account,
        //web3: web3,
        loading: false,
        email: currentUser.email,
        //contract: uploadContract
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
    <>
    {console.log(process.env.REACT_APP_BASE_NAME, process.env.NODE_ENV)}
    {shareDoc.loading ? 
      <i className="fa-solid fa-spinner fa-spin fa-2xl"></i>
      :
      ( shareDoc.email ? <BrowserRouter basename={`${process.env.REACT_APP_BASE_NAME}`}>
        <div className="row">
          {shareDoc.showSideMenu && 
            <div className="col-md-3">
              <nav className="nav flex-column">
                <Link className="nav-link active" to={'/'}>Home</Link>
                <Link className="nav-link" to={'/upload'}>Share</Link>
              </nav>
            </div>
          }
          
          <div className="col">
              <Routes>
                <Route path="/" element={<Files shareDoc={shareDoc} setShareDoc={setShareDoc} />} />
                <Route path="files/:blockHash" element={<EditFile shareDoc={shareDoc} setShareDoc={setShareDoc} />} />
                <Route path="upload" element={<Step1 shareDoc={shareDoc} setShareDoc={setShareDoc} />} />
                <Route path="users/:blockHash" element={<Step2 shareDoc={shareDoc} setShareDoc={setShareDoc} />} />
                <Route path="review/:blockHash" element={<ReviewFile shareDoc={shareDoc} setShareDoc={setShareDoc} />} />
              </Routes>
            
          </div>
        </div>
        </BrowserRouter> : 
        <>
          <a href={`${process.env.REACT_APP_BASE_URL}/login`}>Click here to login</a> or <a href={`${process.env.REACT_APP_BASE_URL}/start-free-trial`}>Register here</a>
        </>
        )
      }
    </>
    
    
  );
};

export default App;
