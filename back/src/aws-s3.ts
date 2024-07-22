import { PutObjectCommandInput, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { v4 as uuidv4 } from "uuid";

const client = new S3Client({
  region: "eu-west-3",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS || "",
    secretAccessKey: process.env.AWS_SECRET || "",
  },
});

export async function SaveOnS3(file: File): Promise<string> {
  try {
    const input: PutObjectCommandInput = {
      ACL: "public-read",
      Body: file,
      Bucket: "flash-store",
      Key: `${uuidv4()}_${file.name}`,
      ContentType: file.type,
    };
    const parallelUploads3 = new Upload({ client: client, params: input });

    const object = await parallelUploads3.done();

    return object.Location || "";
    // process data.
  } catch (error) {
    console.log(error);
    return `Erreur lors de l'enregistrement de l'image dans le s3 : ${error}`;
  }
}
