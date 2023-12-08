import React from "react";
import PropTypes from "prop-types";
import Upload from '../artifacts/contracts/Upload.sol/Upload.json'
import { useForm } from "react-hook-form";
import { useState, useEffect } from '@wordpress/element';
import { convertWordArrayToUint8Array, uintToString, wordToByteArray } from "../helper";
const CryptoJS = require("crypto-js");
import { saveAs } from 'file-saver';
const AWS = require('aws-sdk');




var FileSaver = require('file-saver');

const Files = ({ shareDoc, setShareDoc, handleConnect }) => {
  const { register, setError, reset, formState: { errors }, handleSubmit } = useForm();
  
  const [files, setFiles] = useState({
    list: [],
    shared: [],
    uploadContract: null
  });
  const account = shareDoc?.wallet?.accounts[0];
  const web3 = shareDoc?.web3;
  const s3 = new AWS.S3({
    apiVersion: '2023-12-08',
    accessKeyId: process.env.REACT_APP_FILEBASE_KEY,
    secretAccessKey: process.env.REACT_APP_FILEBASE_SECRET,
    endpoint: 'https://s3.filebase.com',
    region: 'us-east-1',
    signatureVersion: 'v4'
  });


  const downloadFile = (e) => {
    e.preventDefault();
    let fileLink = e.target.getAttribute('href');
    let hash = e.target.getAttribute('hash');
    /* const params = {
      Bucket: 'bucket1',
      Key: fileName
    };

    return new AWS.S3().getObject(params).createReadStream(); */

    saveAs(fileLink,'doc.doc');
    /* fetch(fileLink).then(async (res) => {
      console.log(res.body);
      //FileSaver.saveAs(res.body, "doc.doc");
      

      let enctext = await res.text();
      console.log(enctext);
      let decrypted = CryptoJS.AES.decrypt(enctext, '123');
      let typedArray = convertWordArrayToUint8Array(decrypted);
      console.log(typedArray)
      let fileDec = new Blob([typedArray],{type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"});
      FileSaver.saveAs(fileDec, "doc.docx");
    }) */
  }
  const getFiles = async (web3) => {
    if(web3){
      const uploadContract = new web3.eth.Contract(Upload.abi,process.env.REACT_APP_CONTRACT_ADDRESS);
      
      await uploadContract.methods.display(account).call({from: account}).then(data => {
        setFiles((prev)=>{
          return {
            ...prev,
            list: data
          }
        });
      });

      const accessList = await uploadContract.methods.shareAccess().call(
        {
          from: account
        }, function(error, result){
          
      });

      
      setFiles((prev)=>{
        return {
          ...prev,
          uploadContract: uploadContract
        }
      });
      
      /* let trans = await web3.eth.getTransaction(transactionHash);
      
      const decoded = await web3.eth.abi.decodeParameters(
        [{
          type: 'address',
          name: '_user'
        },{
          type: 'string',
          name: 'url'
         }],
        trans.input.slice(10)
      ); */
    }
  }

  const onSubmit= async (data) => {
    
    await files.uploadContract.methods.display(data.shared_from).call({from: account}).then(data => {
      setFiles((prev)=>{
        return {
          ...prev,
          shared: data
        }
      });
    });
  }

  useEffect( ()=>{
    getFiles(web3)
  },[web3]);
  
  return (
    <>
      <div className="row">
        <div className="col-md-12 mb-5">
          <h2 className="app-title">My Files</h2>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>File</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {files?.list?.map((i,k)=> {
                return (<tr>
                  <td>{i}</td>
                  <td></td>
                </tr>)
              })}
            </tbody>
          </table>
        </div>
        <div className="col-md-12">
          <h2 className="app-title">Files Shared to me</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-3">
              <label htmlFor="shared_from" className="form-label">View shared files from: </label>
              <div className="input-group">
                <input type="text" name="shared_from" {...register('shared_from',{
                  required: "This field is required!"
                })} className={`form-control rounded-start xwb-input ${errors?.shared_from ? 'border-danger': ''}`} id="shared_from" />
                <button class="btn btn-outline-secondary" type="submit" id="button-addon2">Show</button>
              </div>
              <div className="form-text">Wallet address to the person you want to share.</div>
              {errors?.shared_from && <small className="input-errors text-danger" dangerouslySetInnerHTML={{__html: errors.shared_from?.message}}></small>}
            </div>
          </form>
          {files?.shared?.length && 
            <table>
              <thead>
              <tr>
                <th>File</th>
                <th>Action</th>
              </tr>
              </thead>
              <tbody>
                {
                  files?.shared?.map((i,k)=> {
                    return (<tr>
                      <td>{i}</td>
                      <td><a hash={i} href={`https://ipfs.filebase.io/ipfs/${i}`} onClick={downloadFile} target="_blank">Download</a></td>
                    </tr>)
                  })
                }
              </tbody>
            </table>
          }
          
        </div>
      </div>
    </>
  );
};

Files.propTypes = {};

export default Files;
