import { App } from '~/App'
import { InstructionsModal } from '~/InstructionsModal'

let app: App | null = null
let instructionsModal: InstructionsModal | null = null

const welcomeScreen = document.getElementById('welcome-screen')
const enterButton = document.getElementById('enter-app') as HTMLButtonElement
const canvas = document.querySelector('canvas')!
const loader = document.querySelector('.loader') as HTMLElement

async function initializeApp() {
  if (app) return app

  canvas.style.display = 'block'
  loader.style.display = 'flex'

  app = await App.mount({
    debug: true,
    canvas
  })

  document.body.classList.add('loaded')

  setTimeout(() => {
    if (!instructionsModal) {
      instructionsModal = new InstructionsModal()
    }
    instructionsModal.show()
  }, 1000)

  return app
}

function hideWelcomeScreen() {
  if (welcomeScreen) {
    welcomeScreen.classList.add('hidden')
    setTimeout(() => {
      welcomeScreen.style.display = 'none'
    }, 800)
  }
}

if (enterButton && welcomeScreen) {
  enterButton.addEventListener('click', async () => {
    enterButton.disabled = true
    enterButton.style.opacity = '0.6'

    hideWelcomeScreen()

    setTimeout(async () => {
      await initializeApp()
    }, 400)
  })
}

enterButton?.addEventListener('mouseenter', () => {
  enterButton.style.transform = 'translateY(-2px) scale(1.02)'
})

enterButton?.addEventListener('mouseleave', () => {
  if (!enterButton.disabled) {
    enterButton.style.transform = 'translateY(0) scale(1)'
  }
})
