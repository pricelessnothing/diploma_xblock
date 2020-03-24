/* globals $ */

/* XBLOCK STUFF*/

//eslint-disable-next-line no-unused-vars
function RobbotXBlock(runtime, element) {
    var handlerUrl = runtime.handlerUrl(element, 'test')

    $.ajax({
        type: 'POST',
        url: handlerUrl,
        data: JSON.stringify({'hello': 'world'}),
        success: data => alert(data)
    })

    $(function() {

        /* STATES */

        const cfg = {
            fps: 30
        }

        const robbot = {
            x: 100,
            y: 100,
            rot: 0,
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

        let intervalID = null

        /* UI ELEMENTS DECLARATION */

        const UIRobbot = document.getElementById('robbot')
        const UIInfo = document.querySelector('#tab-content .run .toolbar .info')
        const UIBtnPlayPause = document.querySelector('#tab-content .run .controls .play_pause')
        const UIBtnNextStep = document.querySelector('#tab-content .run .controls .next_step')
        const UITabs = document.querySelectorAll('#tab-header .tab-header-item')
        const UIContents = document.querySelectorAll('#tab-content .tab-content-item')
        const UIRun_ToolbarToggler = document.querySelector('#tab-content .run .toolbar .toolbar-toggler')
        // const UIFinishSign = document.querySelectorAll('#tab-content .run .runtime .finish-sign')

        /* EVENT LISTENERS */

        UIBtnPlayPause.addEventListener('click', () => {
            if (UIBtnPlayPause.classList.toggle('running')) {
                executionRun()
            } else {
                executionPause()
            }
        })

        UIBtnNextStep.addEventListener('click', () => {
            executionPause()
            executionCycle()
        })

        UIRun_ToolbarToggler.addEventListener('click', e => {
            e.target.parentNode.classList.toggle('closed')
            e.target.classList.toggle('closed')
            e.target.innerHTML = 'X' === e.target.innerHTML ? '<' : 'X'
        })

        UITabs.forEach(tab => {
            tab.addEventListener('click', e => {
                UITabs.forEach(el => el.classList.remove('active'))
                UIContents.forEach(el => el.classList.remove('active'))
                const selectedContent = document.querySelector(`#tab-content .${e.target.getAttribute('data-toggle')}`)
                selectedContent.classList.add('active')
                e.target.classList.add('active')
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

        /* SOME BUSINESS LOGIC */

        function executionCycle() {
            move()
            render()
            if (Math.abs(robbot.x - map.finish.x) < 10 && Math.abs(robbot.y - map.finish.y) < 10) {
                executionPause()
                alert('You win!')
            }
        }

        function move() {
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

        function render() {
            UIRobbot.style.left = `${robbot.x - 19.5}px`
            UIRobbot.style.top = `${robbot.y - robbot.width / 2}px`
            UIRobbot.style.transform = `rotate(${robbot.rot}rad)`
            UIInfo.innerHTML = `LW: ${robbot.WL.toFixed(5)} <br> RW: ${robbot.WR.toFixed(5)} <br>
                                Rotation: ${robbot.rot.toFixed(5)} rad <br>
                                X: ${robbot.x.toFixed(5)} <br> Y: ${robbot.y.toFixed(5)}`
        }
    })
}