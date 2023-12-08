import React from "react";
import Web3 from 'web3';
import PropTypes from "prop-types";
import Upload from '../artifacts/contracts/Upload.sol/Upload.json'
import { useForm } from "react-hook-form";
import { useState, useEffect } from '@wordpress/element';

const Step2 = ({ shareDoc, setShareDoc, handleConnect }) => {
  const { register, setError, reset, formState: { errors }, handleSubmit } = useForm();
  const [step2, setStep2] = useState({
    file: null,
    sharing: false
  });
  const web3 = shareDoc?.web3;
  const transactionHash = shareDoc?.transactionHash || '0x6f611d80c19bbac5a361de53b69f65ff4382b1685e53e0b0e9ea8419aa3ca567'
  const account = shareDoc?.wallet?.accounts[0];

  const getFiles = async (web3) => {
    
    if(web3){
      const uploadContract = new web3.eth.Contract(Upload.abi,process.env.REACT_APP_CONTRACT_ADDRESS);
      let owner = await uploadContract.methods.getOwner().call();
      let files = await uploadContract.methods.display(account).call({from: account});
      console.log(owner, account);
      console.log(files);
      let trans = await web3.eth.getTransaction(transactionHash);
      
      const decoded = await web3.eth.abi.decodeParameters(
        [{
          type: 'address',
          name: '_user'
        },{
          type: 'string',
          name: 'url'
         }],
        trans.input.slice(10));
        
        setStep2((prev) => { 
          return {
            ...prev,
            file: decoded.url
          }
        });
    }
  }

  const onSubmit= async (data) => {
    setStep2((prev) => { 
      return {
        ...prev,
        sharing: true
      }
    });

    const uploadContract = new web3.eth.Contract(Upload.abi,process.env.REACT_APP_CONTRACT_ADDRESS);
    let owner = await uploadContract.methods.getOwner().call();
    await uploadContract.methods.allow(data.wallet_to).send(
      {
        from: account
      }, function(error, result){
        console.log(error, result);
        setStep2((prev) => { 
          return {
            ...prev,
            sharing: false
          }
        });
        setShareDoc((prev) => { 
          return {
            ...prev,
            step: 3
          }
        });
      });
    
    const accessList = await uploadContract.methods.shareAccess().call(
      {
        from: account
      }, function(error, result){
        console.log(error, result);
      });
  }
  useEffect( ()=>{
    getFiles(web3)
  },[web3]);
  
  return (
    <>
      <div className="row">
        <form onSubmit={handleSubmit(onSubmit)}>
          <h2 className="app-title">Step 2</h2>
          <p>File: {step2?.file}</p>
          <div className="mb-3">
            <label htmlFor="wallet_to" className="form-label">Share this file to: </label>
            <input type="text" name="wallet_to" {...register('wallet_to',{
                required: "This field is required!"
              })} className={`form-control rounded-pill xwb-input ${errors?.wallet_to ? 'border-danger': ''}`} id="wallet_to" />
            <div className="form-text">Wallet address to the person you want to share.</div>
            {errors?.wallet_to && <small className="input-errors text-danger" dangerouslySetInnerHTML={{__html: errors.wallet_to?.message}}></small>}
          </div>
          <div className="mb-3">
            <button
                type="submit"
                className="btn bg-blue-400 rounded-pill px-3"
              >
                Share
                {step2?.sharing && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
              </button>
          </div>
        </form>
      </div>
    </>
  );
};

Step2.propTypes = {};

export default Step2;
