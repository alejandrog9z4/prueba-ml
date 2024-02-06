const router = Router()
const {MultipartController}= require("../controller/multipartController");
/**
 * 
 */
router.post("/multipartUpload", MultipartController.multipartUpload)
router.post("/multipartPreSignedUrls", MultipartController.multipartPreSignedUrls)
router.post("/finishMultipartUpload", MultipartController.finishMultipartUpload)
router.post("/regeneratePresignedUrl", MultipartController.regeneratePresignedUrlsForFailedParts)

module.exports = { router }