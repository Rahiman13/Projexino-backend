const Career = require('../models/careers');
const cloudinary = require('../config/cloudinaryConfig');
const validateFile = require('../utils/fileValidation');

// Create a new career posting
exports.createCareer = async (req, res) => {
    try {
        const career = new Career({
            ...req.body,
            postedBy: req.user.id
        });
        
        const savedCareer = await career.save();
        res.status(201).json(savedCareer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all career postings
exports.getCareers = async (req, res) => {
    try {
        const careers = await Career.find()
            .populate('postedBy', 'name email')
            .sort({ createdAt: -1 });
        res.status(200).json(careers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a single career posting
exports.getCareerById = async (req, res) => {
    try {
        const career = await Career.findById(req.params.id)
            .populate('postedBy', 'name email');
        
        if (!career) {
            return res.status(404).json({ error: 'Career posting not found' });
        }
        
        res.status(200).json(career);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a career posting
exports.updateCareer = async (req, res) => {
    try {
        const updatedCareer = await Career.findByIdAndUpdate(
            req.params.id,
            { ...req.body },
            { new: true, runValidators: true }
        );

        if (!updatedCareer) {
            return res.status(404).json({ error: 'Career posting not found' });
        }

        res.status(200).json(updatedCareer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a career posting
exports.deleteCareer = async (req, res) => {
    try {
        const career = await Career.findByIdAndDelete(req.params.id);
        
        if (!career) {
            return res.status(404).json({ error: 'Career posting not found' });
        }

        res.status(200).json({ message: 'Career posting deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Apply for a career posting
exports.applyForCareer = async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        let resumeUrl = '';

        if (req.file) {
            try {
                validateFile(req.file);
                
                const result = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream(
                        { 
                            folder: 'resumes',
                            resource_type: 'raw',
                            format: 'pdf',
                            flags: 'attachment',
                            public_id: `resume_${Date.now()}`,
                            transformation: [
                                { fetch_format: 'pdf' },
                                { flags: 'attachment' }
                            ],
                            use_filename: true,
                            unique_filename: true,
                            overwrite: true,
                            invalidate: true,
                            delivery_type: 'upload',
                            access_mode: 'public',
                            type: 'upload',
                            disposition: 'inline'
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    ).end(req.file.buffer);
                });

                resumeUrl = result.secure_url;
            } catch (error) {
                return res.status(400).json({ 
                    error: error.message || 'Error uploading resume'
                });
            }
        }

        const career = await Career.findById(req.params.id);
        if (!career) {
            return res.status(404).json({ error: 'Career posting not found' });
        }

        career.applications.push({
            name,
            email,
            phone,
            resumeUrl
        });

        await career.save();
        res.status(200).json({ message: 'Application submitted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Get monthly career posting counts
exports.getMonthlyCareerCounts = async (req, res) => {
    try {
        const { year } = req.params;
        const monthlyCounts = await Career.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(`${year}-01-01`),
                        $lt: new Date(`${parseInt(year) + 1}-01-01`)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const result = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            count: 0
        }));

        monthlyCounts.forEach(({ _id, count }) => {
            result[_id - 1].count = count;
        });

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all applications across all career postings
exports.getAllApplications = async (req, res) => {
    try {
        const careers = await Career.find()
            .populate('postedBy', 'name email')
            .select('title applications');

        const applications = careers.reduce((allApplications, career) => {
            const careerApplications = career.applications.map(application => ({
                jobTitle: career.title,
                jobId: career._id,
                postedBy: career.postedBy,
                ...application.toObject(),
            }));
            return [...allApplications, ...careerApplications];
        }, []);

        // Sort applications by date, most recent first
        applications.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

        res.status(200).json(applications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get applications for a specific career posting
exports.getApplicationsByCareer = async (req, res) => {
    try {
        const career = await Career.findById(req.params.id)
            .populate('postedBy', 'name email')
            .select('title applications');

        if (!career) {
            return res.status(404).json({ error: 'Career posting not found' });
        }

        const applications = career.applications.map(application => ({
            jobTitle: career.title,
            jobId: career._id,
            postedBy: career.postedBy,
            ...application.toObject()
        }));

        res.status(200).json(applications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
