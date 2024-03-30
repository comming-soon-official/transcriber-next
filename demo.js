const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// Set the region
const Hello = async () => {
  const region = "ap-south-1";

  // Set the S3 client
  const s3Client = new S3Client({ region });

  // Set the parameters
  const params = {
    Bucket: "tempfilestai",
    Key: "Transcribes/Original_File/25965cec-adfa-4bfd-9c37-89f07afb8f82.mp4",
  };

  // Generate a pre-signed URL
  const command = new GetObjectCommand(params);
  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  console.log("The pre-signed URL is:", url);
};

Hello();
