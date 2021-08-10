// globals
const container = document.querySelector('.container')
let contentsBounds = container.getBoundingClientRect()
let width = 800
let height = 500
let ratio = contentsBounds.width / width
width *= ratio
height *= ratio

// elements
const $tokenSliderContainer = document.getElementById('tokenSliders')
const $ACoeffSlider = document.getElementById('ACoeffSlider')
const $price = document.getElementById('price')
const $amountOut = document.getElementById('amountOut')
const $tokenSellSlider = document.getElementById('tokenSellSlider')
let $tokenSliders = $tokenSliderContainer.querySelectorAll('.tokenSlider')
let $tokenValues = $tokenSliderContainer.querySelectorAll('.tokenValue')
const $ACoeffValue = document.getElementById('ACoeffValue')
const $addToken = document.getElementById('addToken')
const $tokenIn = document.getElementById('tokenIn')
const $tokenOut = document.getElementById('tokenOut')

const a = 10
const b = Math.pow(a, 1 / a)
const maxLoopLimit = 1000

function sliderOutput ($slider) {
  const x = Number($slider.value)
  return a * Math.pow(b, x)
}

function findSliderInput (x) {
  return Math.log(x / a) / Math.log(b)
}

const poolA = 1000000
const poolB = 1000000
const poolValues = [poolA, poolB]

let __A = 85
let A_PRECISION = 100
let A = __A * A_PRECISION
const maxA = 10 ** 6
let xp = poolValues

function multiplyPoolValues (v = poolValues) {
  let mul = 1
  for (let i = 0; i < v.length; i++) {
    mul *= v[i]
  }
  return mul
}

function sumPoolValues () {
  let sum = 0
  for (let i = 0; i < poolValues.length; i++) {
    sum += poolValues[i]
  }
  return sum
}

function sumMaxPoolValues () {
  let sum = 0
  for (let i = 0; i < 2; i++) {
    sum += 1000000
  }
  return sum
}

// let k = poolA + poolB // D
let k = sumPoolValues()
const nT = poolValues.length
const S = () => (A * multiplyPoolValues()) / ((k / nT) ** nT)

poolValues.forEach((poolValue, i) => {
  $tokenSliders[i].value = findSliderInput(poolValue)
})

$ACoeffSlider.value = findSliderInput(__A)

const rangeValues = {
  k: k,
  s: S() * A
}

const cb = (event) => {
  const $tokenSlider = event.target
  const value = sliderOutput($tokenSlider)
  const i = [].slice.call($tokenSliders).indexOf($tokenSlider)
  poolValues[i] = value
  xp = poolValues
  k = sumPoolValues()
  rangeValues.s = S() * A
  render()
  updateEstimate()
}

function updateEvenListener () {
  $tokenIn.innerHTML = ''
  $tokenSliders.forEach(($tokenSlider, i) => {
    const $option = document.createElement('option')
    $option.value = i
    $option.text = 'Token ' + String.fromCharCode(65 + i)
    $tokenIn.appendChild($option)
  })
  $tokenIn.selectedIndex = 0
  $tokenIn.addEventListener('change', (event) => {
    updateEstimate()
  })

  $tokenOut.innerHTML = ''
  $tokenSliders.forEach(($tokenSlider, i) => {
    const $option = document.createElement('option')
    $option.value = i
    $option.text = 'Token ' + String.fromCharCode(65 + i)
    $tokenOut.appendChild($option)
  })
  $tokenOut.selectedIndex = 1
  $tokenOut.addEventListener('change', (event) => {
    updateEstimate()
  })

  $tokenSliders.forEach(($tokenSlider, i) => {
    $tokenSlider.removeEventListener('input', cb)
    $tokenSlider.addEventListener('input', cb)
  })
}

updateEvenListener()

$addToken.addEventListener('click', (event) => {
  event.preventDefault()
  const index = $tokenSliders.length
  const $lastTokeSlider = $tokenSliders[$tokenSliders.length - 1]
  const $clone = $lastTokeSlider.closest('.slider').cloneNode(true)
  $clone.querySelector('.name').innerText = String.fromCharCode(65 + index)
  $tokenSliderContainer.appendChild($clone)
  $tokenSliders = $tokenSliderContainer.querySelectorAll('.tokenSlider')
  $tokenValues = $tokenSliderContainer.querySelectorAll('.tokenValue')

  poolValues.push(1000000)
  xp = poolValues
  k = sumPoolValues()
  rangeValues.s = S() * A

  updateEvenListener()
  updateEstimate()
})

$ACoeffSlider.addEventListener('input', (event) => {
  const value = sliderOutput($ACoeffSlider)
  __A = value
  A_PRECISION = 100
  A = __A * A_PRECISION
  rangeValues.s = S() * A
  render()
  updateEstimate()
})

function moveDot (values) {
  // const _x = Number($tokenASellSlider.value)
  // if (!_x) return
  // const [_y] = calculateSwap(_x)
  const y = values[1]
  const x = values[0]
  $price.innerText = formatNumber(y / x)
  if (chart && chart.tip) {
    chart.tip.move({ x, y })
    chart.tip.show()
  }
}

