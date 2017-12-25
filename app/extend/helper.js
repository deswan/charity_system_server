module.exports = {
    //{name:字段名,data:以逗号分隔的字符串} -> []
    resultToObject(row,name,fieldNames){
        let result = [];
        let dataLen;

        let fieldDatas = {};
        fieldNames.forEach((field,idx)=>{
            fieldDatas[field] = row[field].split(',');
            idx == 0 && (dataLen = fieldDatas[field].length)
            delete row[field];
        })
        for(let i=0;i<dataLen;i++){
            let record = {}
            fieldNames.forEach(name=>{
                record[name] = fieldDatas[name][i];
            })
            result[i] = record;
        }
        row[name] = result;
        return row;
    }
}