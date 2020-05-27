/* globals $, Translator, Executor, Drawer */
//eslint-disable-next-line no-unused-vars
function RobbotXBlock(runtime, element) {
  // var handlerUrl = runtime.handlerUrl(element, 'test')

  $(function() {

    /* STATES */
    const cfg = {
      fps: 30
    }

    const robbot = {
      x: 100,
      y: 100,
      rot: 0,
      speed: 10,

      colorSensor: 0,
      distanceSensor: 1000,

      radius: 40,
    }


    const map = {
      finish: {
        x: 500,
        y: 500,
        radius: 20
      },
      walls: [
        [700, 300, 700, 50]
      ]
    }

    const workbench = {
      blocks: [
        {
          id: 1,
          type: 'start',
          text: '',
          inputs: [],
          outputs: [2],
          x: 200,
          y: 150,
        },
        {
          id: 2,
          type: 'instructions',
          text: 'SPEED = 50\nROT = 0\n',
          inputs: [1],
          outputs: [3],
          x: 300,
          y: 150
        },
        {
          id: 3,
          type: 'condition',
          text: 'DISTANCE < 150',
          inputs: [2, 6],
          outputs: [4, 5],
          x: 400,
          y: 150
        },
        {
          id: 4,
          type: 'instructions',
          text: 'ROT = 90',
          inputs: [3],
          outputs: [5],
          x: 500,
          y: 150
        },
        {
          id: 5,
          type: 'condition-merge',
          inputs: [3, 4],
          outputs: [6],
          x: 450,
          y: 350
        },
        {
          id: 6,
          type: 'timer',
          text: '100',
          inputs: [5],
          outputs: [3],
          x: 350,
          y: 350,
        },
      ]
    }

    /* UI ELEMENTS DECLARATION */

    const UIInfo = $('#tab-content .run .toolbar .info', element)
    const UIBtnPlayPause = $('#tab-content .run .controls .play_pause', element)
    const UIBtnNextStep = $('#tab-content .run .controls .next_step', element)
    const UITabs = $('#tab-header .tab-header-item', element)
    const UIContents = $('#tab-content .tab-content-item', element)
    const UIRun_ToolbarToggler = $('#tab-content .run .toolbar .toolbar-toggler', element)
    const UISource_ToolbarToggler = $('#tab-content .source .toolbar .toolbar-toggler', element)
    const UIWorkbench = $('#tab-content .source #workbench', element)
    const UIBlockInfo = $('#tab-content .source .toolbar .block-info', element)
    const UIBlockCode = $('#tab-content .source .toolbar textarea', element)
    const UIDrawingToggler = $('#tab-content .tab-content-item.run .drawing .drawing-toggler', element)
    const UIEraserToggler = $('#tab-content .tab-content-item.run .drawing .eraser-toggler', element)
    const UIDrawingWidth = $('#tab-content .tab-content-item.run .drawing .stroke-width', element)

    const ctx = getCanvasContext($('#canvas', UIWorkbench)[0])
    const mapCanvas = $('#map_canvas', element)
    const drawingCanvas = $('#drawing_canvas', element)
    const robbotCanvas = $('#robbot_canvas', element)

    let intervalID = null

    let draggableBlock = null

    let selectedBlock = null

    const translator = new Translator(workbench.blocks, {
      SPEED: 'robbot_instance.speed',
      ROT: 'robbot_instance.rot',
      COLOR: 'robbot_instance.colorSensor',
      DISTANCE: 'robbot_instance.distanceSensor'
    })

    const executor = new Executor()

    const drawer = new Drawer(robbotCanvas, drawingCanvas, mapCanvas)

    /* EVENT LISTENERS */

    UIBtnPlayPause.on('click', () => {
      if (UIBtnPlayPause[0].classList.toggle('running')) {
        executionRun()
      } else {
        executionPause()
      }
    })

    UIBtnNextStep.on('click', () => {
      executionPause()
      executionCycle()
    })

    UIEraserToggler.on('click', e => {
      $(e.target).toggleClass('active')
      if($(e.target).hasClass('active')) {
        UIDrawingToggler.removeClass('active')
        drawer.setDrawingStrokeWidth(UIDrawingWidth.val())
        drawer.drawOn()
        drawer.setDrawingMode('erase')
      } else {
        drawer.drawOff()
      }
    })

    UIDrawingToggler.on('click', e => {
      $(e.target).toggleClass('active')
      if($(e.target).hasClass('active')) {
        UIEraserToggler.removeClass('active')
        drawer.setDrawingStrokeWidth(UIDrawingWidth.val())
        drawer.drawOn()
        drawer.setDrawingMode('draw')
      } else {
        drawer.drawOff()
      }
    })

    UIDrawingWidth.on('change', e => {
      drawer.setDrawingStrokeWidth($(e.target).val())
    })

    UIRun_ToolbarToggler.on('click', e => {
      $(e.target).parent().parent().toggleClass('closed')
      $(e.target).toggleClass('closed')
      $(e.target).html('X' === e.target.innerHTML ? '<' : 'X')
    })

    UISource_ToolbarToggler.on('click', e => {
      $(e.target).parent().parent().toggleClass('closed')
      $(e.target).toggleClass('closed')
      $(e.target).html('X' === e.target.innerHTML ? '<' : 'X')
    })

    UITabs.each((i, tab) => {
      $(tab).on('click', e => {
        UITabs.each((i, el) => $(el).removeClass('active'))
        UIContents.each((i, el) => $(el).removeClass('active'))
        const selectedContent = $(`#tab-content .${e.target.getAttribute('data-toggle')}`)
        selectedContent.addClass('active')
        $(e.target).addClass('active')
      })
    })

    UIWorkbench.on('click', e => {
      if(!$(e.target).hasClass('block')) {
        $('.block', UIWorkbench).removeClass('active')
        UIBlockInfo.html('')
        selectedBlock = null
      }
    })

    UIBlockCode.on('blur', e => {
      const block = workbench.blocks.filter(b => b.id === +selectedBlock.attr('id').split('-')[1])[0]
      block.text = $(e.target).val()
    })
    /* UTIL FUNCTIONS */

    const executionRun = () => {
      intervalID = setInterval(executionCycle, 1000 / cfg.fps)
      executor.execute(translator.getProg(), translator.getVars(), robbot)
      UIBtnPlayPause.html('||')
    }

    const executionPause = () => {
      UIBtnPlayPause.removeClass('running')
      clearInterval(intervalID)
      UIBtnPlayPause.html('|>')
    }

    const dragBlock = e => {
      e = e || window.event
      e.preventDefault()
      if (draggableBlock) {
        const x = draggableBlock.data('blockDraggingX') - e.clientX
        const y = draggableBlock.data('blockDraggingY') - e.clientY
        draggableBlock.data({
          blockDraggingX: e.clientX,
          blockDraggingY: e.clientY
        })
        draggableBlock.css({
          top: `${(draggableBlock[0].offsetTop - y)}px`,
          left: `${(draggableBlock[0].offsetLeft - x)}px`
        })
      }
    }

    const undragBlock = () => {
      $(document).off('mousemove')
      $(document).off('mouseup')
      const blockToUpdate = workbench.blocks.filter(b => b.id === draggableBlock.data('block').id)[0]
      blockToUpdate.x = draggableBlock[0].offsetLeft
      blockToUpdate.y = draggableBlock[0].offsetTop
      draggableBlock = null
      renderArrows()
      const result = translator.translate()
      if (typeof result === 'object') {
        UIRaiseError(result)
      }
    }

    const displayBlockInfo = e => {
      const {id, type, text} = workbench.blocks.filter(b => b.id === +$(e.target).attr('id').split('-')[1])[0]
      UIBlockInfo.html(`id: ${id}<br> type: ${type}<br>`)
      UIBlockCode.val(text)
    }

    function getCanvasContext(canvas) {
      return canvas.getContext('2d')
    }

    function UIRaiseError(error) {
      //TODO: do it ok
      console.error(JSON.stringify(error, null, 2))
    }
    /* SOME BUSINESS LOGIC */

    function executionCycle() {
      console.time('bench')
      updateRobbotState()
      renderRuntime()
      if (Math.abs(robbot.x - map.finish.x) < 10 && Math.abs(robbot.y - map.finish.y) < 10) {
        executionPause()
        alert('You win!')
      }
      console.timeEnd('bench')
    }

    function updateRobbotState() {
      const {rot, speed} = robbot
      const dS = speed / cfg.fps
      robbot.y += Math.sin(rot / 180 * Math.PI) * dS
      robbot.x += Math.cos(rot / 180 * Math.PI) * dS
      robbot.colorSensor = drawer.getUnderlayingColor()
      robbot.distanceSensor = getDistance()
    }

    function renderRuntime() {
      const {x, y, rot, speed, colorSensor, distanceSensor} = robbot
      UIInfo.html(`Speed: ${speed} <br>
                        Rotation: ${rot.toFixed(5)} deg <br>
                        X: ${x.toFixed(5)} <br> Y: ${y.toFixed(5)} <br>
                        Color Sensor: ${colorSensor} <br>
                        Distance Sensor: ${distanceSensor.toFixed(0)}`)
      drawer.drawRobbot(robbot)
    }

    function renderWorkbench() {
      const { blocks } = workbench
      UIWorkbench.remove('.block')
      blocks.forEach( block => {
        $(`<div class="block block-${block.type}" id="block-${block.id}"></div>`)
          .data('block', block)
          .css({
            left: `${block.x}px`,
            top: `${block.y}px`
          })
          .appendTo(UIWorkbench)
          .on('mousedown', e => {
            e = e || window.event
            e.preventDefault()
            draggableBlock = $(e.target)
            $(e.target)
              .data({
                blockDraggingX: e.clientX,
                blockDraggingY: e.clientY
              })
            $(document).on('mousemove', dragBlock)
            $(document).on('mouseup', undragBlock)
          })
          .on('click', e => {
            displayBlockInfo(e)
            $('.block', UIWorkbench).removeClass('active')
            $(e.target).addClass('active')
            selectedBlock = $(e.target)
          })
      })
      renderArrows()
    }

    function renderArrows() {
      ctx.canvas.width = UIWorkbench.width()
      ctx.canvas.height = UIWorkbench.height()
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      const {blocks} = workbench
      blocks.forEach(block => {
        const nextBlocks = blocks.filter(b => block.outputs.includes(b.id))
        nextBlocks.forEach(b => {
          ctx.beginPath()
          ctx.moveTo(block.x + 25, block.y + 25)
          ctx.lineTo(b.x + 25, b.y + 25)
          ctx.stroke()
        })
      })
    }

    function getDistance() {
      const {x, y, rot, radius} = robbot
      const lidar = [
        x + radius * Math.cos(rot * Math.PI / 180),
        y + radius * Math.sin(rot * Math.PI / 180),
        x + (radius + 1000) * Math.cos(rot * Math.PI / 180),
        y + (radius + 1000) * Math.sin(rot * Math.PI / 180)
      ]
      let distance = 1000
      let x1 = lidar[0]
      let y1 = lidar[1]
      let x2 = lidar[2]
      let y2 = lidar[3]

      if (x1 > x2) {
        [x1, x2] = [x2, x1]
      }
      if (y1 > y2) {
        [y1, y2] = [y2, y1]
      }

      map.walls.forEach(wall => {
        let x3 = wall[0]
        let y3 = wall[1]
        let x4 = wall[2]
        let y4 = wall[3]
        if (x3 > x4) {
          [x3, x4] = [x4, x3]
        }
        if (y3 > y4) {
          [y3, y4] = [y4, y3]
        }
        const u = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) /
                   ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1))
        const intersectionX = x1 + u * (x2 - x1)
        const intersectionY = y1 + u * (y2 - y1)

        if (isFinite(intersectionX) && intersectionX >= x3 && intersectionX <= x4 &&
            intersectionX >= x1 && intersectionX <= x2 &&
            isFinite(intersectionY) && intersectionY >= y3 && intersectionY <= y4 &&
            intersectionY >= y1 && intersectionY <= y2) {
          const d = Math.sqrt((intersectionX - lidar[0]) ** 2 + (intersectionY - lidar[1]) ** 2)
          if (d < distance) {
            distance = d
          }
        }
      })
      return distance
    }

    drawer.drawMap(map)
    renderWorkbench()
    renderRuntime()
  })
}