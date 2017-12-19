module.exports = {
    resultToObject(cols){
        let result = [];
        let names = cols.map(item=>{
            return item.name
        })
        let datas = cols.map(item=>{
            return {
                [item.name]:item.data.split(',')
            };
        })
    }
}