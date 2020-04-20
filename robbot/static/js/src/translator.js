class Translator {
    constructor(blocks, globals) {
        this.blocks = blocks
        this.globals = globals
        this.errors = new Errors('en').get()
        this.mathOperators = ['**', '*', '/', '+', '-']
        this.logicOperators = ['&&', '||']
        this.vars = []
        this.program = []
    }

    translate() {
        const blocks = this.blocks
        this.program = []
        this.vars = []
        const visited = []
        let prevBlock = blocks.find(b => b.type === 'start')
        while(true) {
            const block = blocks.find(b => prevBlock.outputs.includes(b.id))
            if (visited.includes(block.id)) {
                this.program.push({type: 'jump', text: this.program.findIndex(p => p.block === block.id)})
                return
            } else {
                visited.push(block.id)
            }
            if (block.type === 'instructions') {
                let res = this.translateInstructionBlock(block)
                if (res.code) {
                    return res
                } else {
                    this.program.push(...res)
                }
            } else if (block.type === 'timer') {
                let res = this.translateTimer(block)
                if (res.code) {
                    return res
                } else {
                    this.program.push(res)
                }
            }
            if (block.outputs.length) {
                prevBlock = block
            } else {
                break
            }
        }
    }

    translateTimer({text, id}) {
        const trimmed = text.trim()
        if ('number' === typeof +trimmed && isFinite(+trimmed)) {
            return {
                block: id,
                line: 0,
                type: 'timer',
                text: trimmed
            }
        } else {
            return this.raiseError('timer-invalid-value', id, 0)
        }
    }

    translateInstructionBlock({text, id}) {
        const lines = text.split(/\r|\n|\r\n/).filter(l => l.trim().length)
        let translated = []
        let error = null
        lines.forEach((line, lineidx) => {
            const res = this.translateInstruction(line.trim())
            if (res.code) {
                error = this.raiseError(res.code, id, lineidx)
            } else {
                translated.push({block: id, line: lineidx, type: 'instruction', text: res})
            }
        });
        return error ? error : translated
    }

    translateInstruction(text) {
        const leaves = text.split('=')
        if (leaves.length === 2) {
            const left = this.translateVar(leaves[0], true)
            const right = this.translateArithmeticExpression(leaves[1])
            if (left.code) {
                return this.raiseError(left.code)
            }
            if (right.code) {
                return this.raiseError(right.code)
            }
            return `${left}=${right}`
        } else if (leaves.length === 1) {
            return this.raiseError('inst-no-assignment')
        } else {
            return this.raiseError('inst-multiple-assignments')
        }
    }

    translateVar(text, canDeclare = false) {
        const trimmed = text.trim()
        if (/^[A-Za-z_]\w*$/.test(trimmed)) {
            if (this.globals[trimmed]) {
                return this.globals[trimmed]
            } else {
                if (!this.globals[trimmed] && canDeclare) {
                    this.vars.push(trimmed)
                    return `robbot_user_var_${trimmed}`
                } else if (this.vars.includes(trimmed)) {
                    return `robbot_user_var_${trimmed}`
                } else {
                    return this.raiseError('inst-illegal-var-declaration')
                }
            }
        } else {
            return this.raiseError('inst-illegal-var-declaration')
        }
    }

    translateArithmeticExpression(text) {
        const trimmed = text.trim()
        const isAE = this.mathOperators
                        .map(o => trimmed.includes(o))
                        .reduce((a, v) => a || v)
        if (isAE) {
            let left = ''
            let right = ''
            let op = ''
            if (trimmed.includes('+')) {
                [left, ...right] = trimmed.split('+')
                op = '+'
            } else if (trimmed.includes('-')) {
                [left, ...right] = trimmed.split('-')
                op = '-'
            } else if (trimmed.includes('*')) {
                [left, ...right] = trimmed.split('*')
                op = '*'
            } else if (trimmed.includes('/')) {
                [left, ...right] = trimmed.split('/')
                op = '/'
            } else if (trimmed.includes('**')) {
                [left, ...right] = trimmed.split('**')
                op = '**'
            }
            left = this.translateArithmeticExpression(left)
            right = this.translateArithmeticExpression(right.join(''))
            if (left.code) {
                return this.raiseError(left.code)
            }
            if (right.code) {
                return this.raiseError(right.code)
            }
            return `${left}${op}${right}`
        } else {
            const res = this.translateOperand(trimmed)
            if (res.code) {
                return this.raiseError(res.code)
            }
            return res
        }
    }

    translateOperand(text) {
        const trimmed = text.trim()
        if ('number' === typeof +trimmed && isFinite(+trimmed)) {
            return trimmed
        } else {
            const res = this.translateVar(trimmed)
            if (res.code) {
                return this.raiseError(res.code)
            }
            return res
        }
    }

    raiseError = (error, blockid, lineidx) => ({
        code: error,
        message: this.errors[error] || 'Something not good happened',
        block: blockid,
        line: lineidx
    })

    getProg = () => this.program

    getVars = () => this.vars.map(v => `robbot_user_var_${v}`)
}