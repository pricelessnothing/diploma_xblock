// eslint-disable-next-line no-unused-vars
class Executor {

  execute(prog, vars, robbot) {
    this.prog = prog
    this.vars = vars
    this.robbot_instance = robbot

    this.vars.forEach(v => {
      /* eval(`var ${v} = 0`) refused to work. Hell with it, I'm not proud */
      window[v] = 0
    })

    console.log(this.vars, this.prog)
    this.PC = 0
    this.executioniId = this.executionStart(this.robbot_instance)
  }

  executionStart(robbot_instance) {
    return setInterval(() => {
      if (this.PC >= this.prog.length) {
        clearInterval(this.executioniId)
        return
      }
      const line = this.prog[this.PC]
      console.log(Date.now(), line)
      switch(line.type) {
      case 'instruction':
        eval(line.text)
        break
      case 'condition':
        if (eval(line.text)) {
          break
        } else {
          this.PC = line.jmpFalse
          return
        }
      case 'timer':
        clearInterval(this.executioniId)
        setTimeout(() => {
          this.executioniId = this.executionStart(robbot_instance)
        }, line.text)
        break
      case 'jump':
        this.PC = line.text
        return
      }
      this.PC++
    }, 0)
  }

  executionPause() {
    clearInterval(this.executioniId)
  }

  executionResume() {
    this.executioniId = this.executionStart(this.robbot_instance)
  }
}