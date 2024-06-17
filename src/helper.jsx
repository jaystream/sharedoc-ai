import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
const CryptoJS = require("crypto-js");
const AWS = require("aws-sdk");
const s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  accessKeyId: process.env.REACT_APP_FILEBASE_KEY,
  secretAccessKey: process.env.REACT_APP_FILEBASE_SECRET,
  endpoint: "https://s3.filebase.com",
  region: "us-east-1",
  signatureVersion: "v4",
});

export const pinFile = (param,cb) => {
  
};

export const delFile = (param,cb) => {
  
  return s3.deleteObject(param, function (err, data) {
    console.log(err, data);
    if (err){
      cb(err);
    } else {
      cb(data);
    }
  });
};


export const toString = (words)=>{
  return CryptoJS.enc.Utf8.stringify(words);
}
export const uintToString = (uintArray) => {
  var decodedStr = new TextDecoder("utf-8").decode(uintArray);
  return decodedStr;
}

export const wordToByteArray = (word, length) => {
  var ba = [],i,xFF = 0xFF;
  if (length > 0)
   ba.push(word >>> 24);
  if (length > 1)
   ba.push((word >>> 16) & xFF);
  if (length > 2)
   ba.push((word >>> 8) & xFF);
  if (length > 3)
   ba.push(word & xFF);
  return ba;
}




export const convertWordArrayToUint8Array = (wordArray) => {
  var arrayOfWords = wordArray.hasOwnProperty("words") ? wordArray.words : [];
  var length = wordArray.hasOwnProperty("sigBytes") ? wordArray.sigBytes : arrayOfWords.length * 4;
  var uInt8Array = new Uint8Array(length), index=0, word, i;
  for (i=0; i<length; i++) {
      word = arrayOfWords[i];
      uInt8Array[index++] = word >> 24;
      uInt8Array[index++] = (word >> 16) & 0xff;
      uInt8Array[index++] = (word >> 8) & 0xff;
      uInt8Array[index++] = word & 0xff;
  }
  return uInt8Array;
}
export const getFile = (param) => {};

export const swal2 = (args) => {
  const MySwal = withReactContent(Swal);
  let message = args.message || '';
  let title = args.title || '';
  let type = args.type;
  let closed = args.closed;
  let opened = args.opened;
  return MySwal.fire({
      title: title,
      text: message,
      icon: type,
      didOpen: (args) => {
          if(opened)
              return opened(args);
      },
      didClose: (args) => {
          if(closed)
              return closed(args);
      },
      ...args
  });
}

export const removeTags = (str) => {
  if ((str === null) || (str === ''))
      return false;
  else
      str = str.toString();

  // Regular expression to identify HTML tags in
  // the input string. Replacing the identified
  // HTML tag with a null string.
  return str.replace(/(<([^>]+)>)/ig, '');
}

export const removeHTMLTags = html => {
  let tagBody = '(?:[^"\'>]|"[^"]*"|\'[^\']*\')*';

  let tagOrComment = new RegExp(
    '<(?:'
    // Comment body.
    + '!--(?:(?:-*[^->])*--+|-?)'
    // Special "raw text" elements whose content should be elided.
    + '|script\\b' + tagBody + '>[\\s\\S]*?</script\\s*'
    + '|style\\b' + tagBody + '>[\\s\\S]*?</style\\s*'
    // Regular name
    + '|/?[a-z]'
    + tagBody
    + ')>',
    'gi');


  var oldHtml;
  do {
    oldHtml = html;
    html = html.replace(tagOrComment, '');
  } while (html !== oldHtml);
  return html.replace(/</g, '&lt;');
}

export const fixDiffs = (diffs = []) => {
  var moveLTTag;
  let fromOldStr = '';
  let newStr = '';
  let str = '';
  let newDiffs = [];
  
  let action;
  diffs.forEach(val => {
    action = val[0];
        
    if(moveLTTag){
      str = '<'+val[1];
      moveLTTag = false;
    }else{
      str = val[1];
    }
    
    
    if(val[1].charAt(val[1].length -1) == '<'){
      
      str = str.slice(0, -1);
      
      moveLTTag = true;
    }else{
      moveLTTag = false;
    }
    //console.log(newDiffs);
    newDiffs.push([action, str]);
  
  });
  
  return newDiffs;
}

export const convertHTML = (str) => {

  const symbols = {
    //"&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&apos;"
  }
  let newStr = str.replaceAll('<','U+003C');
  newStr = newStr.replaceAll('>','U+003E');
  return newStr;
}

export const convertUnicode = (str, reverse = false) => {
  let newStr;
  if(reverse){
    newStr = str.replaceAll(' U+003C','<');
    newStr = newStr.replaceAll('U+003E ','>');
  }else{
    newStr = str.replaceAll('<',' U+003C');
    newStr = newStr.replaceAll('>','U+003E ');
  }
  
  return newStr;
}


export const generateHash = (data) => {
  var hash = CryptoJS.SHA256(CryptoJS.lib.WordArray.create(rawLog));
  let fileHash = hash.toString(CryptoJS.enc.Hex);
}