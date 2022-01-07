
define("mainRender", function () {

    //DIRECTIVES noMovableScreen
    
    //screen.disableMouseZoom()
    //screen.disableMouseDrag()
    
    
    let vertices      = 7
    let dotsPerCircle = 3
    
    let pointiness = 0.90
    
    
    let innerPolygonsOpacity = smoothState(0)
    let intraPolygonsOpacity = smoothState(0)
    let gearsOpacity         = smoothState(0)
    let pathsOpacity         = smoothState(1)
    
    
    
    let innerCircles
    let allDots
    
    let rotationsForOneTurn
    let innerCircleRadius
    let speedRatio
    
    let bigCog
    let littleCog
    
    
    function init () {
        innerCircles = []
        allDots      = []
        
        let circlesCount    = vertices - dotsPerCircle
        rotationsForOneTurn = circlesCount / dotsPerCircle
        innerCircleRadius   = dotsPerCircle / vertices
        
        speedRatio = (1 - innerCircleRadius) + innerCircleRadius * rotationsForOneTurn
        
        for (let i = 0; i < circlesCount; i += 1) {
            let insideDots = []
            
            let innerCircle = {
                initialDirection: i * 360 / circlesCount,
                orientation: 0,
                dots: insideDots
            }
            
            for (let j = 0; j < dotsPerCircle; j += 1) {
                let dot = {
                    direction: j * 360 / dotsPerCircle
                }
                insideDots.push(dot)
                allDots.push(dot)
            }
            
            innerCircles.push(innerCircle)
            
        }
        buildCogs()
        buildPaths()
    }
    
    
    
    
    
    let rotationSpeed = 23
    
    
    function move (innerCircle, angle) {
        innerCircle.orientation = -angle * rotationsForOneTurn
        
        let center = vector({
            direction: innerCircle.initialDirection + angle,
            length:    1 - innerCircleRadius
        })
        
        innerCircle.center = center
        innerCircle.dots.forEach(dot => {
            let innerVector = vector({
                direction: innerCircle.orientation + dot.direction,
                length:    innerCircleRadius * pointiness
            })
            
            dot.x = center.x + innerVector.x
            dot.y = center.y + innerVector.y
        })
    }
    
    
    let dotsUsedForTrail
    
    function buildPaths () {
        
        let pathForVertex = {}
        dotsUsedForTrail = new Set()
        
        let maxTurn = 0
        
        function findVertexesForPath (start) {
            let vertex = start
            let turn = 1
            while (turn < 20) {
                if (vertex in pathForVertex) {
                    break
                }
                
                pathForVertex[vertex] = start
                dotsUsedForTrail.add(allDots[start])
                maxTurn = Math.max(turn, maxTurn)
                
                vertex += dotsPerCircle
                if (vertex >= vertices) {
                    turn += 1
                    vertex -= vertices
                }
            }
        }
        
        for (let i = 0; i < dotsPerCircle; i += 1) {
            findVertexesForPath(i)
        }
        
        
        dotsUsedForTrail.forEach((dot) => {
            dot.path = []
        })
        
        let angleStop = 360 * maxTurn
        for (let angle = 0; angle <= angleStop; angle += 1) {
            innerCircles.forEach(innerCircle => move(innerCircle, angle))
            
            dotsUsedForTrail.forEach(({x, y, path}) => {
                path.push({x, y})
            })
        }
    }
    
    
    function buildCogs () {
        let deltaRadius = 0.028
        let cogFactor  = Math.ceil(60 / vertices)
        let smallCount = dotsPerCircle * cogFactor
        let count      = vertices * cogFactor
        bigCog = cog({count, radius: 1, deltaRadius})
        littleCog = cog({
            count: smallCount,
            radius: innerCircleRadius,
            deltaRadius
        })
    }
    
    
    function cog ({count, radius, deltaRadius}) {
        let points = []
        let delta = 360 / (count * 4)
        for (let angle = -delta / 2; angle <= 360; angle += delta) {
            let r = radius + deltaRadius * geometry.cos(angle * count)
            points.push({
                x: r * geometry.cos(angle),
                y: r * geometry.sin(angle)
            })
        }
        return points
    }
    
    
    
    
    
    
    
    
    
    function render () {
        screen.clear()
        
        screen.addText({
            text: '{' + vertices + '/' + dotsPerCircle + '}',
            center: {
                x: -1.65,
                y: 0
            },
            font: '0.28u Nasalization',
            color: '#000',
            opacity: 0.25
        })
        
        screen.addCircle({
            center: {x: 0, y: 0},
            radius: 1.1,
            fillColor: '#000',
            opacity: 0.5 + 0.5 * gearsOpacity.currentValue()
        })
        
        screen.addCurve({
            points: bigCog,
            lineWidth: 0.01,
            strokeColor: '#000',
            fillColor: '#292B36'
        })
        
        innerCircles.forEach(renderInnerCircle)
        dotsUsedForTrail.forEach(renderPath)
        renderIntraPolygons()
        innerCircles.forEach(renderInnerPolygons)
        allDots.forEach(renderDot)
    }
    
    
    function renderInnerCircle (innerCircle) {
        let {center, orientation} = innerCircle
        
        screen.addCurve({
            points: littleCog,
            lineWidth: 0.01,
            fillColor: '#00000088',
            strokeColor: '#000000',
            opacity: gearsOpacity.currentValue() * 0.6,
            base: {
                x: center.x,
                y: center.y,
                orientation
            }
        })
        
    }
    
    
    function renderInnerPolygons ({dots}) {
        screen.addCurve({
            points: dots,
            close:  true,
            lineWidth: 0.015,
            strokeColor: '#FA4',
            opacity: innerPolygonsOpacity.currentValue()
        })
    }
    
    
    function renderIntraPolygons () {
        for (let i = 0; i < dotsPerCircle; i += 1) {
            screen.addCurve({
                points: innerCircles.map(({dots}) => dots[i]),
                close:  true,
                lineWidth: 0.015,
                strokeColor: '#097',
                opacity: intraPolygonsOpacity.currentValue()
            })
        }
    }
    
    
    function renderPath (dot) {
        screen.addCurve({
            points: dot.path,
            lineWidth: 0.01,
            strokeColor: '#000',
            opacity: pathsOpacity.currentValue() * (0.5 + 0.5 * gearsOpacity.currentValue())
        })
    }
    
    
    function renderDot (dot) {
        
        screen.addCircle({
            center: dot,
            radius: 0.028,
            lineWidth: 0.005,
            strokeColor: '#FFF'
        })
        
        screen.addCircle({
            center: dot,
            radius: 0.02,
            fillColor: 'white'
        })
    }
    
    screen.setOptimalView([
        {x: -1.9, y: -1, radius: 0.2},
        {x:  1,  y: 1, radius: 0.2}
    ])
    
    
    
    function loop () {
        let angle = time() * rotationSpeed / speedRatio
        innerCircles.forEach(innerCircle => move(innerCircle, angle))
        render()
    }
    
    
    init()
    
    onEveryFrame(loop)
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    function setPointiness (value) {
        pointiness = value
        buildPaths()
    }
    
    function setVertices (value) {
        vertices = value
        addDotsSlider()
        init()
    }
    
    function setDotsPerCircle (value) {
        dotsPerCircle = value
        init()
    }
    
    
    let dotsSlider
    
    
    function addDotsSlider () {
        if (dotsSlider) {
            dotsSlider.remove()
        }
        
        dotsSlider = ui.addSlider({
            label: 'dots per circle',
            value: dotsPerCircle,
            step: 1,
            min:  1,
            max:  vertices - 1,
            onChanged: setDotsPerCircle,
            style: {
                top: '40px'
            }
        })
    }
    
    
    let verticesSlider = ui.addSlider({
        label: 'star vertices',
        value: vertices,
        step: 1,
        min:  3,
        max: 20,
        onChanged: setVertices
    })
    
    
    let pointinessSlider = ui.addSlider({
        label: 'pointiness',
        value: pointiness,
        min: 0,
        max: 1,
        onChanged: setPointiness,
        style: {
            top: '80px'
        }
    })
    
    
    
    ui.addBox({
        content: 'randomize',
        style: {
            margin: '8px',
            padding: '5px',
            top:  '130px',
            cursor: 'pointer',
            background: '#fa4',
            color: '#333',
            border: '1px solid #fa4'
        },
        click: () => {
            
            verticesSlider.value(random.intBetween(3, 20))
            dotsSlider.value(random.intBetween(1, verticesSlider.value() - 1))
            pointinessSlider.value(random.between(0, 1))
        }
    })
    
    
    let yButton = 120
    
    createHideShowButton({
        text: 'star',
        opacity: pathsOpacity
    })
    
    createHideShowButton({
        text: 'inner polygons',
        opacity: innerPolygonsOpacity
    })
    
    createHideShowButton({
        text: 'intra polygons',
        opacity: intraPolygonsOpacity
    })
    
    createHideShowButton({
        text: 'gears',
        opacity: gearsOpacity
    })
    
    
    
    function createHideShowButton ({
        text,
        opacity
    }) {
        
        let showButton = ui.addBox({
            content: 'show ' + text,
            style: {
                margin: '8px',
                padding: '5px',
                bottom: yButton + 'px',
                cursor: 'pointer',
                background: '#fa4',
                color: '#333',
                border: '1px solid #fa4'
            },
            click: () => {
                showButton.hide()
                hideButton.show()
                opacity.change(1, 500)
            }
        })
        
        let hideButton = ui.addBox({
            content: 'hide ' + text,
            style: {
                margin: '8px',
                padding: '5px',
                bottom: yButton + 'px',
                cursor: 'pointer',
                background: '#333',
                color:      '#fa4',
                border: '1px solid #fa4'
            },
            click: () => {
                hideButton.hide()
                showButton.show()
                opacity.change(0, 500)
            }
        })
        
        if (opacity.currentValue() < 0.5) {
            hideButton.hide()
        } else {
            showButton.hide()
        }
        
        yButton -= 40
    }
    
    
    ui.addBox({
        content: 'made on Explorers<br>by pierre.lancien@toxicode.fr',
        style: {
            textAlign: 'center',
            lineHeight: '1.5',
            fontSize: '12px',
            margin: '8px',
            bottom:  '0px',
            right:   '0px',
            color:   '#000'
        }
    })
    
    

})





//----------------------------------------- FUNCS



