// eslint-disable-next-line no-unused-vars
class Translator {
  constructor(blocks, globals) {
    this.blocks = blocks
    this.globals = globals
    // eslint-disable-next-line no-undef
    this.errors = new Errors('en').get()
    this.mathOperators = ['**', '*', '/', '+', '-']
    this.logicOperators = ['&&', '||']
    this.comparisonOperators = ['!=', '==', '>=', '<=', '<', '>']
    this.vars = []
    this.program = []
  }

  translate() {
    const blocks = this.blocks
    this.program = []
    this.vars = []
    this.visited = []
    let prevBlock = blocks.find(b => b.type === 'start')
    // eslint-disable-next-line no-constant-condition
    while(true) {
      const block = blocks.find(b => prevBlock.outputs.includes(b.id))
      if (this.visited.includes(block.id)) {
        this.program.push({type: 'jump', text: this.program.findIndex(p => p.block === block.id)})
        return
      } else {
        this.visited.push(block.id)
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
      } else if (block.type === 'condition') {
        let res = this.translateConditionBlock(block)
        if (res.code) {
          return res
        } else {
          prevBlock = res
          continue
        }
      }
      if (block.outputs.length) {
        prevBlock = block
      } else {
        break
      }
    }
  }

  translateConditionBlock({text, id, outputs}) {
    const trimmed = text.replace(/\r|\n|\r\n/, '&&')
    const conditionIndex = this.program.length //to set instruction index for false branch
    const condition = this.translateCondition(trimmed)
    if (condition.code) {
      return this.raiseError(condition.code, id)
    }
    this.program.push({type: 'condition', block: id, text: condition})
    let nextPositive = this.blocks.find(b => b.id === outputs[0])
    while(nextPositive.type !== 'condition-merge') {
      if (this.visited.includes(nextPositive.id)) {
        this.program.push({
          type: 'jump',
          text: this.program.findIndex(p => p.block === nextPositive.id)
        })
        break
      } else {
        this.visited.push(nextPositive.id)
      }
      if (nextPositive.type === 'instructions') {
        let res = this.translateInstructionBlock(nextPositive)
        if (res.code) {
          return res
        } else {
          this.program.push(...res)
        }
      } else if (nextPositive.type === 'timer') {
        let res = this.translateTimer(nextPositive)
        if (res.code) {
          return res
        } else {
          this.program.push(res)
        }
      }
      nextPositive = this.blocks.find(b => b.id === nextPositive.outputs[0])
    }
    const jmpIndex = this.program.length //to set PC to next instruction after true branch
    this.program.push({type: 'jump', text: ''})
    this.program[conditionIndex].jmpFalse = this.program.length

    let nextNegative = this.blocks.find(b => b.id === outputs[1])
    while(nextNegative.type !== 'condition-merge') {
      if (this.visited.includes(nextNegative.id)) {
        this.program.push({
          type: 'jump',
          text: this.program.findIndex(p => p.block === nextNegative.id)
        })
        break
      } else {
        this.visited.push(nextNegative.id)
      }
      if (nextNegative.type === 'instructions') {
        let res = this.translateInstructionBlock(nextNegative)
        if (res.code) {
          return res
        } else {
          this.program.push(...res)
        }
      } else if (nextNegative.type === 'timer') {
        let res = this.translateTimer(nextNegative)
        if (res.code) {
          return res
        } else {
          this.program.push(res)
        }
      }
      nextNegative = this.blocks.find(b => b.id === nextNegative.outputs[1])
    }
    this.program[jmpIndex].text = this.program.length
    return nextNegative
  }

  translateCondition(text) {
    const trimmed = text.trim()
    const isComplex = this.logicOperators
      .map(o => trimmed.includes(o))
      .reduce((a, v) => a || v)
    if (isComplex) {
      let left = ''
      let right = ''
      let op = ''
      if (trimmed.includes('||')) {
        [left, ...right] = trimmed.split('||')
        op = '||'
      } else if (trimmed.includes('&&')) {
        [left, ...right] = trimmed.split('&&')
        op = '&&'
      }
      left = this.translateCondition(left)
      right = this.translateCondition(right.join(''))
      if (left.code) {
        return this.raiseError(left.code)
      }
      if (right.code) {
        return this.raiseError(right.code)
      }
      return `${left}${op}${right}`
    } else {
      const res = this.translateLogicExpression(trimmed)
      if (res.code) {
        return this.raiseError(res.code)
      }
      return res
    }
  }

  translateLogicExpression(text) {
    const trimmed = text.trim()
    for (const o of this.comparisonOperators){
      if (trimmed.includes(o)) {
        let [left, right] = trimmed.split(o)
        left = this.translateOperand(left)
        right = this.translateOperand(right)
        if (left.code) {
          return this.raiseError(left.code)
        }
        if (right.code) {
          return this.raiseError(right.code)
        }
        return `${left}${o}${right}`
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
    })
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
        if (!this.globals[trimmed] && canDeclare && !this.vars.includes(trimmed)) {
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
      //TODO: fix never visiting condition '**' because of '*' and wrong order if swap em
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

  raiseError (error, blockid, lineidx) {
    return {
      code: error,
      message: this.errors[error] || 'Something not good happened',
      block: blockid,
      line: lineidx
    }
  }

  getProg() {
    return this.program
  }

  getVars() {
    return this.vars.map(v => `robbot_user_var_${v}`)
  }
}