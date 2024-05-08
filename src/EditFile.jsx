import React from "react";
import PropTypes from "prop-types";
import { useState, useEffect, useRef } from '@wordpress/element';
import { Editor } from "@tinymce/tinymce-react";
import { Link, useParams } from "react-router-dom";
import axiosClient from "./axios";
import { convertWordArrayToUint8Array, fixDiffs } from "./helper";
import DiffMatchPatch from 'diff-match-patch';
import {decode} from 'html-entities';
import fs from 'fs';

var mammoth = require("mammoth");
const CryptoJS = require("crypto-js");
const reactAppData = window.xwbVar || {}

import { asBlob } from 'html-docx-ts'
import { saveAs } from 'file-saver' //save the file


const EditFile = ({shareDoc, setShareDoc}) => {
  const dmp = new DiffMatchPatch();
  dmp.Diff_Timeout = 1;
  let { blockHash } = useParams();

  const [editFile, setEditFile] = useState({
    isAuthorized: true,
    origContent: null,
    newContent: null,
    finalContent: null
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
    let newContent = editorRef.current.getContent();
    
    var ms_start = (new Date()).getTime();
    let diff = dmp.diff_main(editFile.origContent, newContent);
    var ms_end = (new Date()).getTime();
    var diffSeconds = (ms_end - ms_start) / 1000;
    console.log(ms_end, ms_start);
    let newdiff = fixDiffs(diff);
    
    let diff1 = newdiff;
    console.log(diff1);
    //let diffJson = JSON.stringify(diff1);
    setTimeout(() => {
      console.log(diff1);
      dmp.diff_cleanupSemantic(diff1 );
      let diffHTML = dmp.diff_prettyHtml(diff1 );
      //diffHTML = diffHTML.replace('&para;<br>','');
      
      
      diffHTML = decode(diffHTML, {level: 'html5'});
      console.log('test2');
      setEditFile((prev) => { 
        return {
          ...prev,
          finalContent: diffHTML
        }
      });
    }, 5000);
    
    /* asBlob(editorRef.current.getContent()).then(blobData => {
      saveAs(blobData, `testDocument.docx`) // save as docx document
    }) */
    
  }
  const getFile = () => {
    let getFileArgs = {
      params: {
        action: 'getFile',
        block_hash: blockHash
      }
    }
    axiosClient.get(`${reactAppData.ajaxURL}`,getFileArgs).then( response => {
      let fileData = response.data;
      let responseData = fileData.data;
      if(!responseData?.isAuthorized){
        setEditFile((prev) => { 
          return {
            ...prev,
            isAuthorized: responseData.isAuthorized
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
        
        let fileDec = new Blob([typedArray],{type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"});
        
        const reader = new FileReader();
        reader.addEventListener("loadend", () => {
          var rawLog = reader.result;
          mammoth.convertToHtml({arrayBuffer : rawLog})
          .then(function(result){
              var html = result.value; // The generated HTML
              setEditFile((prev) => { 
                return {
                  ...prev,
                  origContent: html
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
            <div className="row">
              <div className="col-md-12">
                <div id="output" dangerouslySetInnerHTML={{__html: editFile.finalContent}}>
                  
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-12">
                <button type="submit" className="btn btn-success">Update</button>
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