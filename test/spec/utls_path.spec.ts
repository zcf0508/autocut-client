import { savePath } from "~~/utils"

describe("utils_path",()=>{
  it("savePath 1", ()=>{
    const path = ""
    const result = savePath(path)
    expect(result).toBe("")
  })
  it("savePath 2", ()=>{
    const path = "e:\\test"
    const result = savePath(path)
    expect(result).toBe("e:\\\\test")
  })
  it("savePath 3", ()=>{
    const path = "e:\\\\test"
    const result = savePath(path)
    expect(result).toBe("e:\\\\test")
  })
  it("savePath 4", ()=>{
    const path = "e:\\te st"
    const result = savePath(path)
    expect(result).toBe("e:\\\\te st")
  })
  it("savePath 5", ()=>{
    const path = "e:\\te\ st"
    const result = savePath(path)
    expect(result).toBe("e:\\\\te st")
  })
  it("savePath 6", ()=>{
    const path = "/te st"
    const result = savePath(path)
    expect(result).toBe("/te st")
  })
  it("savePath 7", ()=>{
    const path = "/te\ st"
    const result = savePath(path)
    expect(result).toBe("/te st")
  })
})
