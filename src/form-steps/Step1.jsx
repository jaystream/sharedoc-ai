import React from "react";
import PropTypes from "prop-types";
import { useState, useEffect } from '@wordpress/element';
import { useForm } from "react-hook-form";
//import { unixfs } from '@helia/unixfs'
//import { createHelia } from 'helia'
import { createLibp2p } from 'libp2p'
import { webSockets } from '@libp2p/websockets'
import { webRTC } from '@libp2p/webrtc'
import { noise } from '@chainsafe/libp2p-noise'
import { mplex } from '@libp2p/mplex'
import { yamux } from '@chainsafe/libp2p-yamux'
import { circuitRelayServer } from 'libp2p/circuit-relay'
import { identifyService } from 'libp2p/identify'
//import { delFile } from "../helper";
import Upload from '../artifacts/contracts/Upload.sol/Upload.json'
 
const AWS = require('aws-sdk');
/* const {
  randomBytes,
} = require('node:crypto');
 */
const CryptoJS = require("crypto-js");

const Step1 = ({shareDoc,setShareDoc,handleConnect}) => {
  const [step1, setStep1] = useState({
    ipfsHash: '',
    activeDocType: 'legal'
  });

  const { register, setError, reset, formState: { errors }, handleSubmit } = useForm();
  const web3 = shareDoc?.web3;
  let uploadContract = null;


  /* if(web3){
    uploadContract = new web3.eth.Contract(Upload.abi,process.env.REACT_APP_CONTRACT_ADDRESS);
    uploadContract.methods.add(shareDoc?.provider?.selectedAddress, 'QmbLvM7ELAsZ2ohD3N2Whk5w8xQMF4ppU4ozhgciyVZc8d');
    console.log(shareDoc?.provider?.selectedAddress);
    
  } */

  const displayFiles = async address => {
    let files = await uploadContract.methods.display(shareDoc?.provider?.selectedAddress).call();
    return files;
  }

  const algorithm = "aes-256-cbc";
  const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    accessKeyId: '77132FEFA3A93A60813E',
    secretAccessKey: 'VqXull2zVhL8pMsDV8UIb7kuuAsOZlPPOvJzFVWT',
    endpoint: 'https://s3.filebase.com',
    region: 'us-east-1',
    signatureVersion: 'v4'
  });

  
  const uintToString = (uintArray) => {
    var decodedStr = new TextDecoder("utf-8").decode(uintArray);
    return decodedStr;
  }

  const libp2pNode = async () => {
    return await createLibp2p({
      addresses: {
        listen: [
          '/ip4/0.0.0.0/tcp/0',
          '/ip4/0.0.0.0/tcp/0/ws',
          '/webrtc'
        ]
      },
      transports: [
        webSockets(),
        webRTC()
      ],
      connectionEncryption: [noise()],
      streamMuxers: [yamux(), mplex()],
      services: {
        identify: identifyService(),
        relay: circuitRelayServer()
      }
    });

  };

  
  
  const onSubmit= async (data) => {
    
    const reader = new FileReader();
    let file = data.document[0];
    
    reader.onload = e => {
      var rawLog = reader.result;
      const wordArray = CryptoJS.lib.WordArray.create(rawLog);
      const str = CryptoJS.enc.Hex.stringify(wordArray);
      const securityKey = data.file_key;
      const ct = CryptoJS.AES.encrypt(str, securityKey);
      
      const ctstr = ct.toString();

      const params = {
        Bucket: 'bucket1',
        Key: file.name,
        ContentType: file.type,
        Body: ctstr,
        ACL: 'public-read',
        Metadata: {
          Doctype: step1.activeDocType, 
        }
      };

      const request = s3.putObject(params);
      request.on('httpHeaders', (statusCode, headers) => {
        setStep1((prev) => { 
          return {
            ...prev,
            ipfsHash: headers['x-amz-meta-cid']
          }
        });

        if(web3){
          console.log('web3 processing...');
          uploadContract = new web3.eth.Contract(Upload.abi,process.env.REACT_APP_CONTRACT_ADDRESS);
          uploadContract.methods.add(shareDoc?.provider?.selectedAddress, headers['x-amz-meta-cid']).send({from: shareDoc?.provider?.selectedAddress}).then((data)=>{
            setShareDoc((prev) => { 
              return {
                ...prev,
                step: 2,
                contractData:data,
                transactionHash: data.transactionHash
              }
            });
          });
          
        }
        
      });
      request.send();
    };
    
    reader.readAsArrayBuffer(file);
  }
  
  
