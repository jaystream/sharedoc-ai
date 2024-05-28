import React from "react";
import PropTypes from "prop-types";
import { useState, useEffect } from '@wordpress/element';
import { useForm } from "react-hook-form";

import Upload from '../artifacts/contracts/Upload.sol/Upload.json'
import { Buffer } from "buffer";
import axiosClient from "../axios";
import { swal2 } from "../helper";
import { useNavigate } from "react-router-dom";
const reactAppData = window.xwbVar || {}

const AWS = require('aws-sdk');
/* const {
  randomBytes,
} = require('node:crypto');
 */
const CryptoJS = require("crypto-js");

const Step1 = ({shareDoc,setShareDoc,handleConnect}) => {
  const [step1, setStep1] = useState({
    ipfsHash: '',
    activeDocType: 'legal',
    uploading: false
  });

  const { register, setError, reset, setValue,  formState: { errors }, handleSubmit } = useForm();

  const navigate = useNavigate();
/*   if(web3){
    uploadContract = new web3.eth.Contract(Upload.abi,process.env.REACT_APP_CONTRACT_ADDRESS);
    uploadContract.methods.add(shareDoc?.provider?.selectedAddress, 'QmbLvM7ELAsZ2ohD3N2Whk5w8xQMF4ppU4ozhgciyVZc8d');
    console.log(shareDoc?.provider?.selectedAddress);
  } */

  const displayFiles = async address => {
    try {
      let files = await uploadContract.methods.getSender(address).call();
      console.log(files);  
    } catch (error) {
      console.log('test1');
      console.log(error);
    }
    
  }

  
  const addFile = async(data) => {
    
    let contract = shareDoc.contract;
    let walletAddress = shareDoc.account.address;
    
    let res = await contract.methods.addFile(data.email, data.post_id).send({from: walletAddress});
    return res;
  }
  
  const onSubmit= async (data) => {
    
    let file_key = (Math.random() + 1).toString(36).substring(7);
    
    setStep1((prev) => { 
      return {
        ...prev,
        uploading: true
      }
    });
    
    const reader = new FileReader();
    let file = data.document[0];
    
    reader.onload = e => {
      var rawLog = reader.result;

      var hash = CryptoJS.SHA256(CryptoJS.lib.WordArray.create(rawLog));
      let fileHash = hash.toString(CryptoJS.enc.Hex);
      const wordArray = CryptoJS.lib.WordArray.create(rawLog);
      const encrypted = CryptoJS.AES.encrypt(wordArray, file_key).toString();
      
      var fileEnc = new Blob([encrypted]);
      let fileName = file.name;
      fileName = fileName.substr(0, fileName.lastIndexOf('.'))
      let encFile = new File([fileEnc], fileHash+'.enc');
      
      let formData = {
        action: 'uploadFile',
        nonce: reactAppData.nonce, 
        docType: shareDoc.doc_type,
        email: shareDoc.email,
        title: data.title,
        file_key: file_key,
        document: encFile,
        fileHash: fileHash
      };
      const headers = {
        'Content-Type': 'multipart/form-data'
      }
      
      axiosClient.post(`${reactAppData.ajaxURL}`,formData,{
        headers: headers
      }).then( async response => {
        let responseData = response.data;
        
        navigate('/users/'+fileHash);
      }).catch(function (error) {
        if(error.response){
          
          swal2({
            type:'error',
            message: error.response.data.data,
          });
        }
      });
    };
    
    reader.readAsArrayBuffer(file);
  }
  
  useEffect( ()=>{
    setShareDoc((prev) => { 
      return {
        ...prev,
        showSideMenu: true
      };
    });
    setValue('email', shareDoc?.email)
      
  },[])
  
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
          <label className="mb-3">Title</label>
          <div className="form-group">
            <input
              name="title"
              className={`form-control rounded-pill xwb-input ${errors?.title ? 'border-danger': ''}`}
              type="title"
              id="title"
              readOnly={shareDoc?.title ? true : false}
              {...register('title',{
                required: "This field is required!"
              })}
            />
            {errors?.title && <small className="input-errors text-danger" dangerouslySetInnerHTML={{__html: errors.title?.message}}></small>}
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
        {/* <div className="mb-3">
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
            <div id="emailHelp" className="form-text">This is the key for your file. Give this to the person you want to share with.</div>
            {errors?.file_key && <small className="input-errors text-danger" dangerouslySetInnerHTML={{__html: errors.file_key?.message}}></small>}
          </div>
        </div> */}
        <div className="mb-3">
          <button
            type="submit"
            className="btn bg-blue-400 rounded-pill px-3"
          >
            Upload 
            {step1?.uploading && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
            
          </button>
        </div>
        {/* <div className="mb-3">
          <button
            type="button"
            onClick={()=> {
              navigate('/')
            }}
            className="btn bg-blue-400 rounded-pill px-3"
          >
            Upload 
          </button>
        </div> */}
      </form>
    </>
  );
};

Step1.propTypes = {};

export default Step1;
