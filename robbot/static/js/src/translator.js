class Translator {
    constructor(blocks, globals) {
        this.blocks = blocks
        this.globals = globals
        this.errors = new Errors('en').get()
        this.translated = ''
    }

    translate() {
        const blocks = this.blocks
        let prevBlock = blocks.filter(b => b.type === 'start')[0]
        while(true) {
            const block = blocks.filter(b => prevBlock.outputs.includes(b.id))[0]
            if (block.type === 'instructions') {
                let translated = this.translateInstruction(block)
                if (translated.code) {
                    return translated
                } else {
                    this.translated += translated
                }
            }
            if (block.outputs.length) {
                prevBlock = block
            } else {
                break
            }
        }
    }

    translateInstruction({text, id}) {
        const lines = text.split(/\r|\n|\r\n/).filter(l => l.trim().length)
        let translated = ''
        let error = null
        lines.forEach((line, lineidx) => {
            if (line.indexOf('=') > -1) {
                translated += line
            } else {
                error = this.raiseError('inst-no-assignment', id, lineidx)
            }
        });
        return error ? error : translated
    }

    raiseError = (error, blockid, lineidx) => ({
        code: error,
        message: this.errors[error],
        block: blockid,
        line: lineidx
    })

    //TODO: move to runner
    run() {
        eval(this.translated)
        this.translated = ''
    }
}