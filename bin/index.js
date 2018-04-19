#!/usr/bin/env node

let fs = require('fs')
let path = require('path')
let fssys = require('file-system')
let os = require('os');
let cssDom = require('cssdom')
let colors = require('colors')

//取参数
let argv = process.argv
if (argv.length < 3) {
  throw new Error('缺少毕业参数,如cssPrettier --path=Path/to/beautify')
}

argv.shift()
argv.shift()

let params = {}
let temp = []
let tempdir = os.tmpdir()
argv.forEach(item => {
  let [key, value] = item.split('=')

  if (value !== undefined) {
    params[key.replace(/^--/, '')] = value
  } else {
    params[key.replace(/^-/, '')] = true;
  }
})
//console.log(params);
if (params.h) {
  console.log(`cssPrettier\n
                --path css文件所在的目录或着文件路径   
                                                    eg.   cssPrettier --path='path/to/cssfile'
                                                          cssPrettier --path='cssdir'
                -h     使用帮助
                -redo  恢复且只能恢复上次被格式化的内容 
                `.blue);
  return
}
if (params.redo) {
  //读取缓存文件
  let cache = fs.readFileSync(`${tempdir}/cssPrettier.json`)
  let cacheJsonArr = JSON.parse(cache)
  cacheJsonArr.forEach((item) => {
    if (item.tmpPath) {
      let data = fs.readFileSync(item.tmpPath)
      let dataString = data.toString()
      fs.writeFileSync(item.originPath, dataString);
    }
  })
  return
}
if (!params.path) {
  throw new Error('缺少--path参数')
}
//console.log('输入的path如下')
//console.log(params)
//读取path下所有的css文件
fs.stat(params.path, function (err, stat) {
  if (err) {
    console.error(err);
    throw err;
  }
  //console.log(stat);
  // console.info(path+"是一个"+stat.isFile());  
  // console.info(path+"是一个"+stat.isDirectory());  
  if (stat.isFile()) {

    let data = fs.readFileSync(params.path);
    let dataString = data.toString();
    //保存到临时文件
    let tmpPath = `${tempdir}/${(new Date()).getTime()}.css`
    temp.push({
      originPath: params.path,
      tmpPath
    })
    fs.writeFileSync(tmpPath, dataString);
    //开始美化
    let newCss = new cssDom(dataString);
    let cssResult = newCss.beautify({
      separateRule: true
    });
    fs.writeFileSync(params.path, cssResult);

  }
  if (stat.isDirectory()) {
    fssys.recurseSync(params.path, [
      '*.css',
      '**/*.css',
    ], function (filepath, relative, filename) {

      if (filename) {
        // it's file
        // console.log('filepath');
        // console.log(filepath);
        // console.log('filename');
        // console.log(filename);
        let data = fs.readFileSync(filepath);
        let dataString = data.toString();
        //保存到临时文件
        let tmpPath = `${tempdir}/${(new Date()).getTime()+parseInt(Math.random()*1000)}.css`
        temp.push({
          originPath: filepath,
          tmpPath
        })
        fs.writeFileSync(tmpPath, dataString);
        let newCss = new cssDom(dataString);
        let cssResult = newCss.beautify({
          separateRule: true
        });
        fs.writeFileSync(filepath, cssResult);
      } else {
        // it's folder
      }
    });


  }
  fs.writeFileSync(`${tempdir}/cssPrettier.json`, JSON.stringify(temp));
})

console.log('beautify css success'.green);