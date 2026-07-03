const TheatreMedia = require('../models/TheatreMedia.model');
const Theatre3DConfig = require('../models/Theatre3DConfig.model');

exports.uploadTheatreMedia = async (req, res) => {
  try {
    const { theatreId, section, type } = req.body;
    // section example: 'frontLeft'
    // type example: 'screenView' or 'panoramaView'
    if (!req.file || !theatreId || !section || !type) {
      return res.status(400).json({ success: false, message: 'Missing file or variables' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    let media = await TheatreMedia.findOne({ theatreId, ownerId: req.user._id });
    if (!media) {
      media = new TheatreMedia({ theatreId, ownerId: req.user._id });
    }

    if (type === 'screenView') {
      media.screenViews[section] = fileUrl;
    } else if (type === 'panoramaView') {
      media.panoramaViews[section] = fileUrl;
    }

    media.mediaApproved = false; // Reset approval on new upload
    await media.save();

    res.status(200).json({ success: true, fileUrl, media });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTheatreMedia = async (req, res) => {
  try {
    const media = await TheatreMedia.findOne({ theatreId: req.params.theatreId });
    // Note: Public users can only see approved media typically, but for preview we will return all.
    res.status(200).json({ success: true, media });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.save3DConfig = async (req, res) => {
  try {
    const { theatreId, configData } = req.body;
    if (!theatreId || !configData) return res.status(400).json({ success: false });

    let config = await Theatre3DConfig.findOne({ theatreId });
    if (!config) {
      config = new Theatre3DConfig({ theatreId, ...configData });
    } else {
      Object.assign(config, configData);
    }
    
    await config.save();
    res.status(200).json({ success: true, config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.get3DConfig = async (req, res) => {
  try {
    const config = await Theatre3DConfig.findOne({ theatreId: req.params.theatreId });
    res.status(200).json({ success: true, config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAdminPendingMedia = async (req, res) => {
  try {
    const pending = await TheatreMedia.find({ mediaApproved: false }).populate('theatreId ownerId');
    res.status(200).json({ success: true, pending });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.approveMedia = async (req, res) => {
  try {
    const media = await TheatreMedia.findById(req.params.id);
    if (!media) return res.status(404).json({ success: false });
    media.mediaApproved = true;
    await media.save();
    res.status(200).json({ success: true, media });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
