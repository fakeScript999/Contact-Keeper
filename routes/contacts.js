const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator/check');

const User = require('../models/User');
const Contact = require('../models/Contact');


// @router   GET api/contacts
// @desc     Access contacts
// @access   Private
router.get('/', auth, async(req, res) => {
    try {
        const contacts = await Contact.find({ user: req.user.id }).sort({ date: -1});
        res.json(contacts);
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error!');
    }
});

// @router   POST api/contacts
// @desc     Add a contact
// @access   Private
router.post('/', [ auth, [
        check('name', 'Name is required!').not().isEmpty()
        ]
    ], 
    async(req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array()});
        }
        const { name, email, phone, type } = req.body;

        try {
            const newContact = new Contact({
                name,
                email,
                phone,
                type,
                user: req.user.id
            });

            const contact = newContact.save();
            res.json(contact);

        } catch (error) {
            console.log(error.message);
            res.status(500).send('Server Error!');
        }

    }
);

// @router   PUT api/contacts/:id
// @desc     Update a contact
// @access   Private
router.put('/:id', auth, async (req, res) => {
    const { name, email, phone, type } = req.body;

    // Build Contact Object:
    const contactFields = {};
    if(name) contactFields.name = name;
    if(email) contactFields.email = email;
    if(phone) contactFields.phone = phone;
    if(type) contactFields.type = type;

    try {
        let contact = await Contact.findById(req.params.id);

        if(!contact) return res.status(404),json({ msg: 'Contact not found' });
 
        // Make sure user owns contact:
        if(contact.user.toString() !== req.user.id){
            return res.status(401).json({ msg: 'Not authorized!'});
        }
        contact = await Contact.findByIdAndUpdate(req.params.id,
            { $set: contactFields },
            { new: true});
        res.json(contact);

    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error!');
    }

});

// @router   DELETE api/contacts/:id
// @desc     Delete a contact
// @access   Private
router.delete('/:id', auth, async(req, res) => {
    try {
        let contact = await Contact.findById(req.params.id);

        if(!contact) return res.status(404),json({ msg: 'Contact not found' });
 
        // Make sure user owns contact:
        if(contact.user.toString() !== req.user.id){
            return res.status(401).json({ msg: 'Not authorized!'});
        }
        await Contact.findByIdAndRemove(req.params.id);
        res.json({ msg: 'Contact Removed!'});


    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error!');
    }

});


module.exports = router;