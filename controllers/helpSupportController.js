const HelpSupport = require('../models/HelpSupport');

// submit a help/support request
exports.createSupport = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required',
      });
    }

    const ticketData = { name, email, phone, subject, message };

    // attach user if authenticated
    if (req.user && req.user._id) {
      ticketData.user = req.user._id;
      // prefer user name/email if not provided explicitly
      if (!ticketData.name && req.user.name) ticketData.name = req.user.name;
      if (!ticketData.email && req.user.email) ticketData.email = req.user.email;
      if (!ticketData.phone && req.user.phone) ticketData.phone = req.user.phone;
    }

    const ticket = await HelpSupport.create(ticketData);

    res.status(201).json({
      success: true,
      message: 'Your request has been submitted successfully',
      data: ticket,
    });
  } catch (error) {
    console.error('HelpSupport create error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting request',
      error: error.message,
    });
  }
};

// list all support tickets (admin only)
exports.getAllSupports = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const tickets = await HelpSupport.find()
      .populate('user', 'name phone email role userType')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: tickets.length, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// get a single ticket by id (admin only)
exports.getSupportById = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const ticket = await HelpSupport.findById(req.params.id).populate(
      'user',
      'name phone email role userType'
    );
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};