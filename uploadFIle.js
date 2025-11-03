// uploadFile.js
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Uploads a file to Firebase Storage and returns its public URL.
 * @param {File} file - The file to upload.
 * @param {string} userId - The user identifier (e.g., user's email or UID).
 * @returns {Promise<string>} - The download URL of the uploaded file.
 */
export async function uploadFile(file, userId = "guest") {
  return new Promise((resolve, reject) => {
    const fileRef = ref(storage, `users/${userId}/${file.name}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Optional: you can track progress here
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(`Upload is ${progress.toFixed(0)}% done`);
      },
      (error) => reject(error),
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
}
