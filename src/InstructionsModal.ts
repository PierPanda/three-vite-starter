export class InstructionsModal {
  private modal: HTMLElement | null = null
  private overlay: HTMLElement | null = null
  private closeButton: HTMLElement | null = null
  private continueButton: HTMLElement | null = null
  private isVisible: boolean = false

  constructor() {
    this.modal = document.getElementById('instructions-modal')
    this.overlay = document.getElementById('instructions-overlay')
    this.closeButton = document.getElementById('instructions-close')
    this.continueButton = document.getElementById('instructions-continue')

    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    if (this.closeButton) {
      this.closeButton.addEventListener('click', () => this.hide())
    }

    if (this.continueButton) {
      this.continueButton.addEventListener('click', () => this.hide())
    }

    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) {
          this.hide()
        }
      })
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide()
      }
    })
  }

  public show(): void {
    if (!this.modal || !this.overlay) return

    this.isVisible = true
    this.overlay.style.display = 'flex'

    requestAnimationFrame(() => {
      this.overlay?.classList.add('show')
      this.modal?.classList.add('show')
    })

    document.body.style.overflow = 'hidden'
  }

  public hide(): void {
    if (!this.modal || !this.overlay) return

    this.isVisible = false
    this.overlay.classList.remove('show')
    this.modal.classList.remove('show')

    setTimeout(() => {
      if (this.overlay) {
        this.overlay.style.display = 'none'
      }
      document.body.style.overflow = ''
    }, 300)
  }

  public dispose(): void {
    this.hide()

    if (this.closeButton) {
      this.closeButton.removeEventListener('click', () => this.hide())
    }

    if (this.continueButton) {
      this.continueButton.removeEventListener('click', () => this.hide())
    }

    if (this.overlay) {
      this.overlay.removeEventListener('click', () => this.hide())
    }

    document.removeEventListener('keydown', () => this.hide())
  }
}