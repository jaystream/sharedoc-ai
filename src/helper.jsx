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
