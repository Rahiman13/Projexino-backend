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
            message,
            status: 'Unseen',
            seenAt: null
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
        const contacts = await Contact.find()
            .sort({ status: 1, createdAt: -1 }); // Show unseen first, then by date
        res.status(200).json(contacts);
    } catch (error) {
        res.status(500).json({ 
            error: 'Error fetching contacts' 
        });
    }
};

// Get contact counts
exports.getContactCounts = async (req, res) => {
    try {
        const totalCount = await Contact.countDocuments();
        const seenCount = await Contact.countDocuments({ status: 'Seen' });
        const unseenCount = await Contact.countDocuments({ status: 'Unseen' });

        res.status(200).json({
            total: totalCount,
            seen: seenCount,
            unseen: unseenCount
        });
    } catch (error) {
        console.error('Error in getContactCounts:', error);
        res.status(500).json({ 
            error: 'Error fetching contact counts' 
        });
    }
};

// Mark contact as seen
exports.markAsSeen = async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        
        if (!contact) {
            return res.status(404).json({ 
                error: 'Contact not found' 
            });
        }

        if (contact.status === 'Unseen') {
            contact.status = 'Seen';
            contact.seenAt = Date.now();
            await contact.save();
        }

        res.status(200).json(contact);
    } catch (error) {
        console.error('Error in markAsSeen:', error);
        res.status(500).json({ 
            error: 'Error marking contact as seen' 
        });
    }
};
