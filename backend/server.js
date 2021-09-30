const express = require('express')
const app = express()
const BluebirdPromise = require('bluebird')
const AWS = require('aws-sdk')
const bodyParser = require('body-parser')

app.use(bodyParser.json())

const port = 4000
const BUCKET_NAME = "" // Replace with your s3 bucket name

const s3  = new AWS.S3({
	accessKeyId: '' , // Replace with your access key id
	secretAccessKey: '' , // Replace with your secret access key
	signatureVersion: 'v4'
});

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', (req, res, next) => {
	res.send('Hello World!')
})

app.get('/start-upload', async (req, res, next) => {
	try {
		let params = {
			Bucket: BUCKET_NAME,
			Key: `vishal/${req.query.fileName}`,
			ContentType: req.query.fileType
		}
		console.log("Start upload=====>", params);
		let createUploadPromised = BluebirdPromise.promisify(s3.createMultipartUpload.bind(s3))
		let uploadData = await createUploadPromised(params)
		res.send({uploadId: uploadData.UploadId})
	} catch(err) {
		console.log(err)
	}
})

app.get('/get-upload-url', async (req, res, next) => {
	try {
		let params = {
			Bucket: BUCKET_NAME,
			Key: `vishal/${req.query.fileName}`,
			PartNumber: req.query.partNumber,
			UploadId: req.query.uploadId
		}
		console.log("get signed url=====>",params)
	    let uploadPartPromised = BluebirdPromise.promisify(s3.getSignedUrl.bind(s3))
	    let presignedUrl = await uploadPartPromised('uploadPart', params)
		res.send({presignedUrl})
	} catch(err) {
		console.log(err)
	}
})

app.post('/complete-upload', async (req, res, next) => {
	try {
		console.log(req.body, ': body')
		let params = {
			Bucket: BUCKET_NAME,
			Key: `vishal/${req.body.params.fileName}`,
			MultipartUpload: {
				Parts: req.body.params.parts
			},
			UploadId: req.body.params.uploadId
		}
		console.log("Complete=====>",params)
		console.log("req.body.params.parts 1=====>",req.body.params.parts)
	    let completeUploadPromised = BluebirdPromise.promisify(s3.completeMultipartUpload.bind(s3))
	    let data = await completeUploadPromised(params)
		res.send({data})
	} catch(err) {
		console.log(err)
	}
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
