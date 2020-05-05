//eslint-disable-next-line no-unused-vars
class Drawer {
  /**
 *
 * @param {Canvas} robbot_canvas
 * @param {Canvas} drawing_canvas
 */
  constructor(robbot_canvas, drawing_canvas, map_canvas) {
    this.robbot_ctx = robbot_canvas[0].getContext('2d')
    this.robbot_ctx.canvas.width = robbot_canvas.width()
    this.robbot_ctx.canvas.height = robbot_canvas.height()

    this.drawing_ctx = drawing_canvas[0].getContext('2d')
    this.drawing_ctx.canvas.width = drawing_canvas.width()
    this.drawing_ctx.canvas.height = drawing_canvas.height()

    this.map_ctx = map_canvas[0].getContext('2d')
    this.map_ctx.canvas.width = map_canvas.width()
    this.map_ctx.canvas.height = map_canvas.height()

    this.drawing_ctx.moveTo(150, 0)
    this.drawing_ctx.lineTo(150, 500)
    this.drawing_ctx.lineWidth = 30
    this.drawing_ctx.stroke()
  }

  drawRobbot({x, y, rot, radius, distanceSensor}) {
    const ctx = this.robbot_ctx

    const backX = x - radius * Math.cos(rot / 180 * Math.PI)
    const backY = y - radius * Math.sin(rot / 180 * Math.PI)

    const colorSensorX = x + (x - backX) / 2
    const colorSensorY = y + (y - backY) / 2

    const lidar = [
      x + radius * Math.cos(rot * Math.PI / 180),
      y + radius * Math.sin(rot * Math.PI / 180),
      x + (radius + distanceSensor) * Math.cos(rot * Math.PI / 180),
      y + (radius + distanceSensor) * Math.sin(rot * Math.PI / 180)
    ]

    console.log(lidar)

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    /* robbot body */
    ctx.fillStyle = '#666'
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false)
    ctx.fill()

    /* robbot spike */
    ctx.beginPath()
    ctx.fillStyle = '#222'
    ctx.moveTo(backX, backY)
    ctx.arc(
      backX,
      backY,
      radius * 2,
      rot / 180 * Math.PI - 0.2,
      rot / 180 * Math.PI + 0.2
    )
    ctx.lineTo(backX, backY)
    ctx.closePath()
    ctx.fill()

    /* robbot color sensor */
    ctx.beginPath()
    ctx.fillStyle = this.pickColor(colorSensorX, colorSensorY, radius / 5)
    ctx.arc(colorSensorX, colorSensorY, radius / 5, 0, 2 * Math.PI)
    ctx.fill()

    /* robbot distance sensor */
    ctx.beginPath()
    ctx.moveTo(lidar[0], lidar[1])
    ctx.lineTo(lidar[2], lidar[3])
    ctx.strokeStyle = 'pink'
    ctx.lineWidth = 3
    ctx.stroke()
  }

  drawMap({finish, walls}) {
    const ctx = this.map_ctx
    /* finish sign */
    ctx.beginPath()
    ctx.fillStyle = 'lightgreen'
    ctx.strokeStyle = 'green'
    ctx.arc(finish.x, finish.y, finish.radius, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()

    ctx.strokeStyle = 'darkred'
    ctx.lineWidth = 10
    /* walls */
    walls.forEach(wall => {
      ctx.beginPath()
      ctx.moveTo(wall[0], wall[1])
      ctx.lineTo(wall[2], wall[3])
      ctx.stroke()
    })
  }

  pickColor(x, y, range = 8) {
    const ctx = this.drawing_ctx
    const imageData = ctx.getImageData(x - range / 2, y - range / 2, range, range).data
    let intensivity = imageData
      .reduce((a, v, i) => (i + 1) % 4 ? a : a + v)
    intensivity /= (imageData.length / 4)

    this.underlayingColor = intensivity
    const hex = Math.floor(255 - intensivity).toString(16)
    return `#${hex}${hex}${hex}`
  }

  getUnderlayingColor () {
    return this.underlayingColor
  }
}