import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { ENV } from "../../config.env";
import { S3Client } from "@aws-sdk/client-s3";
import axios from "axios";

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner"),
  { GetObjectCommand, PutObjectCommand, S3 } = require("@aws-sdk/client-s3");

const { AWS_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY, AWS_SECRET_ACCESS_KEY } =
  ENV;
const TempPage = () => {
  const [files, setFiles] = useState<File | undefined>();
  const [key, setKey] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);

  const s3Client = new S3Client({
    credentials: {
      accessKeyId: AWS_ACCESS_KEY,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
    apiVersion: "4",
    region: AWS_REGION,
  });

  const handleFileUpload = async () => {
    try {
      const fileExtention = files?.name.split(".").pop();
      const uuidKey = `Transcribes/Original_File/${self.crypto.randomUUID()}.${fileExtention}`;
      setKey(uuidKey);

      const params = {
        Bucket: AWS_S3_BUCKET,
        Key: uuidKey,
      };
      const command = new PutObjectCommand(params);
      const UploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600,
      });
      console.log(UploadUrl);
      await axios.put(UploadUrl, files, {
        headers: {
          "Content-Type": "video/*",
        },

        onUploadProgress: (progressEvent: any) => {
          const totalBytes = progressEvent.total;
          const uploadedSoFar = progressEvent.loaded;
          const percentage = (uploadedSoFar / totalBytes) * 100;
          setProgress(Math.round(percentage));
        },
      });
      console.log("File Uploaded Sucessfully");
      // Construct the object URL
      const objurl = `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`;
      console.log("Object URL:", objurl);
    } catch (e) {
      console.error("error", e);
    }
  };
  const handleDownloadFile = async () => {
    try {
      const params = {
        Bucket: AWS_S3_BUCKET,
        Key: key,
      };
      const command = new GetObjectCommand(params);
      const UploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600,
      });
      window.open(UploadUrl, "_blank");
    } catch (e) {
      console.error("Error", e);
    }
  };
  return (
    <>
      <div className="flex flex-col space-y-1.5">
        <Label htmlFor="name">Pick Your File</Label>
        <Input
          onChange={(event) => {
            setFiles(event.target.files?.[0]);
          }}
          type="file"
          accept="video/*"
        />
        <Button onClick={handleFileUpload}>Submit</Button>
        <div className="flex items-center">
          <Progress className="w-[350px] mr-4" value={progress} />{" "}
          <span>{`${progress}%`}</span>
        </div>
        <Button onClick={handleDownloadFile}>Download</Button>
      </div>
    </>
  );
};

export default TempPage;
