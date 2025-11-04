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

    totalStockIn: { 
        type: Number, 
        required: true 
    },
    totalStockOut: { 
        type: Number, 
        required: true 
    },
    remainingStock: { 
        type: Number, 
        required: true 
    },

    stockDetails: [{
        materialId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Material' 
        },
        materialName: { 
            type: String 
        },
        stockIn: { 
            type: Number,
            default: 0
        },
        stockOut: { 
            type: Number,
            default: 0
        },
        date: { 
            type: Date 
        },
    }],
    
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('StockReport', stockReportSchema);
