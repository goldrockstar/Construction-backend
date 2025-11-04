const mongoose = require('mongoose');

const salaryConfigSchema = new mongoose.Schema({
    projectId : {type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true},
    roleId : {type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true},
    fromDate: {type: Date, required: true},
    toDate: {type: Date, required: true},
    salaryPerHead: {type: Number, required: true, min: 0},
    count: {type: Number, required: true, min: 0},
    totalSalary: {type: Number},
    createdAt : {type: Date, default: Date.now},
});

salaryConfigSchema.pre('save', function(next) {
    this.totalSalary = this.salaryPerHead * this.count;
    next();
});

salaryConfigSchema.pre('findOneAndUpdate', async function(next) {
    const update = this.getUpdate();
    const docToUpdate = await this.model.findOne(this.getQuery());

    if (!docToUpdate) {
        return next();
    }

    const currentSalaryPerHead = update.salaryPerHead !== undefined ? update.salaryPerHead : docToUpdate.salaryPerHead;
    const currentCount = update.count !== undefined ? update.count : docToUpdate.count;

    update.totalSalary = currentSalaryPerHead * currentCount;
    next();
});

module.exports = mongoose.model('SalaryConfig', salaryConfigSchema);
