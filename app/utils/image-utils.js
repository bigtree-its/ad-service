const Image = require('../model/common/image');
const ImageKit = require("imagekit");

const privateKey = process.env.IMAGEKIT_PRIVATEKEY;
const publicKey = process.env.IMAGEKIT_PUBLICKEY;
const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

// Initialize
const imageKit = new ImageKit({
    publicKey: `${publicKey}`,
    privateKey: `${privateKey}`,
    urlEndpoint: `${urlEndpoint}`,
});

exports.deleteImages = async (references) => {
    console.log('Deleting images for references '+ JSON.stringify(references))
    let filter = Image.find();
    filter.where({ 'reference': { $in: references } });

    // MongoDb always returns _id, we dont need it, we only need fileId
    var fileIds = await Image.find(filter, 'fileId -_id');
    if ( fileIds){
        console.log('Found Images with fileIds : '+ JSON.stringify(fileIds));
    }
   
    Image.deleteMany(filter).then(result => {
        console.log('Deleted Image(s) ' + JSON.stringify(result));
        if ( fileIds){
            console.log('Deleting remote images with fileIds '+ JSON.stringify(fileIds));
            deleteMany(fileIds);
        }
    }).catch(err => {
        console.error('Image Delete failed: ' + JSON.stringify(err))
    });
}


async function deleteMany(fileIds){
    var ids = [];
    [...fileIds].forEach(element => {
        ids.push(element.fileId);
    });
    const response = await imageKit.bulkDeleteFiles(ids);
    console.log('ImageKit response '+ JSON.stringify(response));
}