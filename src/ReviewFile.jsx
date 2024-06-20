import React from 'react'
import PropTypes from 'prop-types'
import { Link, matchRoutes, useLocation, useNavigate, useParams, useRoutes } from 'react-router-dom';
import { useState, useEffect, useRef } from '@wordpress/element';
import axiosClient from './axios';
import { convertHTML, convertUnicode, convertWordArrayToUint8Array, removeHTMLTags, removeTags } from './helper';
import HtmlDiff from 'htmldiff-js';
import DiffMatchPatch from 'diff-match-patch';
import { Tooltip } from 'react-tooltip';
import { renderToStaticMarkup } from 'react-dom/server';
import ViewEdits from './components/ViewEdits';
import * as sanitizeHtml from 'sanitize-html';


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
  const dmp = new DiffMatchPatch();
  dmp.Match_Threshold = parseFloat(process.env.REACT_APP_MATCH_THRESHOLD)
  dmp.Patch_DeleteThreshold = parseFloat(process.env.REACT_APP_PATCH_DELETE_THRESHOLD)
  /**
   * Compare vs Original
   * 
   * @param {string} hash 
   */
  const compareEdit = data => {
    
    return HtmlDiff.execute(convertUnicode(content.originalContent,true), convertUnicode(data.newContent,true));
    
  }


  /**
   * Get collaborators approval statuses
   * 
   * @param {object} edits 
   */
  const approvalStatus = edits => {
    let noResponse = edits?.approvalStatus?.filter((v,i)=>{
      return v.status == 0 && v.author != content.current_user_id && edits.author != v.author;
    })

    
    let approves = edits?.approvalStatus?.filter((v,i)=>{
      return v.status == 1 && v.author != content.current_user_id && edits.author != v.author;
    })
    let declined = edits?.approvalStatus?.filter((v,i)=>{
      
      return v.status == 2 && v.author != content.current_user_id && edits.author != v.author;
    })

    return (
      <>
        <p className="text-secondary small">
          {
            noResponse?.map((v,i)=>{
              return content?.collaborators[v.author].first_name+ ' '+ content?.collaborators[v.author].last_name;
            }).join(', ')+ ' no response'
          }
        </p>
      </>
    )
    
  }


  /**
   * Approve the edited version
   * 
   * @param {object} edit 
   */
  const approveEdit = edit => {
    let postData = {
      'action': 'approveEdit',
      'nonce': reactAppData.nonce,
      'hash': edit.hash,
      'post_id': content.post_id,
      'auhtor': edit.author,
      'version':edit.version
    };
    
    axiosClient.post(`${reactAppData.ajaxURL}`,postData).then(response => {
      
      console.log(response)
    }).catch(error => {
      nsole.error(error);
    });
  }
  /**
   * Check if chain is valid
   * 
   * @param {object} edit 
   */
  const isValidChain = (edit)  => {
    
  }

  String.prototype.replaceAt = function(index, length, author) {
    let replacement = this.substring(index,index+length)
    replacement = '<span class="auid-'+author+'">'+replacement+'</span>'
    return this.substring(0,index) + replacement + this.substring(index+replacement.length);
  }

  const identifyContent = (lastContent, patches, author) => {
    
    let oldContentPart = ''
    let newContentPart = ''
    let patchCounter = 1;
    let prevPatchLength = 0;
    let operator = '+';
    let startAtOld = 0;
    let strLengthOld = 0;
    let startAtNew = 0;
    let strLengthNew = 0;
    let action = 0;
    let strToSearch = '';
    
    patches?.map((patch,patchKey)  => {
        
      if(patchCounter > 1){
        startAtOld = patch.start1 + prevPatchLength;
        strLengthOld = patch.start1 + patch.length1 + prevPatchLength;
        startAtNew = patch.start2;
        strLengthNew = patch.start2 + patch.length2;
      }else{
        startAtOld = patch.start1;
        strLengthOld = patch.start1 + patch.length1;
        startAtNew = patch.start2;
        strLengthNew = patch.start2 + patch.length2;
      }
      dmp.Match_Distance = parseFloat(1000)
      //dmp.Match_Threshold = parseFloat(0.8);

      //console.log(patch)
      //oldContentPart = lastContent.slice(startAtOld ,strLengthOld)
      newContentPart = lastContent.slice(startAtNew ,strLengthNew)
      //console.log(startAtNew, lastContent, startAtNew)
      //console.log(patchCounter, newContentPart);
      action = patch.diffs[1][0];
      strToSearch = patch.diffs[1][1];
      
      //console.log(startAtNew, newContentPart, strLengthNew)
      //console.log(convertUnicode(edit.newContent).slice(startAtNew, strLengthNew))


      strToSearch = convertUnicode(strToSearch,true);
      strToSearch = sanitizeHtml(strToSearch,{allowedTags:[]})
      
      strToSearch = strToSearch.replace('&lt;/','')
      
      //console.log(patch)
      
      let match = dmp.match_main(lastContent, strToSearch, startAtNew);
      let replaced = lastContent.replaceAt(match,strToSearch.length,author);
      lastContent = convertUnicode(replaced,true);
      
     /*  console.log(lastContent)
      console.log(match, strToSearch, strToSearch.length)
      let strPos = lastContent.substring(match, match+strToSearch.length)
      console.log(strPos) */
      /* oldContentPart = convertUnicode(oldContentPart,true);
      newContentPart = convertUnicode(newContentPart,true);
      
      oldContentPart = sanitizeHtml(oldContentPart,{allowedTags:[]})
      newContentPart = sanitizeHtml(newContentPart,{allowedTags:[]})

      oldContentPart = oldContentPart.replace('&lt;/','')
      newContentPart = newContentPart.replace('&lt;/','') */

      

      if(patch.diffs[1][0] == 1){
        operator = '-';
      }
      if(patch.diffs[1][0] == -1){
        operator = '+';
      }
      prevPatchLength = prevPatchLength + parseInt(operator + patch.diffs[1][1].length);
      patchCounter++;
    })
    return lastContent;
  }


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
              let lastContent = '';
              let newContent = '';
              let matchedContent = '';
              //const dmp = new DiffMatchPatch();
              
              let edits = [];

              let chains = fileData.chains?.filter((chain) => {
                return typeof chain.data?.patch !== "undefined"
              });

              let counter = 1;
              let diff;
              let patch;
              let fixedChanges = chains?.map((v,i) => {
                
                let patched = dmp.patch_fromText(v.data.patch)
                
                edits.push({
                  version: v.version,
                  author: v.data.author,
                  patches: patched,
                  hash: v.hash,
                  newContent: v.data.newContent,
                  oldContent: v.data.oldContent,
                  approvalStatus: v.approvalStatus
                })
                
                

                let converted = v.data.changes?.map((arr,key) => {
                  arr[0] = parseInt(arr[0]);

                  return arr;
                });
                
                if(counter == 1){
                  
                  diff = dmp.diff_main(v.data.oldContent, v.data.newContent)
                  //dmp.diff_cleanupSemantic(diff);

                  //let diffHTML = dmp.diff_prettyHtml(diff)

                  
                  matchedContent = HtmlDiff.execute(convertUnicode(v.data.oldContent, true), convertUnicode(v.data.newContent,true))
                  lastContent = v.data.newContent;
                }else{
                  
                  if(lastContent === ''){
                    patch = dmp.patch_make(diff)
                    newContent = dmp.patch_apply(patch,v.data.newContent)
                  }else{
                    patch = dmp.patch_fromText(v.data.patch);
                    //console.log(patch);
                    //patch = dmp.patch_make(v.data.oldContent,v.data.newContent)
                    newContent = dmp.patch_apply(patch,lastContent)
                    
                  }
                  result = convertUnicode(newContent[0],true)
                  lastContent  = newContent[0];
                  matchedContent = result
                  
                }
                
                let genContent = identifyContent(lastContent, patched, v.data.author)
                
                counter++;
                return converted;
              })

              //console.log(matchedContent)
              //let genContent = identifyContent(lastContent, patched, v.data.author)

              //identifyContent(html, matchedContent, edits)

              /* diff = dmp.diff_main(convertUnicode(html), convertUnicode(matchedContent))
              if (diff.length > 2) {
                dmp.diff_cleanupSemantic(diff);
              }
              
              matchedContent = dmp.diff_prettyHtml(diff);
              matchedContent = convertUnicode(matchedContent,true) */
              
              if(typeof matchedContent === "string" && matchedContent.length === 0){
                matchedContent = html;
              }else{
                matchedContent = HtmlDiff.execute(html, matchedContent);
                
              }
                
              
              setContent((prev) => { 
                return {
                  ...prev,
                  originalContent: convertUnicode(html),
                  oldContent: convertUnicode(oldContent),
                  newContent: newContent,
                  current_user_id: fileData.current_user_id,
                  matchedContent: matchedContent,
                  isAuthorized: isAuthorized,
                  fileHash: fileHash,
                  title: fileData.title,
                  post_id: fileData.post_id,
                  histories: edits,
                  chains: fileData.chains,
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
      <div className="col-md-4 border-start vh-75">
        <h3>Edit Versions</h3>
        
        {
          
          (content.isAuthorized &&
            <div>
              {
              (content?.histories?.length == 0 && 
              <div className="alert alert-danger" role="alert">
                No history found!
              </div>
              )
              }

              {
                (content?.histories?.length > 0 && 
                  <div>
                    
                  <ul className="list-group list-group-flush">
                    {
                      
                      content?.histories?.map((val,i) => {
                        
                        return (
                          <li key={i} className='list-group-item columns-3 gap-3'>
                            
                            <div className="row">
                              <div className="col">
                                <a href="" onClick={(e)=>{e.preventDefault()}} title='Version' className=""><span className="badge badge-xs rounded-pill text-bg-secondary">{val.version}</span></a>
                              </div>
                            </div>
                            <div className="row">
                              <div className="col-md-4">
                                <p style={{color:content?.collaborators[val.author]?.color}}>
                                {content?.collaborators[val.author]?.first_name+ ' '+ content?.collaborators[val.author]?.last_name}</p>
                              </div>
                              <div className="col-md-4">
                                <a href="" onClick={(e)=>e.preventDefault()} className="link" 
                                data-tooltip-id="my-tooltip-click"
                                data-tooltip-html={renderToStaticMarkup(<ViewEdits edits={val.patches} />)}
                                >View Edits</a>
                                <Tooltip
                                  id="my-tooltip-click"
                                  openOnClick={true}
                                />
                              </div>
                              <div className="col-md-4">
                                
                                {
                                  
                                  (val.author != content.current_user_id) && 
                                  <div className="row">
                                    <div className="col-md-12">
                                      <a href="" onClick={(e) => {
                                        e.preventDefault();
                                        approveEdit(val);
                                      }} className="icon me-1">
                                        <i className="fa-regular fa-2x fa-circle-check text-success"></i>
                                      </a>
                                      <a href="" className="icon">
                                        <i className="fa-regular fa-2x fa-circle-xmark text-danger"></i>
                                      </a>
                                    </div>
                                  </div>
                                }
                              
                              </div>
                            </div>
                            <div className="row">
                              <div className="col-md-6">
                                <a href="" onClick={(e)=>{
                                  e.preventDefault();
                                  
                                  setContent((prev) => { 
                                    return {
                                      ...prev,
                                      matchedContent: compareEdit(val)
                                    }
                                  });
                                }} className="btn btn-xs btn-secondary text-nowrap rounded-pill position-relative">Compare vs. Orignal Version</a>
                              </div>
                              <div className="col-md-6">
                                {
                                  approvalStatus(val)
                                }
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
