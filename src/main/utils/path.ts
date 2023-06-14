export function safePath(path: string){
  let res = path
  // 已经处理过
  if(path.indexOf("\\ ") >= 0 || path.indexOf("\\\\") >= 0) {
    return res
  }

  if(path.indexOf("\\") >= 0){
    res = res.replaceAll("\\", "\\\\")
  }
  if(path.indexOf(" ") >= 0){
    res = res.replaceAll(" ", "\ ")
  }
  
  return res
}
