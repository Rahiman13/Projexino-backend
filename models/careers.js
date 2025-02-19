const mongoose = require('mongoose');

const careerSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    department: { 
        type: String, 
        required: true 
    },
    location: { 
        type: String, 
        required: true 
    },
    type: { 
        type: String, 
        enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
        default: 'Full-time'
    },
    experience: {
        min: { type: Number, required: true },
        max: { type: Number, required: true }
    },
    salary: {
        min: { type: Number },
        max: { type: Number }
    },
    description: { 
        type: String, 
        required: true 
    },
    requirements: [{ 
        type: String 
    }],
    responsibilities: [{ 
        type: String 
    }],
    benefits: [{ 
        type: String 
    }],
    status: { 
        type: String, 
        enum: ['Active', 'Closed', 'Draft'],
        default: 'Active'
    },
    applicationDeadline: { 
        type: Date 
    },
    postedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    applications: [{
        name: { type: String },
        email: { type: String },
        phone: { type: String },
        resumeUrl: { type: String },
        appliedAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

const Career = mongoose.model('Career', careerSchema);
module.exports = Career;
