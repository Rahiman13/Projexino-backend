const Contact = require('../models/contact');

// Create new contact
exports.createContact = async (req, res) => {
    try {
        const { name, email, message } = req.body;

        // Validate input
        if (!name || !email || !message) {
            return res.status(400).json({ 
                error: 'Please provide name, email and message' 
            });
        }

        // Create new contact
        const contact = new Contact({
            name,
            email,
            message
        });

        // Save contact to database
        await contact.save();

        res.status(201).json({
            message: 'Contact form submitted successfully',
            contact
        });
    } catch (error) {
        console.error('Error in createContact:', error);
        res.status(500).json({ 
            error: 'Error submitting contact form' 
        });
    }
};

// Get all contacts (optional - for admin purposes)
exports.getContacts = async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.status(200).json(contacts);
    } catch (error) {
        res.status(500).json({ 
            error: 'Error fetching contacts' 
        });
    }
};
