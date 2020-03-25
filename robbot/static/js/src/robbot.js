/* globals $ */

/* XBLOCK STUFF*/

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
            rot: 90,
            speed: 100,
            WL: 50,
            WR: 0,
            width: 50,
            length: 70
        }


        const map = {
            finish: {
                x: 500,
                y: 500
            }
        }

        const workbench = {
            blocks: [
                {
                    id: 1,
                    type: 'start',
                    text: '',
                    inputs: [],
                    outputs: [2],
                    x: 50,
                    y: 50,
                },
                {
                    id: 2,
                    type: 'instructions',
                    text: 'x = 0',
                    inputs: [1],
                    outputs: [],
                    x: 200,
                    y: 50
                }
            ]
        }

        let intervalID = null

        let draggableBlock = null

        /* UI ELEMENTS DECLARATION */

        const UIRobbot = $('robbot', element)
        const UIInfo = $('#tab-content .run .toolbar .info', element)
        const UIBtnPlayPause = $('#tab-content .run .controls .play_pause', element)
        const UIBtnNextStep = $('#tab-content .run .controls .next_step', element)
        const UITabs = $('#tab-header .tab-header-item', element)
        const UIContents = $('#tab-content .tab-content-item', element)
        const UIRun_ToolbarToggler = $('#tab-content .run .toolbar .toolbar-toggler', element)
        const UISource_ToolbarToggler = $('#tab-content .source .toolbar .toolbar-toggler', element)
        const UIWorkbench = $('#tab-content .source #workbench', element)

        /* EVENT LISTENERS */

        UIBtnPlayPause.on('click', () => {
            if (UIBtnPlayPause.classList.toggle('running')) {
                executionRun()
            } else {
                executionPause()
            }
        })

        UIBtnNextStep.on('click', () => {
            executionPause()
            executionCycle()
        })

        UIRun_ToolbarToggler.on('click', e => {
            e.target.parentNode.classList.toggle('closed')
            e.target.classList.toggle('closed')
            e.target.innerHTML = 'X' === e.target.innerHTML ? '<' : 'X'
        })

        UISource_ToolbarToggler.on('click', e => {
            e.target.parentNode.classList.toggle('closed')
            e.target.classList.toggle('closed')
            e.target.innerHTML = 'X' === e.target.innerHTML ? '<' : 'X'
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

        /* UTIL FUNCTIONS */

        const executionRun = () => {
            intervalID = setInterval(executionCycle, 1000 / cfg.fps)
            UIBtnPlayPause.innerHTML = '||'
        }

        const executionPause = () => {
            UIBtnPlayPause.classList.remove('running')
            clearInterval(intervalID)
            UIBtnPlayPause.innerHTML = '|>'
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
            console.log(blockToUpdate)
            blockToUpdate.x = draggableBlock[0].offsetLeft
            blockToUpdate.y = draggableBlock[0].offsetTop
            draggableBlock = null
            console.log(workbench)
        }
        /* SOME BUSINESS LOGIC */

        function executionCycle() {
            moveRobbot()
            renderRuntime()
            if (Math.abs(robbot.x - map.finish.x) < 10 && Math.abs(robbot.y - map.finish.y) < 10) {
                executionPause()
                alert('You win!')
            }
        }

        //eslint-disable-next-line no-unused-vars
        function move2motors() {
            let dS //distance covered per time quant
            if (robbot.WL === robbot.WR) {
                dS = robbot.WL / cfg.fps
            }
            else {
                let speed = (robbot.WL + robbot.WR) / 2
                let rAvg = (robbot.width * robbot.WR) / (robbot.WL - robbot.WR) + robbot.width / 2
                let alpha = (speed) / (cfg.fps * rAvg)
                let dRot = alpha / 2
                let beta = 90 - dRot
                dS = rAvg * Math.sin(alpha) / Math.sin(beta)
                robbot.rot += dRot
            }
            let dY = Math.sin(robbot.rot) * dS
            let dX = Math.cos(robbot.rot) * dS
            robbot.y += dY
            robbot.x += dX
        }

        function moveRobbot() {
            const {rot, speed} = robbot
            const dS = speed / cfg.fps
            robbot.y += Math.sin(rot / 180 * Math.PI) * dS
            robbot.x += Math.cos(rot / 180 * Math.PI) * dS
        }

        function renderRuntime() {
            const {x, y, width, rot, speed} = robbot
            UIRobbot.style.left = `${x - 19.5}px`
            UIRobbot.style.top = `${y - width / 2}px`
            UIRobbot.style.transform = `rotate(${rot}deg)`
            UIInfo.innerHTML = `Speed: ${speed} <br>
                                Rotation: ${rot.toFixed(5)} deg <br>
                                X: ${x.toFixed(5)} <br> Y: ${y.toFixed(5)}`
        }

        function renderWorkbench() {
            const { blocks } = workbench
            UIWorkbench.empty()
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
            })
        }

        renderWorkbench()
    })
}