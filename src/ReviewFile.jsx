import React from 'react'
import PropTypes from 'prop-types'
import { Link, matchRoutes, useLocation, useNavigate, useParams, useRoutes } from 'react-router-dom';
import { useState, useEffect, useRef } from '@wordpress/element';
import axiosClient from './axios';
import { convertWordArrayToUint8Array } from './helper';
import HtmlDiff from 'htmldiff-js';
import DiffMatchPatch from 'diff-match-patch';
import { Tooltip } from 'react-tooltip';
import { renderToStaticMarkup } from 'react-dom/server';
import ViewEdits from './components/ViewEdits';


const reactAppData = window.xwbVar || {}
const CryptoJS = require("crypto-js");
var mammoth = require("mammoth");


const ReviewFile = ({shareDoc, setShareDoc}) => {
  const [content, setContent] = useState({
    title: '',
    originalContent: '',
    comparedContent: '',
    histories: [],
    isAuthorized: false,
  });
  let { fileHash } = useParams();
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
        file_hash: fileHash
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
        
        let fileDec = new Blob([typedArray],{type: fileData.mime_type});
        
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

              let oldContent = html;
              let newContent = '';
              let matchedContent = '';
              const dmp = new DiffMatchPatch();
              let patch = '';
              let changes = fileData.chains?.filter((chain) => {
                return Number.isInteger(chain.data?.changes?.length);
              } );
              
              let fixedChanges = changes?.map((v,i) => {
                let converted = v.data.changes?.map((arr,key) => {
                  arr[0] = parseInt(arr[0]);
                  //console.log(arr);
                  return arr;
                });
                //let patch = dmp.patch_make(converted);
                dmp.diff_cleanupSemantic(converted);
              console.log(converted);
              matchedContent = dmp.diff_prettyHtml(converted);
              //console.log(diffHTML);
                //console.log(patch);
                return converted;
              })
              
              
              /* fileData.chains?.map((v,i) => {
                console.log(v.data?.changes)
              }); */
              /* fileData.fileEdits?.map((v,i) => {
                console.log(v);
              }); */
              /* fileData?.chains?.map((v,i) => {
                //console.log(v);
                if(v.index > 1){
                  console.log(v?.data?.changes);
                  v?.data?.changes?.map((a,b) => {
                    console.log(a);
                  });
                  //patch = dmp.patch_make(v?.data?.changes); 
                  //console.log(patch);
                }
              }); */
              //htmldiff.execute(html, newContent);
              console.log(fileData.changes);
              setContent((prev) => { 
                return {
                  ...prev,
                  originalContent: html,
                  oldContent: oldContent,
                  newContent: newContent,
                  matchedContent: matchedContent,
                  isAuthorized: isAuthorized,
                  fileHash: fileHash,
                  title: fileData.title,
                  histories: fileData.changes,
                  collaborators: fileData.collaborators
                }
              });
          })
          .catch(function(error) {
              console.error(error);
          });
        });

        reader.readAsArrayBuffer(fileDec);
      })
      
      /* setContent((prev) => {
        return {
          ...prev,
          title: fileData.title,
          histories: fileData.histories
        }
      }) */
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
          navigate('/files/'+content.fileHash);
        }} dangerouslySetInnerHTML={{__html: content.matchedContent}}>
        </div>
      </div>
      <div className="col-md-4 border-start">
        <h3>Suggestions</h3>
        
        {
          
          (content.isAuthorized &&
            <div>
              {
              (Object.keys(content?.histories).length == 0 && 
              <div className="alert alert-danger" role="alert">
                No history found!
              </div>
              )
              }

              {
                (Object.keys(content?.histories).length > 0 && 
                  <div>
                    
                  <ul className="list-group list-group-flush">
                    {
                      Object.keys(content?.histories)?.map((val,i) => {
                        
                        return (
                          <li key={i} className='list-group-item columns-3 gap-3'>
                            <div className="row">
                              <div className="col-md-4">
                                <p>{content?.collaborators[val]?.first_name+ ' '+ content?.collaborators[val]?.last_name}</p>
                                <p><a href="" className="btn btn-sm btn-secondary text-nowrap rounded-pill">Compare vs. Orignal Version</a></p>
                              </div>
                              <div className="col-md-4">
                                <a href="#" className="link" 
                                data-tooltip-id="my-tooltip-click"
                                data-tooltip-html={renderToStaticMarkup(<ViewEdits edits={content?.histories[val]} />)}
                                >View Edits</a>
                                <Tooltip
                                  id="my-tooltip-click"
                                  openOnClick={true}
                                />
                              </div>
                              <div className="col-md-4">
                                <a href="" className="icon me-1">
                                  <i className="fa-regular fa-2x fa-circle-check text-success"></i>
                                </a>
                                <a href="" className="icon">
                                  <i className="fa-regular fa-2x fa-circle-xmark text-danger"></i>
                                </a>
                              </div>
                            </div>
                          </li>
                        )
                      })
                    }
                  </ul>
                  </div>
                )

              }
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
