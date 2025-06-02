import { Router } from 'express';
import { 
  uploadCsv, 
  handleCsvUpload, 
  getCsvFiles, 
  getCsvData, 
  updateCsvRow, 
  deleteCsvFile 
} from '../api/csv/upload.js';

const router = Router();

router.post('/upload', uploadCsv, handleCsvUpload);
router.get('/files', getCsvFiles);
router.get('/:csvFileId/data', getCsvData);
router.put('/rows/:rowId', updateCsvRow);
router.delete('/:csvFileId', deleteCsvFile);

export default router;
