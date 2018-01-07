module.exports = {
    //{name:字段名,data:以逗号分隔的字符串} -> []
    resultToObject(row, name, fieldNames) {
        let result = [];
        let dataLen;

        let fieldDatas = {};
        fieldNames.forEach((field, idx) => {
            fieldDatas[field] = row[field].split(',');
            idx == 0 && (dataLen = fieldDatas[field].length)
            delete row[field];
        })
        for (let i = 0; i < dataLen; i++) {
            let record = {}
            fieldNames.forEach(name => {
                record[name] = fieldDatas[name][i];
            })
            result[i] = record;
        }
        row[name] = result;
        return row;
    },
    getActStatusText(code) {
        let text;
        switch (code) {
            case 0: text = '未开始'; break;
            case 1: text = '预备中'; break;
            case 2: text = '进行中'; break;
            case 3: text = '已结束'; break;
            case 4: text = '已取消'; break;
        }
        return text;
    }
}