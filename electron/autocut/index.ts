import {exec} from "child_process"

const excutePath = "D:\\autocut\\autocut.exe"

export function runAutocut() {
  // TODO: 中文路径有问题
  exec(`${excutePath} -t e:\\1.mp4`, (err, stdout, stderr)=>{
    if(err) {
      console.log(err);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  })
}