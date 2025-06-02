import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import Papa from 'papaparse';

const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, '');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `csv-${uniqueSuffix}${extension}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

export const uploadCsv = upload.single('csvFile');

export async function handleCsvUpload(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { batchName, batchType } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const filePath = req.file.path;
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    });

    if (parseResult.errors.length > 0) {
      return res.status(400).json({ 
        error: 'CSV parsing failed', 
        details: parseResult.errors 
      });
    }

    const columnHeaders = parseResult.meta.fields || [];
    const rows = parseResult.data;

    const csvFile = await prisma.csvFile.create({
      data: {
        userId,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        columnHeaders: columnHeaders,
        rowCount: rows.length,
        filePath: filePath,
        batchName: batchName || req.file.originalname,
        batchType: batchType || 'Company'
      }
    });

    const csvRows = rows.map((rowData, index) => ({
      csvFileId: csvFile.id,
      rowData: rowData,
      rowIndex: index
    }));

    await prisma.csvRow.createMany({ data: csvRows });

    res.json({
      success: true,
      csvFile: {
        id: csvFile.id,
        fileName: csvFile.fileName,
        originalName: csvFile.originalName,
        columnHeaders: csvFile.columnHeaders,
        rowCount: csvFile.rowCount,
        batchName: csvFile.batchName,
        batchType: csvFile.batchType,
        uploadedAt: csvFile.uploadedAt
      },
      preview: rows.slice(0, 5)
    });

  } catch (error) {
    console.error('CSV upload error:', error);
    res.status(500).json({ 
      error: 'Failed to process CSV file',
      details: error.message || 'Unknown error'
    });
  }
}

export async function getCsvFiles(req, res) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const csvFiles = await prisma.csvFile.findMany({
      where: { userId },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        originalName: true,
        uploadedAt: true,
        columnHeaders: true,
        rowCount: true,
        batchName: true,
        batchType: true
      }
    });

    res.json({ csvFiles });
  } catch (error) {
    console.error('Error fetching CSV files:', error);
    res.status(500).json({ error: 'Failed to fetch CSV files' });
  }
}

export async function getCsvData(req, res) {
  try {
    const { csvFileId } = req.params;
    const { page = 1, limit = 50, sort, filter } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const csvFile = await prisma.csvFile.findFirst({
      where: { id: csvFileId, userId }
    });

    if (!csvFile) {
      return res.status(404).json({ error: 'CSV file not found' });
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    let whereClause = { csvFileId };
    
    if (filter) {
      const filterStr = filter;
      whereClause.OR = Object.keys(csvFile.columnHeaders).map(column => ({
        rowData: {
          path: [column],
          string_contains: filterStr
        }
      }));
    }

    const [csvRows, totalCount] = await Promise.all([
      prisma.csvRow.findMany({
        where: whereClause,
        skip,
        take: Number(limit),
        orderBy: { rowIndex: sort === 'desc' ? 'desc' : 'asc' }
      }),
      prisma.csvRow.count({ where: whereClause })
    ]);

    res.json({
      data: csvRows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / Number(limit))
      },
      csvFile: {
        id: csvFile.id,
        originalName: csvFile.originalName,
        columnHeaders: csvFile.columnHeaders,
        rowCount: csvFile.rowCount,
        batchName: csvFile.batchName,
        batchType: csvFile.batchType
      }
    });

  } catch (error) {
    console.error('Error fetching CSV data:', error);
    res.status(500).json({ error: 'Failed to fetch CSV data' });
  }
}

export async function updateCsvRow(req, res) {
  try {
    const { rowId } = req.params;
    const { rowData } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const existingRow = await prisma.csvRow.findFirst({
      where: { 
        id: rowId,
        csvFile: { userId }
      }
    });

    if (!existingRow) {
      return res.status(404).json({ error: 'CSV row not found' });
    }

    const updatedRow = await prisma.csvRow.update({
      where: { id: rowId },
      data: { rowData }
    });

    res.json({ success: true, row: updatedRow });

  } catch (error) {
    console.error('Error updating CSV row:', error);
    res.status(500).json({ error: 'Failed to update CSV row' });
  }
}

export async function deleteCsvFile(req, res) {
  try {
    const { csvFileId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const csvFile = await prisma.csvFile.findFirst({
      where: { id: csvFileId, userId }
    });

    if (!csvFile) {
      return res.status(404).json({ error: 'CSV file not found' });
    }

    if (csvFile.filePath) {
      try {
        await fs.unlink(csvFile.filePath);
      } catch (error) {
        console.warn('Failed to delete file from filesystem:', error);
      }
    }

    await prisma.csvFile.delete({ where: { id: csvFileId } });
    res.json({ success: true });

  } catch (error) {
    console.error('Error deleting CSV file:', error);
    res.status(500).json({ error: 'Failed to delete CSV file' });
  }
}
