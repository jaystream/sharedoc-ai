import React from "react";
import PropTypes from "prop-types";
import Upload from '../artifacts/contracts/Upload.sol/Upload.json'
import { useForm } from "react-hook-form";
import { useState, useEffect, useRef } from '@wordpress/element';
import { convertWordArrayToUint8Array, swal2, uintToString, wordToByteArray } from "../helper";
const CryptoJS = require("crypto-js");
import { saveAs } from 'file-saver';
import axiosClient from "../axios";
import { Link, useNavigate } from "react-router-dom";
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

  const navigate = useNavigate();

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

          fetch(fileLink).then(async (res) => {
            let enctext = await res.text();

            let decrypted = CryptoJS.AES.decrypt(enctext, fileKey);

            let typedArray = convertWordArrayToUint8Array(decrypted);
            
            let fileDec = new Blob([typedArray],{type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"});

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

  const shareFile = (fileHash) => {
    navigate('/users/'+fileHash);
  }

  const editFile = () => {

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
    setShareDoc((prev) => { 
      return {
        ...prev,
        showSideMenu: true
      };
    });
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
                <th>Title</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {files?.list?.map((i,k)=> {
                
                return (<tr key={k}>
                  <td>{i.title}</td>
                  <td>
                    <Link className="btn btn-sm btn-warning me-1" to={`files/${i.block_hash}`}>Edit</Link>
                    <a href="" className="btn btn-sm btn-info me-1" onClick={(e) => {
                      e.preventDefault();
                      shareFile(i.block_hash);
                    }}>Share</a>
                    <Link className="btn btn-sm btn-success me-1" to={`review/${i.block_hash}`}>Review</Link>
                    </td>
                </tr>)
              })}
              {
                (files?.list?.length == 0) && 
                <tr>
                  <td colSpan={2}>No Records Found!</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div className="col-md-12">
          <h2 className="app-title">Files Shared to me</h2>
          
          
            <table className="table table-bordered">
              <thead>
              <tr>
                <th>Title</th>
                <th>Action</th>
              </tr>
              </thead>
              <tbody>
                {
                  files?.shared?.map((i,k)=> {
                    
                    return (<tr key={k}>
                      <td>{i.title}</td>
                      <td>
                        <Link className="btn btn-sm btn-warning me-1" to={`files/${i.title}`}>Edit</Link>
                        <Link className="btn btn-sm btn-success me-1" to={`review/${i.block_hash}`}>Review</Link>
                      </td>
                    </tr>)
                  })
                }

              {
                (files?.shared?.length == 0) && 
                <tr>
                  <td colSpan={2}>No Records Found!</td>
                </tr>
              }
              </tbody>
            </table>
          
          
        </div>
      </div>
    </>
  );
};

Files.propTypes = {};

export default Files;
