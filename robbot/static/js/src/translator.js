class Translator {
    constructor(blocks, globals) {
        this.blocks = blocks
        this.globals = globals
        this.errors = new Errors('en').get()
        this.operators = ['+', '-', '*', '/', '**']
    }

    translate() {
        const blocks = this.blocks
        let translated = ''
        let prevBlock = blocks.filter(b => b.type === 'start')[0]
        while(true) {
            const block = blocks.filter(b => prevBlock.outputs.includes(b.id))[0]
            if (block.type === 'instructions') {
                let res = this.translateInstruction(block)
                if (res.code) {
                    return
                } else {
                    translated += res
                }
            }
            if (block.outputs.length) {
                prevBlock = block
            } else {
                break
            }
        }
        return translated
    }

    translateInstruction({text, id}) {
        const lines = text.split(/\r|\n|\r\n/).filter(l => l.trim().length)
        let translated = ''
        let error = null
        lines.forEach((line, lineidx) => {
            if (line.indexOf('=') > -1) {
                let [left, right] = line.split('=')
                left = left.trim()
                if (left.length) {
                    if (/\w+/.test(left)){
                        if (! (/\d/.test(left[0])) ) {
                            if (this.globals[left]) {
                                left = this.globals[left]
                            } else {
                                left = `let ${left}`
                            }
                            translated = `${left} = ${right} \n`
                        } else {
                            error = this.raiseError('inst-no-var-start-number', id, lineidx)
                        }
                    } else {
                        error = this.raiseError('inst-no-disallowed-symbols', id, lineidx)
                    }
                } else {
                    error = this.raiseError('inst-no-left-hand-operand', id, lineidx)
                }
            } else {
                error = this.raiseError('inst-no-assignment', id, lineidx)
            }
        });
        return error ? error : translated
    }

    raiseError = (error, blockid, lineidx) => ({
        code: error,
        message: this.errors[error] || 'Something not good happened',
        block: blockid,
        line: lineidx
    })
}