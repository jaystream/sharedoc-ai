import React from 'react'
import PropTypes from 'prop-types'
import { Link, matchRoutes, useLocation, useNavigate, useParams, useRoutes } from 'react-router-dom';
import { useState, useEffect, useRef } from '@wordpress/element';
import axiosClient from './axios';
import { convertWordArrayToUint8Array } from './helper';
const reactAppData = window.xwbVar || {}
const CryptoJS = require("crypto-js");
var mammoth = require("mammoth");


const ReviewFile = ({shareDoc, setShareDoc}) => {
  const [content, setContent] = useState({
    title: '',
    originalContent: '',
    histories: [],
    isAuthorized: false,
  });
  let { blockHash } = useParams();
  const navigate = useNavigate();
  useEffect( () => {
    setShareDoc((prev) => { 
      return {
        ...prev,
        showSideMenu: false
      };
    });

    axiosClient.get(`${reactAppData.ajaxURL}`,{
      params: {
        action: 'getFileHistory',
        nonce: reactAppData.nonce, 
        block_hash: blockHash
      }
    }).then(response => {
      let responseData = response.data;
      let fileData = responseData.data;
      let fileKey = fileData.file_key;
      let isAuthorized = fileData.isAuthorized;
      fetch(fileData.url).then(async (res) => {
        let enctext = await res.text();
        
        let decrypted = CryptoJS.AES.decrypt(enctext, fileKey);
        
        let typedArray = convertWordArrayToUint8Array(decrypted);
        
        let fileDec = new Blob([typedArray],{type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"});
        
        const reader = new FileReader();
        reader.addEventListener("loadend", () => {
          var rawLog = reader.result;
          mammoth.convertToHtml({arrayBuffer : rawLog})
          .then(function(result){
              var html = result.value; // The generated HTML
              if(!isAuthorized){
                html = `<div class="alert alert-danger" role="alert">
                File doesn't exists or You do not have permission on it.
              </div>`;
              }
              setContent((prev) => { 
                return {
                  ...prev,
                  originalContent: html,
                  isAuthorized: isAuthorized,
                  blockHash: blockHash
                }
              });
          })
          .catch(function(error) {
              console.error(error);
          });
        });

        reader.readAsArrayBuffer(fileDec);
      })


      setContent((prev) => {
        return {
          ...prev,
          title: fileData.title
        }
      })
    });
  },[]);
  
  return (
    <>
    <div className="row">
      <div className="col-md-12">
        <h1 className='text-gray mb-0'> <Link className="btn btn-sm btn-warning me-1" to={'/'}>Home</Link> Document Review</h1>
        <hr />
      </div>
    </div>
    <div className="row">
      <div className="col-md-12">
        <h2 className='text-gray'>Title: {content.title}</h2>
      </div>
    </div>
    <div className="row">
      <div className="col-md-8">
        <div className="doc-content" onClick={(e)=> {
          navigate('/files/'+content.blockHash);
        }} dangerouslySetInnerHTML={{__html: content.originalContent}}>
        </div>
      </div>
      <div className="col-md-4">
        {
          (content.isAuthorized) &&
            (content?.histories?.length == 0 && 
              <div className="alert alert-danger" role="alert">
                No history found!
              </div>
            )
        }
      </div>
    </div>
    </>
    )
  }
  
  ReviewFile.propTypes = {
    
  }
  
  export default ReviewFile
