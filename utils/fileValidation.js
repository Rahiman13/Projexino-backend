const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

const validateFile = (file) => {
    if (!file) {
        throw new Error('No file provided');
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size exceeds 5MB limit');
    }

    // Check file type
    if (file.mimetype !== 'application/pdf') {
        throw new Error('Only PDF files are allowed');
    }

    return true;
};

module.exports = validateFile;