/*   if(web3)
    console.log(displayFiles()); */

  
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <h2 className="app-title">Step 1</h2>
        <div className="mb-3">
          <label className="mb-3">Type of Document</label>
          <div className="form-group">
            <button
              type="button"
              className={`btn bg-blue-200 rounded-pill px-3 me-5 ${step1?.activeDocType=='legal' && 'active'}`}
              onClick={() => {
                setShareDoc((prev) => { 
                  return {
                    ...prev,
                    doc_type: 'legal'
                  }
                });
                setStep1((prev) => { 
                  return {
                    ...prev,
                    activeDocType: 'legal'
                  }
                });
                
              }}
            >
              Legal
            </button>
            <button
              type="button"
              onClick={() => {
                setShareDoc((prev) => { 
                  return {
                    ...prev,
                    doc_type: 'Real Estate'
                  }
                });
                setStep1((prev) => { 
                  return {
                    ...prev,
                    activeDocType: 'Real Estate'
                  }
                });
                
              }}
              className={`btn bg-green-200 rounded-pill px-3 me-5 ${step1?.activeDocType=='Real Estate' && 'active'}`}
            >
              Real Estate
            </button>
            <button
              type="button"
              onClick={() => {
                setShareDoc((prev) => { 
                  return {
                    ...prev,
                    doc_type: 'Other'
                  }
                });
                setStep1((prev) => { 
                  return {
                    ...prev,
                    activeDocType: 'Other'
                  }
                });
                
              }}
              className={`btn bg-orange-200 rounded-pill px-3 me-5 ${step1?.activeDocType=='Other' && 'active'}`}
            >
              Other
            </button>
            <input type="hidden" {...register("client_id")} />
          </div>
        </div>
        <div className="mb-3">
          <label className="mb-3">Upload Document</label>
          <div className="form-group">
            <input
              name="document"
              className={`form-control bg-gray-200 rounded-pill xwb-input ${errors?.document ? 'border-danger': ''}`}
              type="file"
              id="formFile"
              accept=".doc,.docx,.xml,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,.pdf"
              {...register('document',{
                validate:{
                  file_type: file => {
                    
                    if(file.length){
                      return ['application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/pdf'].includes(file[0]?.type) || 'File must be a document or PDF!'
                    }
                    return true;
                  },
                  required: file => {
                    
                    return file.length || 'This is a required field!'
                  }
                }
              })}
            />
            {errors?.document && <small className="input-errors text-danger" dangerouslySetInnerHTML={{__html: errors.document?.message}}></small>}
          </div>
        </div>
        <div className="mb-3">
          <label className="mb-3">File Key</label>
          <div className="form-group">
            <input
              name="file_key"
              className={`form-control rounded-pill xwb-input ${errors?.file_key ? 'border-danger': ''}`}
              type="text"
              id="file_key"
              {...register('file_key',{
                required: "This field is required!"
              })}
            />
            <div id="emailHelp" class="form-text">This is the key for your file. Give this to the person you want to share with.</div>
            {errors?.file_key && <small className="input-errors text-danger" dangerouslySetInnerHTML={{__html: errors.file_key?.message}}></small>}
          </div>
        </div>
        <div className="mb-3">

          {window.ethereum?.isMetaMask &&
            shareDoc?.wallet?.accounts?.length < 1 /* Updated */ && (
              <button
                type="button"
                className="btn bg-green-400 rounded-pill px-3"
                onClick={handleConnect}
              >
                Connect MetaMask
              </button>
            )}
          {!window.ethereum && (
            <div className="alert alert-warning">
              Please install{" "}
              <a target="_blank" href="https://metamask.io/download/">
                metamask browser extension
              </a>
              !
            </div>
          )}

          {shareDoc?.wallet?.accounts?.length > 0 && (
            <>
              <div className="mb-3">
                Wallet Account: {shareDoc?.wallet?.accounts[0]}
              </div>
              <div className="mb-3">
                Wallet Balance: {shareDoc?.wallet_balance} ETH
              </div>
              <button
                type="submit"
                className="btn bg-blue-400 rounded-pill px-3"
              >
                Upload
              </button>
              {/* <button
                type="button"
                onClick={(e)=>{
                  delFile(
                    {
                      Key: 'S361.doc',
                      Bucket: 'bucket1',
                    }, (err,data) => {
                      console.log(err,data);
                    }
                  )
                }}
                className="btn bg-blue-400 rounded-pill px-3"
              >
                Delete
              </button> */}
            </>
          )}
        </div>
      </form>
    </>
  );
};

Step1.propTypes = {};

export default Step1;
