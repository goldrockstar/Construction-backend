const mongoose = require('mongoose');

const salaryReportSchema = new mongoose.Schema({
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

    totalProjectSalary: { 
        type: Number, 
        required: true 
    },

    manpowerDetails: [{
        manpowerId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Manpower' 
        },
        manpowerName: { 
            type: String 
        },
        roleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role'
        },
        roleName: {
            type: String
        },
        totalManpowerSalary: {
            type: Number
        }
    }],

    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('SalaryReport', salaryReportSchema);
