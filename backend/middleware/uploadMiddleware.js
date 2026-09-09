const multer = require("multer");
const path = require("path");
const fs = require("fs");


const uploadDirectory = path.join(
  __dirname,
  "..",
  "uploads",
  "expenditures"
);


if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(
    uploadDirectory,
    {
      recursive: true,
    }
  );
}


const storage = multer.diskStorage({

  destination: (
    req,
    file,
    cb
  ) => {

    cb(
      null,
      uploadDirectory
    );

  },


  filename: (
    req,
    file,
    cb
  ) => {

    const extension =
      path.extname(
        file.originalname
      ).toLowerCase();


    const baseName =
      path
        .basename(
          file.originalname,
          extension
        )
        .replace(
          /[^a-zA-Z0-9-_]/g,
          "-"
        )
        .substring(
          0,
          80
        );


    const uniqueName =
      `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}-${baseName}${extension}`;


    cb(
      null,
      uniqueName
    );

  },

});


const allowedExtensions = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".csv",
  ".jpg",
  ".jpeg",
  ".png",
];


const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "image/jpeg",
  "image/png",
];


const fileFilter = (
  req,
  file,
  cb
) => {

  const extension =
    path.extname(
      file.originalname
    ).toLowerCase();


  const extensionAllowed =
    allowedExtensions.includes(
      extension
    );


  const mimeTypeAllowed =
    allowedMimeTypes.includes(
      file.mimetype
    );


  if (
    extensionAllowed &&
    mimeTypeAllowed
  ) {

    cb(
      null,
      true
    );

    return;

  }


  cb(
    new Error(
      "Unsupported supporting document format."
    )
  );

};


const upload = multer({

  storage,

  fileFilter,

  limits: {
    fileSize:
      10 * 1024 * 1024,

    files: 1,

  },

});


module.exports = upload;