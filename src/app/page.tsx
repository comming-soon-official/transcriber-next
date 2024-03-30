"use client";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { ENV } from "../../config.env";
import { S3Client } from "@aws-sdk/client-s3";
import axios from "axios";
import { Loader2 } from "lucide-react";

import TempPage from "./temp";
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner"),
  { GetObjectCommand, PutObjectCommand, S3 } = require("@aws-sdk/client-s3");

type StatusType = {
  progress: number;
  isFileUploading: boolean;
  isFileDownloading: boolean;
  isChangedFile: boolean;
};
export default function Home() {
  const [files, setFiles] = useState<File | undefined>();
  const [key, setKey] = useState<string>("");
  const [status, setStatus] = useState<StatusType>({
    progress: 0,
    isFileUploading: false,
    isFileDownloading: false,
    isChangedFile: false,
  });
  const { AWS_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY, AWS_SECRET_ACCESS_KEY } =
    ENV;
  const s3Client = new S3Client({
    credentials: {
      accessKeyId: AWS_ACCESS_KEY,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
    apiVersion: "4",
    region: AWS_REGION,
  });

  const handleFileUpload = async () => {
    setStatus((prev) => {
      const tempvar = { ...prev };
      tempvar.isFileUploading = true;
      return tempvar;
    });
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
      await axios.put(UploadUrl, files, {
        headers: {
          "Content-Type": "video/*",
        },

        onUploadProgress: (progressEvent: any) => {
          const totalBytes = progressEvent.total;
          const uploadedSoFar = progressEvent.loaded;
          const percentage = (uploadedSoFar / totalBytes) * 100;
          setStatus({ ...status, progress: Math.round(percentage) });
        },
      });
    } catch (e) {
      console.error("error", e);
    }
    setStatus((prev) => {
      const tempvar = { ...prev };
      tempvar.isFileUploading = false;
      return tempvar;
    });
  };
  const handleDownloadFile = async () => {
    setStatus((prev) => {
      const tempvar = { ...prev };
      tempvar.isFileDownloading = true;
      return tempvar;
    });

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
    setStatus((prev) => {
      const tempvar = { ...prev };
      tempvar.isFileDownloading = false;
      return tempvar;
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-32 font-mono">
      <div>
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Transcribe App</CardTitle>
            <CardDescription>
              Deploy your new project in one-click.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="name">Pick Your File</Label>
                  <Input
                    onChange={(event) => {
                      setStatus((prev) => {
                        const tempvar = { ...prev };
                        tempvar.isChangedFile = true;
                        return tempvar;
                      });
                      setFiles(event.target.files?.[0]);
                    }}
                    type="file"
                    accept="video/*"
                  />

                  {status.progress > 0 && (
                    <div className="w-full flex justify-center items-center">
                      <Progress className="mr-2" value={status.progress} />{" "}
                      <span>{`${status.progress}%`}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="framework">Select launguage</Label>
                  <Select>
                    <SelectTrigger id="framework">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="french">French</SelectItem>
                      <SelectItem value="german">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex-col justify-end">
            <div className="mb-4">
              {status.isChangedFile === true && status.progress === 100 ? (
                <Button
                  variant={"outline"}
                  onClick={handleDownloadFile}
                  disabled={status.isFileDownloading}
                >
                  {status.isFileDownloading ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Please Wait
                    </div>
                  ) : (
                    <>Download</>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleFileUpload}
                  disabled={status.isFileUploading || status.progress > 0}
                >
                  {" "}
                  {status.isFileUploading || status.progress > 0 ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Please Wait
                    </div>
                  ) : (
                    <>Upload</>
                  )}
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
        {/* <TempPage /> */}
      </div>
    </main>
  );
}
