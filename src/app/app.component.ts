import { Component } from "@angular/core";
import { from, Observable } from "rxjs";
import { combineAll, map } from "rxjs/operators";
import { ISasToken } from "./azure-storage/azureStorage";
import { BlobStorageService } from "./azure-storage/blob-storage.service";
import { environment } from "src/environments/environment";

interface IUploadProgress {
  filename: string;
  progress: number;
}

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent {
  uploadProgress$: Observable<IUploadProgress[]>;
  filesSelected = false;
  formData = new FormData();
  textColor: string = "#fff";
  color: string = "#d83636";
  height: string = "410px";
  folder: string = "finalFolder";
  demoUri: string = environment.demoUri;
  constructor(private blobStorage: BlobStorageService) {}

  onFileChange(event: any): void {
    this.formData.append("backgroundImage", event.target.files[0]);
    this.filesSelected = true;
    var obj = `
    <!DOCTYPE html>
    <html lang = 'en'>
    <head>
    <meta charset='utf-8'>
    <script src=${environment.botSrc}></script>
    <style>
    body {
      background-image: url('/${this.folder}/${event.target.files[0].name}');
      background-repeat: no-repeat;
      background-attachment: fixed;
      background-size: cover;
    }
    </style>
    </head>
    <body>
    <zeroshot-bot textColor="${this.textColor}" color="${this.color}" height="${this.height}" bot="${environment.botSpecs}"></zeroshot-bot>
    </body>
    </html>`;
    const blob = new Blob([obj], { type: "text/html" });
    this.formData.append("upload_file", blob, "index.html");
    let files = [];
    files.push(this.formData.getAll("upload_file"));
    files.push(this.formData.getAll("backgroundImage"));
    this.uploadProgress$ = from(files).pipe(
      map((file) => this.uploadFile(file as File, this.folder)),
      combineAll()
    );
  }

  uploadFile(file: File, folderName: string): Observable<IUploadProgress> {
    const accessToken: ISasToken = {
      container: "$web",
      filename: file[0].name,
      storageAccessToken: environment.storageAccessToken,
      storageUri: environment.storageUri,
      folderName,
    };

    return this.blobStorage
      .uploadToBlobStorage(accessToken, file)
      .pipe(map((progress) => this.mapProgress(file, progress)));
  }

  private mapProgress(file: File, progress: number): IUploadProgress {
    return {
      filename: file[0].name,
      progress: progress,
    };
  }
}
