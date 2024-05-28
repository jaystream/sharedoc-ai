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
    uploadContract: null,
    viewDocs: {
      myDoc: 'All',
      sharedDoc: 'All'
    }
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

  const publishUnpublish = (post_id, current_status) => {
    
    let getFilesArgs = {
      action: 'publishUnpublish',
      post_id: post_id,
      status: current_status,
      nonce: reactAppData.nonce, 
    }
    axiosClient.post(`${reactAppData.ajaxURL}`,getFilesArgs).then( response => {
      let list = response.data;
      getFiles();
      
    });
  }

  const getFiles = () => {
    let getFilesArgs = {
      params: { 
        action: 'getFiles',
        show: files?.viewDocs?.myDoc,
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
        show: files?.viewDocs?.sharedDoc,
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
  },[files.viewDocs]);
  
  return (
    <>
      <div className="row">
        <div className="col-md-12 mb-5">
          <div className="row">
            <div className="col-md-8">
                <h2 className="app-title">My Documents</h2>
            </div>
            <div className="col-md-4">
              <div className="btn-group view-docs-filter float-end">
                <button className="btn btn-sm" type="button">
                  View Docs
                </button>
                <button type="button" className="btn btn-sm dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                <i className="fa-solid fa-caret-down"></i> {files?.viewDocs?.myDoc}
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li><a onClick={(e)=>{
                    e.preventDefault();
                    setFiles((prev)=>{
                      return {
                        ...prev,
                        viewDocs:{
                          myDoc: 'All',
                          sharedDoc: prev.viewDocs.sharedDoc
                        }
                      }
                    });
                  }} className={`dropdown-item ${files.viewDocs?.myDoc=='All' ? 'active': ''}`} href="#">All</a></li>

                  <li><a onClick={(e)=>{
                    e.preventDefault();
                    setFiles((prev)=>{
                      return {
                        ...prev,
                        viewDocs:{
                          myDoc: 'Published',
                          sharedDoc: prev.viewDocs.sharedDoc
                        }
                      }
                    });

                  }} className={`dropdown-item ${files.viewDocs?.myDoc=='Published' ? 'active': ''}`} href="#">Published</a></li>
                  <li><a onClick={(e)=>{
                    e.preventDefault();
                    setFiles((prev)=>{
                      return {
                        ...prev,
                        viewDocs:{
                          myDoc: 'Unpublished',
                          sharedDoc: prev.viewDocs.sharedDoc
                        }
                      }
                    });
                    
                  }}  className={`dropdown-item ${files.viewDocs?.myDoc=='Unpublished' ? 'active': ''}`} href="#">Unpublished</a></li>
                </ul>
              </div>
            </div>
          </div>
          
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
                  <div className="btn-group">
                    <button type="button" className="btn btn-sm dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                      Actions
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end">
                      <li>
                        <Link className="dropdown-item" to={`files/${i.file_hash}`}>Edit</Link>
                      </li>
                      <li>
                        <a href="" className="dropdown-item" onClick={(e) => {
                          e.preventDefault();
                          shareFile(i.file_hash);
                        }}>Share</a>
                      </li>

                      <li><Link className="dropdown-item" to={`review/${i.file_hash}`}>Review</Link></li>
                      
                      <li>
                        <a href="" onClick={(e) => {
                          e.preventDefault();
                          publishUnpublish(i.post_id, i.status)
                        }} className="dropdown-item">
                          {i.status=='publish' ? 'Unpublish':'Publish'}
                        </a>
                      </li>
                    </ul>
                  </div>

                    
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
          <div className="row">
            <div className="col-md-8">
              <h2 className="app-title">Shared Documents</h2>
            </div>
            <div className="col-md-4">
            <div className="btn-group view-docs-filter float-end">
                <button className="btn btn-sm" type="button">
                  View Shared
                </button>
                <button type="button" className="btn btn-sm dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                <i className="fa-solid fa-caret-down"></i> {files?.viewDocs?.sharedDoc}
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li><a onClick={(e)=>{
                    e.preventDefault();
                    setFiles((prev)=>{
                      return {
                        ...prev,
                        viewDocs:{
                          myDoc: prev.viewDocs.myDoc,
                          sharedDoc: 'All'
                        }
                      }
                    });
                  }} className={`dropdown-item ${files?.viewDocs?.shareDoc=='All' ? 'active': ''}`} href="#">All</a></li>

                  <li><a onClick={(e)=>{
                    e.preventDefault();
                    setFiles((prev)=>{
                      return {
                        ...prev,
                        viewDocs:{
                          myDoc: prev.viewDocs.myDoc,
                          sharedDoc: 'Published',
                        }
                      }
                    });

                  }} className={`dropdown-item ${files.viewDocs?.sharedDoc=='Published' ? 'active': ''}`} href="#">Published</a></li>
                  <li><a onClick={(e)=>{
                    e.preventDefault();
                    setFiles((prev)=>{
                      return {
                        ...prev,
                        viewDocs:{
                          myDoc: prev.viewDocs.myDoc,
                          sharedDoc: 'Unpublished'
                        }
                      }
                    });
                    
                  }}  className={`dropdown-item ${files.viewDocs?.sharedDoc=='Unpublished' ? 'active': ''}`} href="#">Unpublished</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-md-12">
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
                          

                            <div className="btn-group">
                              <button type="button" className="btn btn-sm dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                                Actions
                              </button>
                              <ul className="dropdown-menu dropdown-menu-end">
                                <li>
                                  <Link className="dropdown-item" to={`files/${i.file_hash}`}>Edit</Link>
                                </li>
                                <li><Link className="dropdown-item" to={`review/${i.file_hash}`}>Review</Link></li>
                              </ul>
                            </div>
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
        </div>
      </div>
    </>
  );
};

Files.propTypes = {};

export default Files;
