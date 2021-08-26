import * as tmImage from '@teachablemachine/image'
import { maxBy } from 'lodash'
import { RefObject, useEffect, useRef, useState } from 'react'

const URL = 'https://teachablemachine.withgoogle.com/models/qXRFwExvL/'
const modelURL = URL + 'model.json'
const metadataURL = URL + 'metadata.json'

type PredictionClassnames = 'Right' | 'Left' | 'Neutro' | 'Reverse' | 'Forward'

export const useCamaraController = (containerRef: RefObject<HTMLDivElement | null>, enabled: boolean) => {
  const [mounted, setMounted] = useState(false)
  const [actualPrediction, setPrediction] = useState<PredictionClassnames>()

  const flip = true // whether to flip the webcam
  const width = 200
  const height = 200
  const webcam = new tmImage.Webcam(width, height, flip)

  const model = useRef<tmImage.CustomMobileNet>()

  useEffect(() => {
    tmImage.load(modelURL, metadataURL).then((v) => {
      model.current = v
    })
  }, [])

  const forward = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }))

    setTimeout(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }))
    }, 500)
  }

  const backward = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }))

    setTimeout(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 's' }))
    }, 500)
  }

  const left = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))

    setTimeout(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }))
    }, 500)
  }

  const right = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }))

    setTimeout(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' }))
    }, 500)
  }

  const executePrediction = (label: PredictionClassnames) => {
    switch (label) {
      case 'Right':
        right()
        return

      case 'Left':
        left()
        return

      case 'Reverse':
        backward()
        return

      case 'Forward':
        console.log('forward')
        forward()
        return
    }
  }

  const loop = async () => {
    webcam.update()
    await predict()
    window.requestAnimationFrame(loop)
  }

  const predict = async () => {
    if (!model.current) {
      return
    }
    // predict can take in an image, video or canvas html element
    const predictions = await model.current.predict(webcam.canvas)

    const currentPrediction = maxBy(predictions, (v) => v.probability)

    if (!currentPrediction) {
      return
    }

    if (actualPrediction !== currentPrediction.className) {
      setPrediction(currentPrediction.className as PredictionClassnames)
    }

    executePrediction(currentPrediction.className as PredictionClassnames)
  }

  useEffect(() => {
    if (!mounted && enabled) {
      if (containerRef.current) {
        webcam.setup().then(() => {
          setMounted(true)
          containerRef.current?.appendChild(webcam.canvas)
          webcam.play().then((v) => window.requestAnimationFrame(loop))
        })
      }
    }
  }, [containerRef.current, enabled])

  return actualPrediction
}
