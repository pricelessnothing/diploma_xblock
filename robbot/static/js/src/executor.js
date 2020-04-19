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
        this.executioniId = this.executionStep()
    }

    executionStep() {
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
                case 'timer':
                    clearInterval(this.executioniId)
                    setTimeout(() => {
                        this.executioniId = this.executionStep()
                    }, line.text)
                    break
            }
            this.PC++
        }, 0)
    }
}