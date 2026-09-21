// roulette 참고 프로젝트의 VideoRecorder를 기반으로, 다운로드 대신 Blob을 콜백으로 넘기도록 단순화
export class CanvasVideoRecorder {
  private recorder: MediaRecorder | null = null
  private chunks: Blob[] = []

  start(canvas: HTMLCanvasElement) {
    this.chunks = []
    const stream = canvas.captureStream(30)
    this.recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 6_000_000 })
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data)
    }
    this.recorder.start()
  }

  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.recorder) {
        resolve(new Blob())
        return
      }
      this.recorder.onstop = () => {
        resolve(new Blob(this.chunks, { type: 'video/webm' }))
      }
      this.recorder.stop()
    })
  }
}
