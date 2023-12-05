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

export const getFile = (param) => {};
