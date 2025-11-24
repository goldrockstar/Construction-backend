const mongoose = require('mongoose');

const stockReportSchema = new mongoose.Schema({
    projectId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Project', 
        required: true 
    },

    reportDate: { 
        type: Date, 
        default: Date.now 
    },

    fromDate: { 
        type: Date, 
        required: true 
    },
    toDate: { 
        type: Date, 
        required: true 
    },
    
    // --- புதிய ஃபீல்டுகள் (New Fields) ---
    // 1. Opening Stock (தொடக்க கையிருப்பு) - ரிப்போர்ட் தேதிக்கு முன் உள்ள இருப்பு
    totalOpeningStock: { 
        type: Number, 
        required: true,
        default: 0
    },
    // 2. Closing Stock (இறுதி கையிருப்பு) - மொத்த இருப்பு 
    totalClosingStock: {
        type: Number, 
        required: true,
        default: 0
    },
    // --- புதிய ஃபீல்டுகள் (New Fields) ---

    // Note: totalStockIn and totalStockOut now represent transactions ONLY within the fromDate/toDate range.
    totalStockIn: { 
        type: Number, 
        required: true,
        default: 0
    },
    totalStockOut: { 
        type: Number, 
        required: true,
        default: 0
    },
    // The previous 'remainingStock' calculation can now be derived from totalClosingStock or calculated as:
    // (totalOpeningStock + totalStockIn - totalStockOut)

    stockDetails: [{
        materialId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Material' 
        },
        materialName: { 
            type: String 
        },
    }],
    materialMappingDetails: [{
        materialMappingId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'MaterialMapping' 
        },
        materialName: { 
            type: String 
        },
    }],
    
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('StockReport', stockReportSchema);