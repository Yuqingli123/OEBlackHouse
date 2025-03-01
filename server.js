const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 获取所有记录
app.get('/api/records', (req, res) => {
    fs.readFile(path.join(__dirname, 'records.json'), 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading records');
        }
        res.json(JSON.parse(data));
    });
});

// 保存记录
app.post('/api/records', (req, res) => {
    const newRecord = req.body;
    fs.readFile(path.join(__dirname, 'records.json'), 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading records');
        }
        const records = JSON.parse(data);
        const index = records.findIndex(r => r.id === newRecord.id);
        if (index !== -1) {
            records[index] = newRecord;
        } else {
            records.push(newRecord);
        }
        fs.writeFile(path.join(__dirname, 'records.json'), JSON.stringify(records, null, 2), (err) => {
            if (err) {
                return res.status(500).send('Error saving record');
            }
            res.status(200).send('Record saved');
        });
    });
});

// 删除记录
app.delete('/api/records/:id', (req, res) => {
    const recordId = parseInt(req.params.id, 10);
    fs.readFile(path.join(__dirname, 'records.json'), 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading records');
        }
        let records = JSON.parse(data);
        records = records.filter(record => record.id !== recordId);
        fs.writeFile(path.join(__dirname, 'records.json'), JSON.stringify(records, null, 2), (err) => {
            if (err) {
                return res.status(500).send('Error deleting record');
            }
            res.status(200).send('Record deleted');
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});