import React from "react";
import PropTypes from "prop-types";
import { useState, useEffect, useRef } from '@wordpress/element';
import { Editor } from "@tinymce/tinymce-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axiosClient from "./axios";
import { convertWordArrayToUint8Array, fixDiffs, convertHTML, convertUnicode } from "./helper";
import DiffMatchPatch from 'diff-match-patch';
import HtmlDiff from 'htmldiff-js';





import {decode, encode} from 'html-entities';
import fs from 'fs';

var mammoth = require("mammoth");
const CryptoJS = require("crypto-js");
const reactAppData = window.xwbVar || {}

import { asBlob } from 'html-docx-ts'
import { saveAs } from 'file-saver' //save the file


const EditFile = ({shareDoc, setShareDoc}) => {
  const dmp = new DiffMatchPatch();
  const navigate = useNavigate();
  dmp.Diff_Timeout = 5;
  let { fileHash } = useParams();
  
  const [editFile, setEditFile] = useState({
    isAuthorized: true,
    origContent: null,
    newContent: null,
    finalContent: null,
    postID: null,
    efficiency: 4
  });

  const editorRef = useRef(null);
  const log = () => {
    if (editorRef.current) {
      console.log(editorRef.current.getContent());
    }
  };

  const handleInit = (evt, editor) => {
    editorRef.current = editor;
    getFile();
  }
  
  const updateForm = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dmp.Diff_EditCost = parseInt(process.env.REACT_APP_DIFF_EDITCOST)
    dmp.Match_Threshold = parseFloat(process.env.REACT_APP_MATCH_THRESHOLD)
    dmp.Patch_DeleteThreshold = parseFloat(process.env.REACT_APP_PATCH_DELETE_THRESHOLD)
    //dmp.Match_Distance = parseFloat(1)
    
    let newContent = convertUnicode(editorRef.current.getContent());
    let origContent = convertUnicode(editFile.origContent)
    
    let diff = dmp.diff_main(origContent, newContent, true);
    if (diff.length > 2) {
      dmp.diff_cleanupSemantic(diff);
    }
    
    console.log(diff)
    
    let patch = dmp.patch_make(diff)
    
    let textPatched = dmp.patch_toText(patch);
    console.log(textPatched)
    
    
    let updateContentData = {
      'action': 'updateContent',
      'nonce': reactAppData.nonce,
      'oldContent':origContent,
      'newContent':newContent,
      'postID': editFile.postID,
      'edits': diff,
      'patch': textPatched
    };
    
    console.log(updateContentData)
    return false;
    axiosClient.post(`${reactAppData.ajaxURL}`,updateContentData).then(async response => {
      
      if(response.data.success){
        navigate('/review/'+fileHash);
      }
    }).catch(error => {

    });
  }

  const previewHTML = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    dmp.Diff_EditCost = parseInt(process.env.REACT_APP_DIFF_EDITCOST)

    let origContent = convertUnicode(editFile.origContent);
    let newContent = convertUnicode(editorRef.current.getContent());
    let diff = dmp.diff_main(origContent, newContent);
    
    //dmp.diff_cleanupEfficiency(diff);
    dmp.diff_cleanupSemantic(diff);
    
    let diffHTML = dmp.diff_prettyHtml(diff);
    diffHTML = convertUnicode(diffHTML, true);

    var ms_start = (new Date()).getTime();
    
    //let encodedOrigContent = convertHTML(editFile.origContent);
    //let encodedNewContent = convertHTML(newContent);
      console.log(editFile.origContent);
      console.log(editorRef.current.getContent());
    const diffhtml = HtmlDiff.execute(editFile.origContent, editorRef.current.getContent());
    setEditFile((prev) => { 
      return {
        ...prev,
        finalContent: diffhtml
      }
    });
    
    
   
  }

  
  const getFile = () => {
    let getFileArgs = {
      params: {
        action: 'getFile',
        file_hash: fileHash
      }
    }
    axiosClient.get(`${reactAppData.ajaxURL}`,getFileArgs).then( response => {
      let fileData = response.data;
      let responseData = fileData.data;
      if(!responseData?.isAuthorized){
        setEditFile((prev) => { 
          return {
            ...prev,
            isAuthorized: responseData.isAuthorized,
          }
        });
        
        return;
      }
      

      let fileLink = responseData.url;
      let hash = responseData.file_hash;
      let fileKey = responseData.file_key;

      fetch(fileLink).then(async (res) => {
        let enctext = await res.text();
        
        let decrypted = CryptoJS.AES.decrypt(enctext, fileKey);
        
        let typedArray = convertWordArrayToUint8Array(decrypted);
        
        let fileDec = new Blob([typedArray],{type: responseData.mime_type});
        
        const reader = new FileReader();
        
        reader.addEventListener("loadend", () => {
          var rawLog = reader.result;
          mammoth.convertToHtml({arrayBuffer : rawLog})
          .then(result => {
            var html = result.value; // The generated HTML
            const dmp = new DiffMatchPatch();
            
            let chains = responseData.chains?.filter((chain) => {
              return typeof chain.data?.patch !== "undefined"
            });
            let counter = 1;
            let patch;
            chains?.forEach(val => {
              console.log(val.data.oldContent)
              if(counter == 1){
                html = convertUnicode(val.data.newContent,true);
                patch = dmp.patch_fromText(val.data.patch)
              }else{
                html = dmp.patch_apply(patch, val.data.newContent)
              }
              
              
              //console.log(patched)

              
              counter++;
            });
            console.log(html)
            setEditFile((prev) => { 
              return {
                ...prev,
                origContent: html,
                postID: responseData.post_id
              }
            });
            var messages = result.messages; // Any messages, such as warnings during conversion
            editorRef.current.setContent(html);
          })
          .catch(function(error) {
              console.error(error);
          });
        });

        reader.readAsArrayBuffer(fileDec);
      })
      
    });
  }
  useEffect(()=>{
    setShareDoc((prev) => { 
      return {
        ...prev,
        showSideMenu: false
      };
    });
  },[])
  
  return (
    <>
      <div className="row">
        <div className="rol-md-12">
        <Link className="btn btn-sm btn-warning me-1" to={'/'}>Home</Link>
        </div>
      </div>
      <div className="row">
        <div className="col-md-12">
        {
          editFile?.isAuthorized && 
          <form action="" method="POST" onSubmit={updateForm}>
            <div className="row mb-3">
              <div className="col-md-12">
                <Editor
                  apiKey='secbkopg17zk6znukfwm0qzb91l03010zgu669ttz23m8kjk'
                  init={{
                    element_format: 'xhtml',
                    indent: false,
                    plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount pagebreak code',
                    toolbar: 'copy paste undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat pagebreak code',
                  }}
                  initialValue="Welcome to TinyMCE!"
                  onInit={handleInit}
                />
              </div>
            </div>
           {/*  <div className="row">
              <div className="col">
                <div className="input-group mb-3">
                  <span className="input-group-text">Efficiency</span>
                  <input type="number" min={0} className="form-control" aria-label=""
                  value={editFile.efficiency}
                  onChange={(e) => {
                    setEditFile((prev) => { 
                      return {
                        ...prev,
                        efficiency: e.target.value
                      }
                    });
                  }}
                   />
              </div>
              </div>
            </div> */}
            <div className="row">
              <div className="col-md-12">
                <button type="button" className="btn btn-warning me-2" onClick={previewHTML}>Preview</button>
                <button type="submit" className="btn btn-success">Update</button>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12">
                <div id="output" dangerouslySetInnerHTML={{__html: editFile.finalContent}}>
                  
                </div>
              </div>
            </div>
          </form>
        }
        {
          editFile?.isAuthorized==false && 
          <>
            <div className="alert alert-danger" role="alert">
              File doesn't exists or You do not have permission on it.
            </div>
          </>
        }
          
        </div>
      </div>
    </>
  );
};

EditFile.propTypes = {};

export default EditFile;