function updateEstimate () {
  const value = Number($tokenSellSlider.value)

  const fromToken = $tokenIn.selectedIndex
  const toToken = $tokenOut.selectedIndex

  const [y] = calculateSwap(value, fromToken, toToken)
  const poolFrom = poolValues[fromToken] + value
  const poolTo = poolValues[toToken] - y

  const _poolValues = []
  poolValues.forEach((v, i) => {
    if (v === poolFrom) {
      _poolValues[i] = poolFrom
    } else if (v === poolTo) {
      _poolValues[i] = poolTo
    } else {
      _poolValues[i] = poolValues[i]
    }
  })

  $price.innerText = formatNumber(y / value)
  $amountOut.innerText = formatNumber(y)
  // moveDot([poolA, poolB])
  render(_poolValues)
}

$tokenSellSlider.addEventListener('input', (event) => {
  updateEstimate()
})

function main () {
  updateEstimate()
  render()
}

main()

function derivativeLabel (x, y) {
  const [_y] = calculateSwap(x)
  return `Price: ${formatNumber(_y / x)} Y/X`
}

async function render (renderPrice) {
  const x = 1
  const [y] = calculateSwap(x)
  // $price.innerHTML = `${(y/x).toFixed(3)}`

  $tokenValues.forEach(($tokenValue, i) => {
    $tokenValue.innerText = formatNumber(poolValues[i])
  })

  $ACoeffValue.innerText = formatNumber(__A)

  function r (expression, variables) {
    return expression
      .replaceAll('y', variables.y || 0)
      .replaceAll('x', variables.x || 'x')
      .replaceAll('k', variables.k || 0)
      .replaceAll('n', variables.n || 0)
      .replaceAll('s', variables.s || 0)
      .replaceAll('C', variables.C || 0)
  }

  const formulas = {
    chi: '(s*k+((k/n)^n)-s*x)*((s+x)^-1)'
  }

  const derivatives = {
    chi: '(-(s+x)^-1)*(s+(s*k+(k^n)(n^-n)-(s*x))*((s+x)^-1))'
  }

  const data = [
    {
      fn: r(formulas.chi, { k: rangeValues.k, s: rangeValues.s, n: nT }),
      color: 'blue',

      derivative: {
        fn: r(derivatives.chi, { k: rangeValues.k, s: rangeValues.s, n: nT }),
        updateOnMouseMove: true
      }
    }
  ]

  // if (renderPrice) {
  if (false) {
    const S = () => (A * multiplyPoolValues(renderPrice)) / ((k / nT) ** nT)
    const s = S() * A
    data.push(
      {
        fn: r(formulas.chi, { k: rangeValues.k, s: s, n: nT }),
        color: 'green'
      }
    )
  }

  window.chart = functionPlot({
    target: '#chart',
    title: 'StableSwap Graph',
    width,
    height,
    yAxis: {
      label: 'Y ($)',
      domain: [0, sumMaxPoolValues()]
    },
    xAxis: {
      label: 'X ($)',
      domain: [0, sumMaxPoolValues()]
    },
    grid: false,
    disableZoom: false,
    tip: {
      xLine: true,
      yLine: true,
      renderer: (x, y, i) => {
        return derivativeLabel(x, y)
      }
    },
    data
  })

  // moveDot()
}

function getY (x, tokenIndexFrom = 0, tokenIndexTo = 1) {
  const d = getD()
  let c = d
  let s = 0
  const nA = nT * A

  let _x = 0
  for (let i = 0; i < nT; i++) {
    if (i === tokenIndexFrom) {
      _x = x
    } else if (i !== tokenIndexTo) {
      _x = xp[i]
    } else {
      continue
    }
    s = s + _x
    c = (c * d) / (_x * nT)
  }
  c = ((c * d) * A_PRECISION) / (nA * nT)
  const b = s + ((d * A_PRECISION) / nA)
  let yPrev = 0
  let y = d

  for (let i = 0; i < maxLoopLimit; i++) {
    yPrev = y
    y = ((y * y) + c) / (((y * 2) + b) - d)
    if (within1(y, yPrev)) {
      return y
    }
  }

  throw new Error('Approximation did not converge')
}

function getD () {
  let s = 0
  for (let i = 0; i < nT; i++) {
    s = s + xp[i]
  }
  if (s === 0) {
    return 0
  }

  let prevD = 0
  let d = s
  const nA = A * nT
  for (let i = 0; i < maxLoopLimit; i++) {
    let dp = d
    for (let j = 0; j < nT; j++) {
      dp = ((dp * d) / (xp[j] * nT))
    }
    prevD = d
    d = (
      (
        (((nA * s) / A_PRECISION) + (dp * nT)) * d
      ) / (
        (((nA - A_PRECISION) * d) / A_PRECISION) + ((nT + 1) * dp)
      ))

    if (within1(d, prevD)) {
      return d
    }
  }

  throw new Error('D does not converge')
}

function calculateSwap (dx, tokenIndexFrom = 0, tokenIndexTo = 1) {
  // const fee = 0.0004
  const fee = 0

  const x = (dx + xp[tokenIndexFrom])
  const y = getY(x, tokenIndexFrom, tokenIndexTo)
  let dy = (xp[tokenIndexTo] - y)
  const dyFee = fee ? dy * fee : 0
  dy = Math.max((dy - dyFee), 0)
  return [dy, dyFee]
}

function within1 (a, b) {
  return difference(a, b) <= 1
}

function difference (a, b) {
  if (a > b) {
    return a - b
  }
  return b - a
}

window.addEventListener('resize', () => {
  contentsBounds = container.getBoundingClientRect()
  ratio = contentsBounds.width / width
  width *= ratio
  height *= ratio
  render()
})

function formatNumber (v) {
  return Number(v.toFixed(5))
}
