class Executor {

    execute(prog, vars, robbotRef) {
        this.prog = prog
        this.vars = vars
        const robbot = robbotRef

        this.vars.forEach(v => {
            /* eval(`var ${v} = 0`) refused to work. Hell with it, I'm not proud */
            window[v] = 0
        });

        // console.log(this.vars, this.prog)
        this.PC = 0
        this.executionStep()
    }

    executionStep(robbotRef) {
        if (this.PC >= this.prog.length) return
        const line = this.prog[this.PC]
        console.log(Date.now(), line)
        switch(line.type) {
            case 'instruction':
                setTimeout(() => {
                    eval(line.text)
                    this.PC++
                    this.executionStep(robbotRef)
                }, 0)
                break
            case 'timer':
                setTimeout(() => {
                    this.executionStep(robbotRef)
                    this.PC++
                }, line.text)
                break
        }
    }
}