import React from "react";
import PropTypes from "prop-types";
import Upload from '../artifacts/contracts/Upload.sol/Upload.json'
import { useForm } from "react-hook-form";
import { useState, useEffect, useRef } from '@wordpress/element';
import { convertWordArrayToUint8Array, swal2, uintToString, wordToByteArray } from "../helper";
const CryptoJS = require("crypto-js");
import { saveAs } from 'file-saver';
import axiosClient from "../axios";
const reactAppData = window.xwbVar || {}
const AWS = require('aws-sdk');




var FileSaver = require('file-saver');

const Files = ({ shareDoc, setShareDoc, handleConnect }) => {
  const { register, setError, reset, formState: { errors }, handleSubmit } = useForm();
  const fileKeyRef = useRef(null);
  const [files, setFiles] = useState({
    list: [],
    shared: [],
    uploadContract: null
  });
  const account = shareDoc?.wallet?.accounts[0];
  const web3 = shareDoc?.web3;
  

  const downloadFile = (e) => {
    e.preventDefault();

    swal2({
        title: 'Input file key to decrypt and download',
        preConfirm: data => {
          
          let fileLink = e.target.getAttribute('href');
          let hash = e.target.getAttribute('hash');
          let fileKey = fileKeyRef.current.value;
          

          //saveAs(fileLink,'doc.doc');

          fetch(fileLink).then(async (res) => {
            //console.log(res.body);
            //FileSaver.saveAs(res.body, "doc.doc");
            

            let enctext = await res.text();
            //console.log(enctext);
            let decrypted = CryptoJS.AES.decrypt(enctext, fileKey);
            console.log(decrypted)
            let typedArray = convertWordArrayToUint8Array(decrypted);
            
            let fileDec = new Blob([typedArray],{type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"});
            console.log(fileDec);
            FileSaver.saveAs(fileDec, "doc.docx");
            return true;
          })
          return false;
        },
        showCancelButton: true,
        confirmButtonText: 'Download',
        didClose: ()=>{
  
        },
        html: (
          <>
            <form action="">
              <div className="mb-3 p-3">
                <input
                  ref={fileKeyRef}
                  name="file_key"
                  className={`form-control rounded-pill xwb-input`}
                  type="text"
                  id="file_key"
                />
            </div>
            </form>
          </>
        )
    });

    
    
  }
  const getFiles = () => {
    let getFilesArgs = {
      params: { 
        action: 'getFiles',
        email: shareDoc?.email,
        post_id: shareDoc?.post_id
      } 
    }
    axiosClient.get(`${reactAppData.ajaxURL}`,getFilesArgs).then( response => {
      let list = response.data;
      setFiles((prev)=>{
        return {
          ...prev,
          list: list.data
        }
      });
      
    });
  }

  const getShared = () => {
    let getSharedArgs = {
      params: { 
        action: 'getShared',
        email: shareDoc?.email,
        post_id: shareDoc?.post_id
      } 
    }
    axiosClient.get(`${reactAppData.ajaxURL}`,getSharedArgs).then( response => {
      let list = response.data;
      setFiles((prev)=>{
        return {
          ...prev,
          shared: list.data
        }
      });
      
    });
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
    getFiles();
    getShared();
  },[]);
  
  return (
    <>
      <div className="row">
        <div className="col-md-12 mb-5">
          <h2 className="app-title">My Files</h2>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>File Hash</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {files?.list?.map((i,k)=> {
                
                return (<tr>
                  <td>{i.post_id} - {i.title}</td>
                  <td></td>
                </tr>)
              })}
            </tbody>
          </table>
        </div>
        <div className="col-md-12">
          <h2 className="app-title">Files Shared to me</h2>
          
          {files?.shared?.length && 
            <table className="table table-bordered">
              <thead>
              <tr>
                <th>File Hash</th>
                <th>Action</th>
              </tr>
              </thead>
              <tbody>
                {
                  files?.shared?.map((i,k)=> {
                    return (<tr>
                      <td>{i.post_id} - {i.title}</td>
                      <td><a hash={i.title} href={i.url} onClick={downloadFile} target="_blank">Download</a></td>
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
