const bucketName = Math.floor(Math.random() * 1000000000);

module.exports.BucketName = () => {
   return "rekognition-"+bucketName;
}