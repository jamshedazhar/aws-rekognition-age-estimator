'use strict';
const uuid = require('uuid/v4');
const aws = require('aws-sdk');
const fs = require('fs')


module.exports.signUrl = (event, context, callback) => {
const s3 = new aws.S3({ apiVersion: '2006-03-01' });

var keys = event.pathParameters.key.split(".");
var uid  =  uuid() + "."+ keys[keys.length -1 ]; 

const s3Params = {
    Bucket: process.env.BUCKET,
    Key: "images/"+ uid,
    Expires: 60,
    ContentType: event.pathParameters.ty + "/" + event.pathParameters.pe,
    ACL: 'public-read'
  };

  s3.getSignedUrl('putObject', s3Params, (err, data) => {
    if(err) callback("error", err);

    const response = {
      statusCode: 200,
      body: JSON.stringify({
        key: uid,
        url: data
      }),
    };

    console.log("UUID: "+ uid );
    callback(null, response);
  });
};

module.exports.index = (event, context, callback) => {
  fs.readFile('index.html', 'utf8', function (err,data) {
    if (err)  callback("error", err);

    callback(null, data);
  });
};

module.exports.analyzeImage = (event, context, callback) =>{
  const rekognition = new aws.Rekognition();
  
  var faceData = {};
  var params = {
    Image: {
     S3Object: {
      Bucket: process.env.BUCKET, 
      Name: "images/"+ event.pathParameters.key
     }
    },
    Attributes: ['ALL']
  };

  rekognition.detectFaces(params, function(err, data){
    if(err) faceData.err = JSON.stringify(err);

    var numOfFaces = data.FaceDetails.length;
    var index = 1;
    faceData[0] = "<b>Found "+ numOfFaces+ " face(s).</b></br>";
    data.FaceDetails.forEach(face =>{
      if(face.Gender.Value == "Male")
        faceData[index] = "<li><b>"+index+ ".</b> A <b>male </b>who ";
      else 
        faceData[index] = "<li><b>"+index+ ".</b> A <b>young girl </b> who ";
      faceData[index] += "looks like " + face.AgeRange.Low + " to "+ face.AgeRange.High +" year old.</li>";
      index = index + 1;
    });
  
    const response = {
      statusCode: 200,
      body: JSON.stringify({
        faceData
      }),
    };
  console.log(JSON.stringify(event));
  callback(null, response);
  });
};